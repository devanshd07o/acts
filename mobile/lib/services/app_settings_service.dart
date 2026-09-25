import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AppSettingsService extends ChangeNotifier {
  static final AppSettingsService _instance = AppSettingsService._internal();
  factory AppSettingsService() => _instance;
  AppSettingsService._internal();

  static const String _keyCanvasStretch = 'acts_canvas_stretch';
  static const String _keyGeminiKey = 'acts_gemini_api_key';
  static const String _keyGroqKey = 'acts_groq_api_key';
  static const String _keyActiveAi = 'acts_active_ai_provider';
  static const String _keyIncidentAlerts = 'acts_incident_alerts';
  static const String _keyAutoRefresh = 'acts_auto_refresh';

  SharedPreferences? _prefs;

  // Defaults
  bool _isFullWindowStretch = true; // Default edge-to-edge as requested
  String _geminiApiKey = '';
  String _groqApiKey = '';
  String _activeAiProvider = 'gemini'; // 'gemini' or 'groq'
  bool _incidentAlerts = true;
  bool _autoRefreshFeed = true;

  bool get isFullWindowStretch => _isFullWindowStretch;
  String get geminiApiKey => _geminiApiKey;
  String get groqApiKey => _groqApiKey;
  String get activeAiProvider => _activeAiProvider;
  bool get incidentAlerts => _incidentAlerts;
  bool get autoRefreshFeed => _autoRefreshFeed;

  Future<void> init() async {
    _prefs ??= await SharedPreferences.getInstance();
    _isFullWindowStretch = _prefs?.getBool(_keyCanvasStretch) ?? true;
    _geminiApiKey = _prefs?.getString(_keyGeminiKey) ?? '';
    _groqApiKey = _prefs?.getString(_keyGroqKey) ?? '';
    _activeAiProvider = _prefs?.getString(_keyActiveAi) ?? 'gemini';
    _incidentAlerts = _prefs?.getBool(_keyIncidentAlerts) ?? true;
    _autoRefreshFeed = _prefs?.getBool(_keyAutoRefresh) ?? true;
    notifyListeners();
  }

  Future<void> setCanvasStretch(bool isStretch) async {
    _isFullWindowStretch = isStretch;
    await _prefs?.setBool(_keyCanvasStretch, isStretch);
    notifyListeners();
  }

  Future<void> setGeminiApiKey(String key) async {
    _geminiApiKey = key.trim();
    await _prefs?.setString(_keyGeminiKey, _geminiApiKey);
    notifyListeners();
  }

  Future<void> setGroqApiKey(String key) async {
    _groqApiKey = key.trim();
    await _prefs?.setString(_keyGroqKey, _groqApiKey);
    notifyListeners();
  }

  Future<void> setActiveAiProvider(String provider) async {
    _activeAiProvider = provider;
    await _prefs?.setString(_keyActiveAi, provider);
    notifyListeners();
  }

  Future<void> setIncidentAlerts(bool val) async {
    _incidentAlerts = val;
    await _prefs?.setBool(_keyIncidentAlerts, val);
    notifyListeners();
  }

  Future<void> setAutoRefresh(bool val) async {
    _autoRefreshFeed = val;
    await _prefs?.setBool(_keyAutoRefresh, val);
    notifyListeners();
  }
}
