import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../config/theme.dart';
import '../services/app_settings_service.dart';
import '../services/auth_service.dart';
import '../services/theme_service.dart';

class SettingsDialog extends StatefulWidget {
  const SettingsDialog({super.key});

  static Future<void> show(BuildContext context) {
    return showDialog<void>(
      context: context,
      barrierDismissible: true,
      builder: (context) => const SettingsDialog(),
    );
  }

  @override
  State<SettingsDialog> createState() => _SettingsDialogState();
}

class _SettingsDialogState extends State<SettingsDialog> {
  final AppSettingsService _settings = AppSettingsService();
  final AuthService _auth = AuthService();

  final TextEditingController _geminiKeyController = TextEditingController();
  final TextEditingController _groqKeyController = TextEditingController();

  int _selectedTabIndex = 0; // 0: General, 1: Appearance, 2: AI Models, 3: Campus Grid, 4: About
  bool _obscureGemini = true;
  bool _obscureGroq = true;
  String? _savedBanner;

  @override
  void initState() {
    super.initState();
    _geminiKeyController.text = _settings.geminiApiKey;
    _groqKeyController.text = _settings.groqApiKey;
  }

  @override
  void dispose() {
    _geminiKeyController.dispose();
    _groqKeyController.dispose();
    super.dispose();
  }

  Future<void> _saveAiKeys() async {
    await _settings.setGeminiApiKey(_geminiKeyController.text);
    await _settings.setGroqApiKey(_groqKeyController.text);
    if (!mounted) return;
    setState(() {
      _savedBanner = "AI Engine configuration saved successfully.";
    });
    Future.delayed(const Duration(seconds: 3), () {
      if (mounted) setState(() => _savedBanner = null);
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final size = MediaQuery.of(context).size;
    final dialogWidth = (size.width * 0.78).clamp(680.0, 920.0);
    final dialogHeight = (size.height * 0.82).clamp(520.0, 680.0);

    final borderColor = isDark ? const Color(0xFF232B3B) : const Color(0xFFE2E8F0);
    final dialogBg = isDark ? const Color(0xFF0F1522) : Colors.white;
    final sidebarBg = isDark ? const Color(0xFF0A0E18) : const Color(0xFFF8FAFC);

    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
      child: Container(
        width: dialogWidth,
        height: dialogHeight,
        decoration: BoxDecoration(
          color: dialogBg,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: borderColor, width: 1.2),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: isDark ? 0.6 : 0.15),
              blurRadius: 36,
              offset: const Offset(0, 14),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(20),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // ===============================================================
              // 1. LEFT SIDEBAR NAVIGATION (Cursor / Antigravity IDE Layout)
              // ===============================================================
              Container(
                width: 220,
                decoration: BoxDecoration(
                  color: sidebarBg,
                  border: Border(
                    right: BorderSide(color: borderColor, width: 1.0),
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Top Settings Header
                    Padding(
                      padding: const EdgeInsets.fromLTRB(18, 20, 18, 12),
                      child: Row(
                        children: [
                          Icon(
                            Icons.settings_outlined,
                            size: 18,
                            color: isDark ? Colors.white70 : const Color(0xFF475569),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            "Settings",
                            style: GoogleFonts.comfortaa(
                              fontSize: 14,
                              fontWeight: FontWeight.w800,
                              color: isDark ? Colors.white : const Color(0xFF0F172A),
                            ),
                          ),
                        ],
                      ),
                    ),

                    Divider(color: borderColor, height: 1),
                    const SizedBox(height: 10),

                    // Navigation Tabs
                    Expanded(
                      child: ListView(
                        padding: const EdgeInsets.symmetric(horizontal: 10),
                        children: [
                          _buildSidebarItem(
                            index: 0,
                            icon: Icons.tune_rounded,
                            label: "General",
                            isDark: isDark,
                          ),
                          const SizedBox(height: 4),
                          _buildSidebarItem(
                            index: 1,
                            icon: Icons.palette_outlined,
                            label: "Appearance",
                            isDark: isDark,
                          ),
                          const SizedBox(height: 4),
                          _buildSidebarItem(
                            index: 2,
                            icon: Icons.psychology_outlined,
                            label: "AI Models & Keys",
                            isDark: isDark,
                          ),
                          const SizedBox(height: 4),
                          _buildSidebarItem(
                            index: 3,
                            icon: Icons.map_outlined,
                            label: "Campus Grid",
                            isDark: isDark,
                          ),
                          const SizedBox(height: 4),
                          _buildSidebarItem(
                            index: 4,
                            icon: Icons.info_outline_rounded,
                            label: "About ACTS",
                            isDark: isDark,
                          ),
                        ],
                      ),
                    ),

                    Divider(color: borderColor, height: 1),

                    // User Profile Card at Bottom Left (Devansh Dubey)
                    _buildUserProfileCard(isDark, borderColor),
                  ],
                ),
              ),

              // ===============================================================
              // 2. RIGHT CONTENT PANE
              // ===============================================================
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Top Right Header Bar with Close Button
                    Padding(
                      padding: const EdgeInsets.fromLTRB(28, 18, 18, 14),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                _getTabTitle(_selectedTabIndex),
                                style: GoogleFonts.comfortaa(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w900,
                                  color: isDark ? Colors.white : const Color(0xFF0F172A),
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                _getTabSubtitle(_selectedTabIndex),
                                style: GoogleFonts.comfortaa(
                                  fontSize: 11,
                                  color: isDark ? const Color(0xFF8A94A6) : AppTheme.textMutedLight,
                                ),
                              ),
                            ],
                          ),
                          IconButton(
                            icon: Icon(
                              Icons.close_rounded,
                              size: 20,
                              color: isDark ? Colors.white70 : const Color(0xFF64748B),
                            ),
                            tooltip: "Close",
                            onPressed: () => Navigator.of(context).pop(),
                          ),
                        ],
                      ),
                    ),

                    Divider(color: borderColor, height: 1),

                    // Banner Notification
                    if (_savedBanner != null)
                      Container(
                        color: const Color(0xFF10B981).withValues(alpha: 0.12),
                        padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 8),
                        child: Row(
                          children: [
                            const Icon(Icons.check_circle_rounded, color: Color(0xFF10B981), size: 16),
                            const SizedBox(width: 8),
                            Text(
                              _savedBanner!,
                              style: GoogleFonts.comfortaa(
                                fontSize: 11.5,
                                fontWeight: FontWeight.w700,
                                color: const Color(0xFF10B981),
                              ),
                            ),
                          ],
                        ),
                      ),

                    // Tab Body
                    Expanded(
                      child: SingleChildScrollView(
                        padding: const EdgeInsets.all(28),
                        child: _buildActiveTabContent(isDark, borderColor),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // --- SIDEBAR ITEM BUILDER ---
  Widget _buildSidebarItem({
    required int index,
    required IconData icon,
    required String label,
    required bool isDark,
  }) {
    final isSelected = _selectedTabIndex == index;
    return InkWell(
      onTap: () => setState(() => _selectedTabIndex = index),
      borderRadius: BorderRadius.circular(10),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
        decoration: BoxDecoration(
          color: isSelected
              ? (isDark ? const Color(0xFF1E283C) : const Color(0xFFE2E8F0))
              : Colors.transparent,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Row(
          children: [
            Icon(
              icon,
              size: 17,
              color: isSelected
                  ? (isDark ? Colors.white : const Color(0xFF0F172A))
                  : (isDark ? const Color(0xFF8A94A6) : const Color(0xFF64748B)),
            ),
            const SizedBox(width: 10),
            Text(
              label,
              style: GoogleFonts.comfortaa(
                fontSize: 12,
                fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                color: isSelected
                    ? (isDark ? Colors.white : const Color(0xFF0F172A))
                    : (isDark ? const Color(0xFF94A3B8) : const Color(0xFF475569)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // --- USER PROFILE CARD AT BOTTOM LEFT ---
  Widget _buildUserProfileCard(bool isDark, Color borderColor) {
    final displayName = _auth.fullName.isNotEmpty
        ? _auth.fullName
        : (_auth.username.isNotEmpty ? _auth.username : 'Campus User');
    final email = _auth.email.isNotEmpty
        ? _auth.email
        : (_auth.username.contains('@') ? _auth.username : '${_auth.username}@abesec.ac.in');
    final photoUrl = _auth.photoUrl;

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF0B101C) : const Color(0xFFF1F5F9),
      ),
      child: Row(
        children: [
          Container(
            width: 34,
            height: 34,
            decoration: const BoxDecoration(
              shape: BoxShape.circle,
              gradient: LinearGradient(
                colors: [Color(0xFFF97316), Color(0xFFEA580C)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
            child: ClipOval(
              child: photoUrl != null && photoUrl.isNotEmpty
                  ? Image.network(
                      photoUrl,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => _buildUserMonogram(displayName),
                    )
                  : _buildUserMonogram(displayName),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  displayName,
                  style: GoogleFonts.comfortaa(
                    fontSize: 11.5,
                    fontWeight: FontWeight.w800,
                    color: isDark ? Colors.white : const Color(0xFF0F172A),
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  email,
                  style: GoogleFonts.comfortaa(
                    fontSize: 9.5,
                    fontWeight: FontWeight.w600,
                    color: isDark ? const Color(0xFF8A94A6) : AppTheme.textMutedLight,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildUserMonogram(String name) {
    final initial = name.isNotEmpty ? name[0].toUpperCase() : 'D';
    return Center(
      child: Text(
        initial,
        style: const TextStyle(
          fontSize: 15,
          fontWeight: FontWeight.w900,
          color: Colors.white,
        ),
      ),
    );
  }

  String _getTabTitle(int index) {
    switch (index) {
      case 0:
        return "General";
      case 1:
        return "Appearance";
      case 2:
        return "AI Models & Keys";
      case 3:
        return "Campus Grid";
      case 4:
      default:
        return "About ACTS";
    }
  }

  String _getTabSubtitle(int index) {
    switch (index) {
      case 0:
        return "Canvas layout stretch, notification alerts, and operational toggles";
      case 1:
        return "Dark mode, light mode, and high-contrast institutional theme";
      case 2:
        return "Configure multimodal vision and fast inference engine credentials";
      case 3:
        return "ABES Engineering College 17-acre digital twin and GPS bounding";
      case 4:
      default:
        return "Autonomous Civic Triage System build version and platform credits";
    }
  }

  // --- TAB CONTENT ROUTER ---
  Widget _buildActiveTabContent(bool isDark, Color borderColor) {
    switch (_selectedTabIndex) {
      case 0:
        return _buildGeneralTab(isDark, borderColor);
      case 1:
        return _buildAppearanceTab(isDark, borderColor);
      case 2:
        return _buildAiModelsTab(isDark, borderColor);
      case 3:
        return _buildCampusGridTab(isDark, borderColor);
      case 4:
      default:
        return _buildAboutTab(isDark, borderColor);
    }
  }

  // ---------------------------------------------------------------------------
  // TAB 0: GENERAL
  // ---------------------------------------------------------------------------
  Widget _buildGeneralTab(bool isDark, Color borderColor) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _buildSectionGroupTitle("CANVAS & WINDOW EXECUTION"),
        const SizedBox(height: 10),
        _buildSettingsCard(
          isDark: isDark,
          borderColor: borderColor,
          title: "Canvas Window Width",
          description: "Choose between full-width responsive stretch or centered compact container.",
          trailing: ListenableBuilder(
            listenable: _settings,
            builder: (context, _) {
              final isStretch = _settings.isFullWindowStretch;
              return Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  _buildTogglePill(
                    label: "Edge-to-Edge",
                    isSelected: isStretch,
                    onTap: () => _settings.setCanvasStretch(true),
                    isDark: isDark,
                  ),
                  const SizedBox(width: 8),
                  _buildTogglePill(
                    label: "Centered",
                    isSelected: !isStretch,
                    onTap: () => _settings.setCanvasStretch(false),
                    isDark: isDark,
                  ),
                ],
              );
            },
          ),
        ),

        const SizedBox(height: 24),
        _buildSectionGroupTitle("CAMPUS NOTIFICATIONS & SYNC"),
        const SizedBox(height: 10),
        ListenableBuilder(
          listenable: _settings,
          builder: (context, _) {
            return Column(
              children: [
                _buildSettingsCard(
                  isDark: isDark,
                  borderColor: borderColor,
                  title: "Incident Escalation Alerts",
                  description: "Receive desktop notifications when peer students upvote high-risk campus hazards.",
                  trailing: Switch(
                    value: _settings.incidentAlerts,
                    activeTrackColor: const Color(0xFFF97316).withValues(alpha: 0.5),
                    activeThumbColor: const Color(0xFFF97316),
                    onChanged: (val) => _settings.setIncidentAlerts(val),
                  ),
                ),
                const SizedBox(height: 12),
                _buildSettingsCard(
                  isDark: isDark,
                  borderColor: borderColor,
                  title: "Auto-Refresh Live Campus Feed",
                  description: "Silently poll backend triage feed every 30 seconds for new community tickets.",
                  trailing: Switch(
                    value: _settings.autoRefreshFeed,
                    activeTrackColor: const Color(0xFFF97316).withValues(alpha: 0.5),
                    activeThumbColor: const Color(0xFFF97316),
                    onChanged: (val) => _settings.setAutoRefresh(val),
                  ),
                ),
              ],
            );
          },
        ),
      ],
    );
  }

  // ---------------------------------------------------------------------------
  // TAB 1: APPEARANCE
  // ---------------------------------------------------------------------------
  Widget _buildAppearanceTab(bool isDark, Color borderColor) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _buildSectionGroupTitle("THEME & ACCENT"),
        const SizedBox(height: 10),
        _buildSettingsCard(
          isDark: isDark,
          borderColor: borderColor,
          title: "Color Palette Mode",
          description: "Select interface brightness. Light mode matches college day labs; Dark mode for evening ops.",
          trailing: ValueListenableBuilder<ThemeMode>(
            valueListenable: ThemeService().themeModeNotifier,
            builder: (context, currentMode, _) {
              final isLight = currentMode == ThemeMode.light || (currentMode == ThemeMode.system && !isDark);
              return Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  _buildTogglePill(
                    label: "Bright / Light",
                    icon: Icons.light_mode_rounded,
                    isSelected: isLight,
                    onTap: () => ThemeService().setThemeMode(ThemeMode.light),
                    isDark: isDark,
                  ),
                  const SizedBox(width: 8),
                  _buildTogglePill(
                    label: "Night / Dark",
                    icon: Icons.dark_mode_rounded,
                    isSelected: !isLight,
                    onTap: () => ThemeService().setThemeMode(ThemeMode.dark),
                    isDark: isDark,
                  ),
                ],
              );
            },
          ),
        ),
      ],
    );
  }

  // ---------------------------------------------------------------------------
  // TAB 2: AI MODELS & KEYS
  // ---------------------------------------------------------------------------
  Widget _buildAiModelsTab(bool isDark, Color borderColor) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            _buildSectionGroupTitle("NEURAL MULTIMODAL VISION & LLM ENGINE"),
            ElevatedButton.icon(
              onPressed: _saveAiKeys,
              icon: const Icon(Icons.check_rounded, size: 14),
              label: Text("Save Credentials", style: GoogleFonts.comfortaa(fontSize: 11, fontWeight: FontWeight.w700)),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFF97316),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        _buildSettingsCard(
          isDark: isDark,
          borderColor: borderColor,
          title: "Multimodal Vision API Key",
          description: "Powers automatic defect visual classification, hazard rating, and follow-up question generation.",
          trailing: SizedBox(
            width: 280,
            child: TextField(
              controller: _geminiKeyController,
              obscureText: _obscureGemini,
              style: GoogleFonts.comfortaa(fontSize: 11.5, color: isDark ? Colors.white : const Color(0xFF0F172A)),
              decoration: InputDecoration(
                hintText: "AIzaSy...",
                hintStyle: GoogleFonts.comfortaa(fontSize: 11, color: isDark ? Colors.white38 : Colors.black38),
                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: BorderSide(color: borderColor),
                ),
                suffixIcon: IconButton(
                  icon: Icon(
                    _obscureGemini ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                    size: 16,
                  ),
                  onPressed: () => setState(() => _obscureGemini = !_obscureGemini),
                ),
              ),
            ),
          ),
        ),

        const SizedBox(height: 14),
        _buildSettingsCard(
          isDark: isDark,
          borderColor: borderColor,
          title: "High-Speed Inference API Key (Groq / Fast LLM)",
          description: "Fast keyword deduplication, standard category clustering, and low-latency gap resolution.",
          trailing: SizedBox(
            width: 280,
            child: TextField(
              controller: _groqKeyController,
              obscureText: _obscureGroq,
              style: GoogleFonts.comfortaa(fontSize: 11.5, color: isDark ? Colors.white : const Color(0xFF0F172A)),
              decoration: InputDecoration(
                hintText: "gsk_...",
                hintStyle: GoogleFonts.comfortaa(fontSize: 11, color: isDark ? Colors.white38 : Colors.black38),
                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: BorderSide(color: borderColor),
                ),
                suffixIcon: IconButton(
                  icon: Icon(
                    _obscureGroq ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                    size: 16,
                  ),
                  onPressed: () => setState(() => _obscureGroq = !_obscureGroq),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  // ---------------------------------------------------------------------------
  // TAB 3: CAMPUS GRID
  // ---------------------------------------------------------------------------
  Widget _buildCampusGridTab(bool isDark, Color borderColor) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _buildSectionGroupTitle("ABES ENGINEERING COLLEGE DIGITAL TWIN GRID"),
        const SizedBox(height: 10),
        _buildSettingsCard(
          isDark: isDark,
          borderColor: borderColor,
          title: "Campus Spatial Geofence",
          description: "ABESEC NH-09 Campus boundary: 17 Acres, 16 verified structures, 28.6333° N, 77.4485° E.",
          trailing: Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: const Color(0xFF10B981).withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              "Active & Calibrated",
              style: GoogleFonts.comfortaa(fontSize: 11, fontWeight: FontWeight.w700, color: const Color(0xFF10B981)),
            ),
          ),
        ),
        const SizedBox(height: 12),
        _buildSettingsCard(
          isDark: isDark,
          borderColor: borderColor,
          title: "3D Engine Endpoint",
          description: "Photo-verified Three.js campus mesh running on local daemon (http://127.0.0.1:5173).",
          trailing: Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: const Color(0xFF2563EB).withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              "Daemon Synced",
              style: GoogleFonts.comfortaa(fontSize: 11, fontWeight: FontWeight.w700, color: const Color(0xFF2563EB)),
            ),
          ),
        ),
      ],
    );
  }

  // ---------------------------------------------------------------------------
  // TAB 4: ABOUT
  // ---------------------------------------------------------------------------
  Widget _buildAboutTab(bool isDark, Color borderColor) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _buildSectionGroupTitle("PLATFORM ARCHITECTURE"),
        const SizedBox(height: 10),
        _buildSettingsCard(
          isDark: isDark,
          borderColor: borderColor,
          title: "ACTS — Autonomous Campus Triage System",
          description: "Version 2.4.0-Production (Build Windows x64 Native). ABES Engineering College.",
          trailing: Text(
            "v2.4.0-Prod",
            style: GoogleFonts.comfortaa(fontSize: 12, fontWeight: FontWeight.w800, color: const Color(0xFFF97316)),
          ),
        ),
        const SizedBox(height: 12),
        _buildSettingsCard(
          isDark: isDark,
          borderColor: borderColor,
          title: "Session Operator",
          description: "Authenticated Session: ${_auth.fullName.isNotEmpty ? _auth.fullName : _auth.username} (${_auth.email})",
          trailing: const Icon(Icons.verified_user_rounded, color: Color(0xFF10B981), size: 20),
        ),
      ],
    );
  }

  // --- REUSABLE UI BUILDERS ---
  Widget _buildSectionGroupTitle(String title) {
    return Text(
      title,
      style: GoogleFonts.comfortaa(
        fontSize: 10,
        fontWeight: FontWeight.w800,
        letterSpacing: 1.1,
        color: const Color(0xFFF97316),
      ),
    );
  }

  Widget _buildSettingsCard({
    required bool isDark,
    required Color borderColor,
    required String title,
    required String description,
    required Widget trailing,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF141A26) : const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: borderColor, width: 1.0),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: GoogleFonts.comfortaa(
                    fontSize: 12.5,
                    fontWeight: FontWeight.w800,
                    color: isDark ? Colors.white : const Color(0xFF0F172A),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  description,
                  style: GoogleFonts.comfortaa(
                    fontSize: 10.5,
                    height: 1.4,
                    color: isDark ? const Color(0xFF8A94A6) : AppTheme.textMutedLight,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 16),
          trailing,
        ],
      ),
    );
  }

  Widget _buildTogglePill({
    required String label,
    IconData? icon,
    required bool isSelected,
    required VoidCallback onTap,
    required bool isDark,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
        decoration: BoxDecoration(
          color: isSelected
              ? (isDark ? Colors.white : const Color(0xFF0F172A))
              : (isDark ? const Color(0xFF1E283C) : const Color(0xFFE2E8F0)),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) ...[
              Icon(
                icon,
                size: 14,
                color: isSelected
                    ? (isDark ? const Color(0xFF0F172A) : Colors.white)
                    : (isDark ? Colors.white70 : const Color(0xFF475569)),
              ),
              const SizedBox(width: 6),
            ],
            Text(
              label,
              style: GoogleFonts.comfortaa(
                fontSize: 11,
                fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                color: isSelected
                    ? (isDark ? const Color(0xFF0F172A) : Colors.white)
                    : (isDark ? Colors.white70 : const Color(0xFF475569)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
