import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:dio/dio.dart';
import 'package:image_picker/image_picker.dart';
import '../config/api_constants.dart';
import '../models/complaint_model.dart';
import '../models/map_marker_model.dart';

String getBaseUrl() {
  if (!kIsWeb && Platform.isAndroid) {
    return 'http://10.0.2.2:8000';
  }
  return 'http://127.0.0.1:8000';
}

class ApiException implements Exception {
  final String message;
  final int? statusCode;

  ApiException(this.message, {this.statusCode});

  @override
  String toString() => message;
}

class ApiClient {
  final Dio _dio;

  ApiClient({Dio? dio})
      : _dio = dio ??
            Dio(
              BaseOptions(
                baseUrl: getBaseUrl(),
                connectTimeout: const Duration(seconds: 15),
                receiveTimeout: const Duration(seconds: 25),
                headers: {
                  'Accept': 'application/json',
                  'Cache-Control': 'no-cache, no-store, must-revalidate',
                  'Pragma': 'no-cache',
                },
              ),
            );

  ApiException _handleDioError(DioException e) {
    if (e.type == DioExceptionType.connectionTimeout ||
        e.type == DioExceptionType.sendTimeout ||
        e.type == DioExceptionType.receiveTimeout) {
      return ApiException('Connection timed out. Please check if the backend is running.', statusCode: 408);
    }
    if (e.type == DioExceptionType.connectionError) {
      return ApiException('Cannot connect to backend (${getBaseUrl()}). Verify server is active.', statusCode: 503);
    }
    if (e.response != null) {
      final code = e.response!.statusCode;
      final data = e.response!.data;
      if (data is Map) {
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
      if (code == 404) return ApiException('Requested resource was not found (404).', statusCode: code);
      if (code == 429) return ApiException('Rate limit exceeded (429). Please wait a moment before trying again.', statusCode: code);
      if (code != null && code >= 500) return ApiException('Backend server error ($code). Please try again shortly.', statusCode: code);
      return ApiException('Request failed ($code): ${e.response?.statusMessage ?? "Bad Request"}', statusCode: code);
    }
    return ApiException(e.message ?? 'An unexpected network error occurred.');
  }

  /// Plain-text complaint submission with optional photo & GPS auto-fill
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
      Map<String, dynamic> formMap = {
        'raw_text': rawText,
        'citizen_description': rawText,
        'latitude': latitude.toStringAsFixed(6),
        'longitude': longitude.toStringAsFixed(6),
        'campus_zone': campusZone ?? '',
        'address': address ?? '',
        if (userIdentifier != null) 'user_identifier': userIdentifier,
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

  /// Fetches citizen submissions
  Future<List<ComplaintModel>> fetchMyComplaints({String? userIdentifier}) async {
    try {
      final response = await _dio.get(
        ApiConstants.listComplaints,
        queryParameters: {'user_identifier': userIdentifier ?? 'citizen_mobile'},
      );

      final List data = response.data is List
          ? response.data
          : (response.data['results'] ?? response.data);
      return data.map((json) => ComplaintModel.fromJson(json)).toList();
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  /// Fetches live crowd-weighted clusters for Admin Command Center Map
  Future<List<MapMarkerModel>> fetchMapMarkers() async {
    try {
      final response = await _dio.get(ApiConstants.adminMapMarkers);
      final List data = response.data is List ? response.data : (response.data['results'] ?? []);
      return data.map((json) => MapMarkerModel.fromJson(json)).toList();
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  /// Fetches single complaint detail
  Future<ComplaintModel> fetchComplaintDetail(String id) async {
    try {
      final response = await _dio.get('${ApiConstants.complaintDetail}$id/');
      return ComplaintModel.fromJson(response.data);
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  /// Step 6: Reporter 2-way confirmation or reopening of resolved issue
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

  /// Section 5.4: Admin manual override of priority
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

  /// Section 5.4: Campus Health Analytics
  Future<List<dynamic>> fetchCampusHealth() async {
    try {
      final response = await _dio.get('/api/admin/campus-health/');
      return response.data['campus_health'] ?? [];
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  /// Section 5.5: Admin Connect Portal direct directory
  Future<Map<String, dynamic>> fetchAdminConnect(String department) async {
    try {
      final response = await _dio.get(
        '/api/admin/connect/',
        queryParameters: {'department': department},
      );
      return response.data;
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }
}
