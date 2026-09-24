import 'package:flutter/foundation.dart';

class ApiConstants {
  // Use 10.0.2.2 for Android Emulator, localhost for iOS simulator/Web/Desktop, or custom IP for physical devices
  static String get baseUrl {
    if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android) {
      return 'http://10.0.2.2:8000';
    }
    return 'http://127.0.0.1:8000';
  }

  // Endpoints
  static const String reportComplaint = '/api/complaints/report/';
  static const String listComplaints = '/api/complaints/';
  static const String complaintDetail = '/api/complaints/';
  static const String adminMapMarkers = '/api/admin/map-markers/';
  static const String adminUpdateStatus = '/api/admin/complaints/';
}
