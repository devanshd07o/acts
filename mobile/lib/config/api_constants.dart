import 'package:flutter/foundation.dart';
import '../services/auth_service.dart';

class ApiConstants {
  static String get defaultBaseUrl {
    if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android) {
      return 'http://10.0.2.2:8000';
    }
    return 'http://127.0.0.1:8000';
  }

  static String get baseUrl {
    final custom = AuthService().customBaseUrl;
    if (custom != null && custom.isNotEmpty) {
      return custom;
    }
    return defaultBaseUrl;
  }

  // Auth Endpoints
  static const String tokenObtain = '/api/token/';
  static const String tokenRefresh = '/api/token/refresh/';
  static const String currentUser = '/api/me/';
  static const String citizenRegister = '/api/auth/register/';
  static const String googleAuthBridge = '/api/auth/google/';

  // Citizen Endpoints
  static const String reportComplaint = '/api/complaints/report/';
  static const String listComplaints = '/api/complaints/';
  static const String complaintDetail = '/api/complaints/';
  static const String notifications = '/api/notifications/';

  // Admin Endpoints
  static const String adminMapMarkers = '/api/admin/map-markers/';
  static const String adminClusters = '/api/admin/clusters/';
  static const String adminCampusHealth = '/api/admin/campus-health/';
  static const String adminConnect = '/api/admin/connect/';
  static const String adminCrews = '/api/admin/crews/';
}
