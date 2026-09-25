import 'package:dio/dio.dart';
import 'package:image_picker/image_picker.dart';
import '../config/api_constants.dart';
import '../models/complaint_model.dart';
import '../models/map_marker_model.dart';
import 'auth_service.dart';

class ApiException implements Exception {
  final String message;
  final int? statusCode;

  ApiException(this.message, {this.statusCode});

  @override
  String toString() => message;
}

class ApiClient {
  static final ApiClient _instance = ApiClient._internal();
  factory ApiClient() => _instance;

  late final Dio _dio;
  final AuthService _auth = AuthService();

  ApiClient._internal() {
    _dio = Dio(
      BaseOptions(
        baseUrl: ApiConstants.baseUrl,
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 25),
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      ),
    );

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          options.baseUrl = ApiConstants.baseUrl;
          final token = _auth.accessToken;
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (DioException error, handler) async {
          final is401 = error.response?.statusCode == 401;
          final notRetried = error.requestOptions.extra['retried'] != true;
          final refreshToken = _auth.refreshToken;

          if (is401 && notRetried && refreshToken != null && refreshToken.isNotEmpty) {
            error.requestOptions.extra['retried'] = true;
            try {
              final refreshDio = Dio(BaseOptions(baseUrl: ApiConstants.baseUrl));
              final refreshRes = await refreshDio.post(
                ApiConstants.tokenRefresh,
                data: {'refresh': refreshToken},
              );

              final newAccess = refreshRes.data['access'];
              if (newAccess != null) {
                await _auth.updateAccessToken(newAccess);
                error.requestOptions.headers['Authorization'] = 'Bearer $newAccess';
                final cloneReq = await _dio.fetch(error.requestOptions);
                return handler.resolve(cloneReq);
              }
            } catch (_) {
              await _auth.clearAuth();
            }
          }
          return handler.next(error);
        },
      ),
    );
  }

  ApiException _handleDioError(DioException e) {
    if (e.type == DioExceptionType.connectionTimeout ||
        e.type == DioExceptionType.sendTimeout ||
        e.type == DioExceptionType.receiveTimeout) {
      return ApiException('Connection timed out. Please check if the backend is running.', statusCode: 408);
    }
    if (e.type == DioExceptionType.connectionError) {
      return ApiException('Cannot connect to backend (${ApiConstants.baseUrl}). Verify server is active.', statusCode: 503);
    }
    if (e.response != null) {
      final code = e.response!.statusCode;
      final data = e.response!.data;
      if (data is Map) {
        if (data.containsKey('detail')) {
          return ApiException(data['detail'].toString(), statusCode: code);
        }
        final buffer = StringBuffer();
        data.forEach((k, v) {
          if (v is List) {
            buffer.write('$k: ${v.join(", ")} ');
          } else if (v is String) {
            buffer.write('$k: $v ');
          }
        });
        if (buffer.isNotEmpty) {
          return ApiException(buffer.toString().trim(), statusCode: code);
        }
      }
      if (code == 401) return ApiException('Invalid credentials or session expired (401).', statusCode: code);
      if (code == 403) return ApiException('Access forbidden. You do not have permissions for this action (403).', statusCode: code);
      if (code == 404) return ApiException('Requested resource was not found (404).', statusCode: code);
      if (code == 429) return ApiException('Rate limit exceeded (429). Please wait a moment before trying again.', statusCode: code);
      if (code != null && code >= 500) return ApiException('Backend server error ($code). Please try again shortly.', statusCode: code);
      return ApiException('Request failed ($code): ${e.response?.statusMessage ?? "Bad Request"}', statusCode: code);
    }
    return ApiException(e.message ?? 'An unexpected network error occurred.');
  }

  // ================= AUTH METHODS =================

  Future<Map<String, dynamic>> login(String username, String password) async {
    try {
      final tokenRes = await _dio.post(
        ApiConstants.tokenObtain,
        data: {'username': username, 'password': password},
      );

      final access = tokenRes.data['access'];
      final refresh = tokenRes.data['refresh'];

      final meRes = await _dio.get(
        ApiConstants.currentUser,
        options: Options(headers: {'Authorization': 'Bearer $access'}),
      );

      final isAdmin = meRes.data['is_admin'] == true;
      final resolvedUsername = meRes.data['username'] ?? username;
      final resolvedEmail = meRes.data['email']?.toString() ?? '';
      final resolvedFullName = meRes.data['full_name']?.toString() ?? resolvedUsername;

      await _auth.saveAuth(
        accessToken: access,
        refreshToken: refresh,
        username: resolvedUsername,
        email: resolvedEmail,
        fullName: resolvedFullName,
        isAdmin: isAdmin,
      );

      return {
        'username': resolvedUsername,
        'is_admin': isAdmin,
        'access': access,
        'refresh': refresh,
      };
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  Future<Map<String, dynamic>> register({
    required String username,
    required String password,
    String email = '',
    String fullName = '',
    String role = 'student',
  }) async {
    try {
      final res = await _dio.post(
        ApiConstants.citizenRegister,
        data: {
          'username': username,
          'password': password,
          'email': email,
          'full_name': fullName,
          'role': role,
        },
      );

      final access = res.data['access'];
      final refresh = res.data['refresh'];
      final isAdmin = res.data['is_admin'] == true;
      final registeredUser = res.data['username'] ?? username;

      if (access != null && refresh != null) {
        await _auth.saveAuth(
          accessToken: access,
          refreshToken: refresh,
          username: registeredUser,
          isAdmin: isAdmin,
        );
      }

      return res.data;
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  Future<Map<String, dynamic>> upvoteComplaint(String id) async {
    try {
      final res = await _dio.post('${ApiConstants.complaintDetail}$id/upvote/');
      return res.data is Map<String, dynamic> ? res.data : {'message': 'Upvoted'};
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  Future<void> logout() async {
    await _auth.clearAuth();
  }

  // ================= CITIZEN REPORTING =================

  Future<Map<String, dynamic>> submitComplaint({
    required String rawText,
    required double latitude,
    required double longitude,
    XFile? imageFile,
    String? campusZone,
    String? address,
    String? userIdentifier,
  }) async {
    try {
      final resolvedUser = userIdentifier ?? (_auth.isLoggedIn ? _auth.username : 'citizen_guest');

      Map<String, dynamic> formMap = {
        'raw_text': rawText,
        'citizen_description': rawText,
        'latitude': latitude.toStringAsFixed(6),
        'longitude': longitude.toStringAsFixed(6),
        'campus_zone': campusZone ?? '',
        'address': address ?? '',
        'user_identifier': resolvedUser,
      };

      if (imageFile != null) {
        String fileName = imageFile.name;
        if (!fileName.contains('.')) {
          fileName = '$fileName.jpg';
        }
        formMap['image'] = MultipartFile.fromBytes(
          await imageFile.readAsBytes(),
          filename: fileName,
        );
      }

      FormData formData = FormData.fromMap(formMap);

      final response = await _dio.post(
        ApiConstants.reportComplaint,
        data: formData,
      );

      return response.data;
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  Future<List<ComplaintModel>> fetchAllComplaints() async {
    try {
      final response = await _dio.get(
        ApiConstants.listComplaints,
        queryParameters: {'user_identifier': 'all'},
      );

      final List data = response.data is List
          ? response.data
          : (response.data['results'] ?? response.data);
      return data.map((json) => ComplaintModel.fromJson(json)).toList();
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  Future<List<ComplaintModel>> fetchMyComplaints({String? userIdentifier}) async {
    try {
      final resolvedUser = userIdentifier ?? (_auth.isLoggedIn ? _auth.username : 'citizen_guest');
      final response = await _dio.get(
        ApiConstants.listComplaints,
        queryParameters: {'user_identifier': resolvedUser},
      );

      final List data = response.data is List
          ? response.data
          : (response.data['results'] ?? response.data);
      return data.map((json) => ComplaintModel.fromJson(json)).toList();
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  Future<ComplaintModel> fetchComplaintDetail(String id) async {
    try {
      final response = await _dio.get('${ApiConstants.complaintDetail}$id/');
      return ComplaintModel.fromJson(response.data);
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  Future<void> confirmResolution({
    required String complaintId,
    required bool isConfirmed,
    String? feedback,
  }) async {
    try {
      await _dio.post(
        '${ApiConstants.complaintDetail}$complaintId/confirm/',
        data: {
          'is_confirmed': isConfirmed,
          'feedback': feedback ?? '',
        },
      );
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  // ================= ADMIN COMMAND CENTER =================

  Future<List<MapMarkerModel>> fetchMapMarkers() async {
    try {
      final response = await _dio.get(ApiConstants.adminMapMarkers);
      final List data = response.data is List ? response.data : (response.data['results'] ?? []);
      return data.map((json) => MapMarkerModel.fromJson(json)).toList();
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  Future<List<dynamic>> fetchAdminClusters({String? status}) async {
    try {
      final response = await _dio.get(
        ApiConstants.adminClusters,
        queryParameters: status != null ? {'status': status} : null,
      );
      return response.data is List ? response.data : (response.data['results'] ?? []);
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  Future<void> updateClusterStatus({
    required String clusterId,
    required String status,
  }) async {
    try {
      await _dio.patch(
        '${ApiConstants.adminClusters}$clusterId/status/',
        data: {'status': status},
      );
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  Future<void> overridePriority({
    required String clusterId,
    required double newPriority,
    String? adminNotes,
  }) async {
    try {
      await _dio.post(
        '/api/admin/clusters/$clusterId/override-priority/',
        data: {
          'priority': newPriority,
          'admin_notes': adminNotes ?? '',
        },
      );
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  Future<List<dynamic>> fetchCampusHealth() async {
    try {
      final response = await _dio.get(ApiConstants.adminCampusHealth);
      return response.data['campus_health'] ?? [];
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  Future<Map<String, dynamic>> fetchAdminConnect(String department) async {
    try {
      final response = await _dio.get(
        ApiConstants.adminConnect,
        queryParameters: {'department': department},
      );
      return response.data;
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  Future<List<dynamic>> fetchCrews() async {
    try {
      final response = await _dio.get(ApiConstants.adminCrews);
      return response.data is List ? response.data : (response.data['results'] ?? []);
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  Future<Map<String, dynamic>> overrideCluster(
    String clusterId,
    Map<String, dynamic> payload,
  ) async {
    try {
      final response = await _dio.patch(
        '${ApiConstants.adminClusters}$clusterId/override-priority/',
        data: payload,
      );
      return response.data is Map<String, dynamic>
          ? response.data as Map<String, dynamic>
          : {'message': 'Override applied'};
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  Future<Map<String, dynamic>> resolveCluster(String clusterId) async {
    try {
      final response = await _dio.patch(
        '${ApiConstants.adminClusters}$clusterId/status/',
        data: {'status': 'RESOLVED'},
      );
      return response.data is Map<String, dynamic>
          ? response.data as Map<String, dynamic>
          : {'message': 'Cluster resolved'};
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  Future<List<dynamic>> fetchNotifications() async {
    try {
      final response = await _dio.get(ApiConstants.notifications);
      return response.data is List ? response.data : (response.data['results'] ?? []);
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }
}
