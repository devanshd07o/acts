import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AuthService extends ChangeNotifier {
  static final AuthService _instance = AuthService._internal();
  factory AuthService() => _instance;
  AuthService._internal();

  static const String _keyAccessToken = 'acts_access_token';
  static const String _keyRefreshToken = 'acts_refresh_token';
  static const String _keyUsername = 'acts_username';
  static const String _keyEmail = 'acts_email';
  static const String _keyFullName = 'acts_full_name';
  static const String _keyPhotoUrl = 'acts_photo_url';
  static const String _keyIsAdmin = 'acts_is_admin';
  static const String _keyBaseUrl = 'acts_custom_base_url';
  static const String _keyRollNo = 'acts_roll_no';
  static const String _keyEmployeeId = 'acts_employee_id';

  SharedPreferences? _prefs;

  Future<void> init() async {
    _prefs ??= await SharedPreferences.getInstance();
  }

  bool get isLoggedIn {
    final token = _prefs?.getString(_keyAccessToken);
    return token != null && token.isNotEmpty;
  }

  bool get isAdmin {
    return _prefs?.getBool(_keyIsAdmin) ?? false;
  }

  String get username {
    final saved = _prefs?.getString(_keyUsername);
    if (saved != null && saved.isNotEmpty) return saved;
    return 'Campus User';
  }

  String get email {
    final saved = _prefs?.getString(_keyEmail);
    if (saved != null && saved.isNotEmpty) return saved;
    if (username.contains('@')) return username;
    return '$username@abesec.ac.in';
  }

  String get fullName {
    final saved = _prefs?.getString(_keyFullName);
    if (saved != null && saved.isNotEmpty) return saved;
    return username;
  }

  String? get photoUrl {
    return _prefs?.getString(_keyPhotoUrl);
  }

  String? get accessToken {
    return _prefs?.getString(_keyAccessToken);
  }

  String? get refreshToken {
    return _prefs?.getString(_keyRefreshToken);
  }

  String? get customBaseUrl {
    return _prefs?.getString(_keyBaseUrl);
  }

  String get rollNo {
    return _prefs?.getString(_keyRollNo) ?? '';
  }

  String get employeeId {
    return _prefs?.getString(_keyEmployeeId) ?? '';
  }

  Future<void> saveAuth({
    required String accessToken,
    required String refreshToken,
    required String username,
    required bool isAdmin,
    String? email,
    String? fullName,
    String? photoUrl,
    String? rollNo,
    String? employeeId,
  }) async {
    await init();
    await _prefs?.setString(_keyAccessToken, accessToken);
    await _prefs?.setString(_keyRefreshToken, refreshToken);
    await _prefs?.setString(_keyUsername, username);
    await _prefs?.setBool(_keyIsAdmin, isAdmin);

    if (email != null && email.isNotEmpty) {
      await _prefs?.setString(_keyEmail, email);
    } else {
      await _prefs?.remove(_keyEmail);
    }

    if (fullName != null && fullName.isNotEmpty) {
      await _prefs?.setString(_keyFullName, fullName);
    } else {
      await _prefs?.remove(_keyFullName);
    }

    if (photoUrl != null && photoUrl.isNotEmpty) {
      await _prefs?.setString(_keyPhotoUrl, photoUrl);
    } else {
      await _prefs?.remove(_keyPhotoUrl);
    }

    if (rollNo != null && rollNo.isNotEmpty) {
      await _prefs?.setString(_keyRollNo, rollNo);
    } else {
      await _prefs?.remove(_keyRollNo);
    }

    if (employeeId != null && employeeId.isNotEmpty) {
      await _prefs?.setString(_keyEmployeeId, employeeId);
    } else {
      await _prefs?.remove(_keyEmployeeId);
    }

    notifyListeners();
  }

  Future<void> updateAccessToken(String newAccessToken) async {
    await init();
    await _prefs?.setString(_keyAccessToken, newAccessToken);
    notifyListeners();
  }

  Future<void> setCustomBaseUrl(String url) async {
    await init();
    final trimmed = url.trim();
    if (trimmed.isEmpty) {
      await _prefs?.remove(_keyBaseUrl);
    } else {
      await _prefs?.setString(_keyBaseUrl, trimmed);
    }
    notifyListeners();
  }

  Future<void> clearTokens() async {
    await init();
    await _prefs?.remove(_keyAccessToken);
    await _prefs?.remove(_keyRefreshToken);
    notifyListeners();
  }

  Future<void> clearAuth() async {
    await init();
    await _prefs?.remove(_keyAccessToken);
    await _prefs?.remove(_keyRefreshToken);
    await _prefs?.remove(_keyUsername);
    await _prefs?.remove(_keyEmail);
    await _prefs?.remove(_keyFullName);
    await _prefs?.remove(_keyPhotoUrl);
    await _prefs?.remove(_keyIsAdmin);
    await _prefs?.remove(_keyRollNo);
    await _prefs?.remove(_keyEmployeeId);
    notifyListeners();
  }
}
