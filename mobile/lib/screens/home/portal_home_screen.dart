import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../config/theme.dart';
import '../../models/complaint_model.dart';
import '../../services/api_client.dart';
import '../../services/app_settings_service.dart';
import '../../services/auth_service.dart';
import '../../widgets/app_header.dart';
import '../../widgets/collapsible_sidebar.dart';
import '../citizen/new_query_view.dart';
import '../map/campus_3d_twin_screen.dart';

class PortalHomeScreen extends StatefulWidget {
  const PortalHomeScreen({super.key});

  @override
  State<PortalHomeScreen> createState() => _PortalHomeScreenState();
}

class _PortalHomeScreenState extends State<PortalHomeScreen> {
  final ApiClient _apiClient = ApiClient();
  final AuthService _auth = AuthService();

  // Active view in persistent shell:
  // 0 = Home Overview
  // 1 = New Query (Defect photo, context notes, AI diagnosis & gap questions, 2D ABES map)
  // 2 = 3D Campus Digital Twin
  // 3 = Incident Triage Queue
  // 4 = My Active Reports
  int _activeNavIndex = 0;

  List<ComplaintModel> _liveComplaints = [];
  bool _isLoadingComplaints = true;
  final Set<String> _upvotedIncidentIds = {};
  String _incidentFilterDept = 'ALL';

  @override
  void initState() {
    super.initState();
    _loadComplaints();
  }

  Future<void> _loadComplaints() async {
    setState(() => _isLoadingComplaints = true);
    try {
      final list = await _apiClient.fetchAllComplaints();
      if (!mounted) return;
      setState(() {
        _liveComplaints = list;
      });
    } catch (e) {
      debugPrint("Error loading live complaints: $e");
    } finally {
      if (mounted) setState(() => _isLoadingComplaints = false);
    }
  }

  Future<void> _handleUpvote(String complaintId) async {
    if (_upvotedIncidentIds.contains(complaintId)) return;

    try {
      final res = await _apiClient.upvoteComplaint(complaintId);
      if (!mounted) return;

      setState(() {
        _upvotedIncidentIds.add(complaintId);
      });

      final crowdCount = res['crowd_report_count'] ?? 'updated';
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          behavior: SnackBarBehavior.floating,
          backgroundColor: const Color(0xFF10B981),
          content: Text(
            "Upvoted! Incident urgency escalated (verified count: $crowdCount).",
            style: GoogleFonts.comfortaa(fontWeight: FontWeight.w600),
          ),
        ),
      );

      _loadComplaints();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFFDC2626),
            content: Text("Upvote failed: $e", style: GoogleFonts.comfortaa()),
          ),
        );
      }
    }
  }

  Color _getDepartmentColor(String dept) {
    switch (dept.toUpperCase()) {
      case 'ELECTRICAL':
        return const Color(0xFFDC2626);
      case 'PLUMBING':
        return const Color(0xFF0284C7);
      case 'SANITATION':
        return const Color(0xFF0D9488);
      case 'CIVIL':
      default:
        return const Color(0xFFF97316);
    }
  }

  IconData _getDepartmentIcon(String dept) {
    switch (dept.toUpperCase()) {
      case 'ELECTRICAL':
        return Icons.bolt_rounded;
      case 'PLUMBING':
        return Icons.water_drop_rounded;
      case 'SANITATION':
        return Icons.delete_outline_rounded;
      case 'CIVIL':
      default:
        return Icons.warning_amber_rounded;
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final size = MediaQuery.of(context).size;
    final isDesktop = size.width >= 900;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0B0F19) : const Color(0xFFF8FAFC),
      bottomNavigationBar: isDesktop
          ? null
          : Container(
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF141A26) : Colors.white,
                border: Border(
                  top: BorderSide(
                    color: isDark ? const Color(0xFF1E2638) : const Color(0xFFE2E8F0),
                    width: 1.0,
                  ),
                ),
              ),
              child: NavigationBar(
                selectedIndex: _activeNavIndex == 1
                    ? 1
                    : (_activeNavIndex == 4
                        ? 2
                        : (_activeNavIndex == 2 ? 3 : 0)),
                onDestinationSelected: (idx) {
                  setState(() {
                    if (idx == 0) _activeNavIndex = 0;
                    if (idx == 1) _activeNavIndex = 1;
                    if (idx == 2) _activeNavIndex = 4;
                    if (idx == 3) _activeNavIndex = 2;
                  });
                },
                backgroundColor: Colors.transparent,
                indicatorColor: const Color(0xFFF97316).withValues(alpha: 0.16),
                destinations: const [
                  NavigationDestination(
                    icon: Icon(Icons.home_rounded),
                    label: 'Home',
                  ),
                  NavigationDestination(
                    icon: Icon(Icons.add_circle_rounded, color: Color(0xFFF97316)),
                    label: 'New Query',
                  ),
                  NavigationDestination(
                    icon: Icon(Icons.assignment_outlined),
                    label: 'My Reports',
                  ),
                  NavigationDestination(
                    icon: Icon(Icons.view_in_ar_rounded),
                    label: '3D Twin',
                  ),
                ],
              ),
            ),
      body: SafeArea(
        child: Column(
          children: [
            // Top Persistent Blended Header (Never jumps)
            const AppHeader(),

            // Main Body Area with Fixed Shell
            Expanded(
              child: Row(
                children: [
                  // Left Collapsible Sidebar (Completely Persistent across all tab switches)
                  if (isDesktop)
                    CollapsibleSidebar(
                      activeIndex: _activeNavIndex,
                      onIndexSelected: (idx) {
                        setState(() => _activeNavIndex = idx);
                      },
                    ),

                  // Center View Content with Layout Width Preference
                  Expanded(
                    child: ListenableBuilder(
                      listenable: AppSettingsService(),
                      builder: (context, _) {
                        final isStretch = AppSettingsService().isFullWindowStretch;
                        return Container(
                          width: double.infinity,
                          alignment: Alignment.topCenter,
                          child: ConstrainedBox(
                            constraints: BoxConstraints(
                              maxWidth: isStretch ? double.infinity : 1240,
                            ),
                            child: _buildCurrentView(isDark, isDesktop),
                          ),
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // --- IN-PLACE VIEW ROUTER (ZERO JUMPING) ---
  Widget _buildCurrentView(bool isDark, bool isDesktop) {
    switch (_activeNavIndex) {
      case 1:
        // NEW QUERY FLOW (Defect photo, context notes, AI triage, 2D ABES map)
        return NewQueryView(
          onCancel: () => setState(() => _activeNavIndex = 0),
          onReportSubmitted: () {
            _loadComplaints();
            setState(() => _activeNavIndex = 4);
          },
        );

      case 2:
        // 3D CAMPUS DIGITAL TWIN
        return Campus3DTwinScreen(
          onBackToHome: () => setState(() => _activeNavIndex = 0),
        );

      case 3:
        // INCIDENT TRIAGE QUEUE (Real database feed)
        return _buildIncidentTriageQueueView(isDark, isDesktop);

      case 4:
        // MY ACTIVE REPORTS (Real user reports feed)
        return _buildMyReportsView(isDark, isDesktop);

      case 0:
      default:
        // HOME OVERVIEW
        return _buildHomeOverview(isDark, isDesktop);
    }
  }

  // =========================================================================
  // VIEW 0: HOME OVERVIEW (HERO + TELEMETRY + PILLARS + CLEAN FEED)
  // =========================================================================
  Widget _buildHomeOverview(bool isDark, bool isDesktop) {
    return SingleChildScrollView(
      padding: EdgeInsets.fromLTRB(
        isDesktop ? 16 : 14,
        8,
        isDesktop ? 24 : 14,
        28,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // 1. HERO SECTION BANNER
          _buildHeroSection(isDark, isDesktop),

          const SizedBox(height: 24),

          // 2. LIVE CAMPUS TELEMETRY STATS (3 VERIFIED CARDS)
          _buildCampusStatsRow(isDark, isDesktop),

          const SizedBox(height: 24),

          // 3. 3 CORE PILLARS VISUAL SHOWCASE
          _buildPillarsShowcase(isDark, isDesktop),

          const SizedBox(height: 28),

          // 4. LIVE DATABASE INCIDENT FEED (from SQLite)
          _buildLiveIncidentFeed(isDark),
        ],
      ),
    );
  }

  // --- HERO SECTION BANNER ---
  Widget _buildHeroSection(bool isDark, bool isDesktop) {
    final leftContent = Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Official ACTS Brand Header
        Row(
          children: [
            Image.asset(
              'assets/icons/acts_logo.png',
              width: isDesktop ? 44 : 36,
              height: isDesktop ? 44 : 36,
              fit: BoxFit.contain,
            ),
            const SizedBox(width: 12),
            Image.asset(
              isDark
                  ? 'assets/images/acts_text_logo_dark.png'
                  : 'assets/images/acts_text_logo.png',
              height: isDesktop ? 32 : 24,
              fit: BoxFit.contain,
            ),
          ],
        ),
        const SizedBox(height: 16),

        // Top Tag
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
          decoration: BoxDecoration(
            color: const Color(0xFFF97316).withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(
            "ABES ENGINEERING COLLEGE • STUDENT CITIZEN PORTAL",
            style: GoogleFonts.comfortaa(
              fontSize: 10,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.8,
              color: const Color(0xFFF97316),
            ),
          ),
        ),

        const SizedBox(height: 14),

        Text(
          "Autonomous Civic Triage &\nInfrastructure Intelligence",
          style: GoogleFonts.comfortaa(
            fontSize: isDesktop ? 28 : 21,
            fontWeight: FontWeight.w900,
            height: 1.2,
            color: isDark ? Colors.white : const Color(0xFF0F172A),
          ),
        ),

        const SizedBox(height: 12),

        Text(
          "Detect road cracks, electrical conduits, and water leaks instantly with neural computer vision. Nearby reports automatically merge into crowd-weighted clusters with automated crew dispatch.",
          style: GoogleFonts.comfortaa(
            fontSize: isDesktop ? 13 : 12,
            height: 1.6,
            color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF475569),
          ),
        ),

        const SizedBox(height: 22),

        // ACTION BUTTONS ROW (IN-PLACE SWITCHING)
        Wrap(
          spacing: 12,
          runSpacing: 10,
          children: [
            // Primary Button: [ ➕ Report New Issue / Query ]
            ElevatedButton.icon(
              onPressed: () => setState(() => _activeNavIndex = 1),
              icon: const Icon(Icons.add_circle_outline_rounded, size: 18),
              label: Text(
                "Report New Issue / Query",
                style: GoogleFonts.comfortaa(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.3,
                ),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFF97316),
                foregroundColor: Colors.white,
                elevation: 0,
                padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 15),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
            ),

            // Secondary Button: [ 🗺️ Launch 3D Campus Digital Twin ]
            OutlinedButton.icon(
              onPressed: () => setState(() => _activeNavIndex = 2),
              icon: const Icon(Icons.view_in_ar_rounded, size: 18, color: Color(0xFF2563EB)),
              label: Text(
                "Launch 3D Campus Twin",
                style: GoogleFonts.comfortaa(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: isDark ? Colors.white : const Color(0xFF1E3A8A),
                ),
              ),
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 15),
                side: BorderSide(
                  color: isDark ? const Color(0xFF2E3A52) : const Color(0xFFCBD5E1),
                  width: 1.2,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
            ),
          ],
        ),
      ],
    );

    final previewImage = Center(
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: Image.asset(
          'assets/images/preview_radar.png',
          height: isDesktop ? 240 : 180,
          fit: BoxFit.contain,
          errorBuilder: (_, __, ___) => const Icon(
            Icons.view_in_ar_rounded,
            size: 80,
            color: Color(0xFFF97316),
          ),
        ),
      ),
    );

    return Container(
      padding: EdgeInsets.all(isDesktop ? 30 : 20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: isDark
              ? [const Color(0xFF141A26), const Color(0xFF1B2436)]
              : [Colors.white, const Color(0xFFF1F5F9)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: isDark ? const Color(0xFF232B3B) : const Color(0xFFE2E8F0),
          width: 1.2,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.35 : 0.05),
            blurRadius: 24,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: isDesktop
          ? Row(
              children: [
                Expanded(flex: 6, child: leftContent),
                const SizedBox(width: 28),
                Expanded(flex: 4, child: previewImage),
              ],
            )
          : Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                leftContent,
                const SizedBox(height: 20),
                previewImage,
              ],
            ),
    );
  }

  // --- CAMPUS STATS TELEMETRY ROW (3 VERIFIED CARDS) ---
  Widget _buildCampusStatsRow(bool isDark, bool isDesktop) {
    final card1 = _buildStatCard(
      "Mean Triage SLA",
      "< 45 Mins",
      "Automated Priority Dispatch",
      const Color(0xFFF97316),
      isDark,
    );
    final card2 = _buildStatCard(
      "On-Duty Rapid Units",
      "4 Squads Active",
      "Electrical • Hydro • Civil • Safety",
      const Color(0xFF2563EB),
      isDark,
    );
    final card3 = _buildStatCard(
      "Campus Digital Grid",
      "100% Geo-Mapped",
      "17-Acre ABES Infrastructure Monitored",
      const Color(0xFF10B981),
      isDark,
    );

    if (isDesktop) {
      return Row(
        children: [
          Expanded(child: card1),
          const SizedBox(width: 16),
          Expanded(child: card2),
          const SizedBox(width: 16),
          Expanded(child: card3),
        ],
      );
    } else {
      return Column(
        children: [
          card1,
          const SizedBox(height: 12),
          card2,
          const SizedBox(height: 12),
          card3,
        ],
      );
    }
  }

  Widget _buildStatCard(
    String title,
    String value,
    String subtitle,
    Color accent,
    bool isDark,
  ) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF141A26) : Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isDark ? const Color(0xFF232B3B) : const Color(0xFFE2E8F0),
          width: 1.2,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: GoogleFonts.comfortaa(
              fontSize: 11.5,
              fontWeight: FontWeight.w700,
              color: isDark ? const Color(0xFF8A94A6) : AppTheme.textMutedLight,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            value,
            style: GoogleFonts.comfortaa(
              fontSize: 24,
              fontWeight: FontWeight.w900,
              color: accent,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            subtitle,
            style: GoogleFonts.comfortaa(
              fontSize: 10,
              color: isDark ? const Color(0xFF64748B) : const Color(0xFF94A3B8),
            ),
          ),
        ],
      ),
    );
  }

  // --- 3 CORE PILLARS SHOWCASE ---
  Widget _buildPillarsShowcase(bool isDark, bool isDesktop) {
    final p1 = _buildPillarCard(
      step: "01",
      title: "AI Defect Triage",
      desc: "Point camera at any defect. Neural vision analyzes hazard severity and location coordinates.",
      accent: const Color(0xFF2563EB),
      isDark: isDark,
    );
    final p2 = _buildPillarCard(
      step: "02",
      title: "3D Campus Radar",
      desc: "Spatial clustering aggregates reports from nearby students into a single actionable queue.",
      accent: const Color(0xFFF97316),
      isDark: isDark,
    );
    final p3 = _buildPillarCard(
      step: "03",
      title: "Verified Resolution",
      desc: "Direct crew dispatch with before & after photographic evidence to confirm repairs.",
      accent: const Color(0xFF10B981),
      isDark: isDark,
    );

    if (isDesktop) {
      return Row(
        children: [
          Expanded(child: p1),
          const SizedBox(width: 16),
          Expanded(child: p2),
          const SizedBox(width: 16),
          Expanded(child: p3),
        ],
      );
    } else {
      return Column(
        children: [
          p1,
          const SizedBox(height: 12),
          p2,
          const SizedBox(height: 12),
          p3,
        ],
      );
    }
  }

  Widget _buildPillarCard({
    required String step,
    required String title,
    required String desc,
    required Color accent,
    required bool isDark,
  }) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF141A26) : Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isDark ? const Color(0xFF232B3B) : const Color(0xFFE2E8F0),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              color: accent.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(
              step,
              style: GoogleFonts.comfortaa(
                fontSize: 10,
                fontWeight: FontWeight.w800,
                color: accent,
              ),
            ),
          ),
          const SizedBox(height: 12),
          Text(
            title,
            style: GoogleFonts.comfortaa(
              fontSize: 14.5,
              fontWeight: FontWeight.w800,
              color: isDark ? Colors.white : const Color(0xFF0F172A),
            ),
          ),
          const SizedBox(height: 6),
          Text(
            desc,
            style: GoogleFonts.comfortaa(
              fontSize: 11.5,
              height: 1.5,
              color: isDark ? const Color(0xFF8A94A6) : AppTheme.textBodyLight,
            ),
          ),
        ],
      ),
    );
  }

  // --- LIVE DATABASE INCIDENT FEED (CLEAN ZERO-STATE) ---
  Widget _buildLiveIncidentFeed(bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              "LIVE DATABASE INCIDENTS (${_liveComplaints.length})",
              style: GoogleFonts.comfortaa(
                fontSize: 12,
                fontWeight: FontWeight.w800,
                letterSpacing: 1.1,
                color: isDark ? const Color(0xFF8A94A6) : AppTheme.textMutedLight,
              ),
            ),
            IconButton(
              tooltip: "Refresh Feed",
              onPressed: _loadComplaints,
              icon: const Icon(Icons.refresh_rounded, size: 18),
            ),
          ],
        ),
        const SizedBox(height: 12),

        if (_isLoadingComplaints)
          const Center(
            child: Padding(
              padding: EdgeInsets.all(24),
              child: CircularProgressIndicator(color: Color(0xFFF97316)),
            ),
          )
        else if (_liveComplaints.isEmpty)
          Container(
            padding: const EdgeInsets.all(28),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF141A26) : Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: isDark ? const Color(0xFF232B3B) : const Color(0xFFE2E8F0),
              ),
            ),
            child: Center(
              child: Column(
                children: [
                  const Icon(Icons.verified_outlined, size: 42, color: Color(0xFF10B981)),
                  const SizedBox(height: 12),
                  Text(
                    "All Campus Pathways Clear",
                    style: GoogleFonts.comfortaa(
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                      color: isDark ? Colors.white : const Color(0xFF0F172A),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    "No unresolved hazards in the campus database. Tap 'Report New Issue' above to log a defect.",
                    style: GoogleFonts.comfortaa(
                      fontSize: 11.5,
                      color: isDark ? const Color(0xFF8A94A6) : const Color(0xFF64748B),
                    ),
                  ),
                ],
              ),
            ),
          )
        else
          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _liveComplaints.length,
            itemBuilder: (context, idx) {
              final inc = _liveComplaints[idx];
              final deptColor = _getDepartmentColor(inc.department);
              final hasUpvoted = _upvotedIncidentIds.contains(inc.id);

              return Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF141A26) : Colors.white,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(
                    color: isDark ? const Color(0xFF232B3B) : const Color(0xFFE2E8F0),
                  ),
                ),
                child: Row(
                  children: [
                    CircleAvatar(
                      backgroundColor: deptColor.withValues(alpha: 0.15),
                      child: Icon(_getDepartmentIcon(inc.department), color: deptColor, size: 20),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            inc.rawText.isNotEmpty ? inc.rawText : inc.department,
                            style: GoogleFonts.comfortaa(
                              fontSize: 13.5,
                              fontWeight: FontWeight.w800,
                              color: isDark ? Colors.white : const Color(0xFF0F172A),
                            ),
                          ),
                          const SizedBox(height: 3),
                          Text(
                            "${inc.campusZone.isNotEmpty ? inc.campusZone : 'Main Campus'} • Status: ${inc.status}",
                            style: GoogleFonts.comfortaa(
                              fontSize: 11,
                              color: isDark ? const Color(0xFF8A94A6) : const Color(0xFF64748B),
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            "${inc.crowdReportCount} Students Verified • Priority ${inc.computedPriority.toStringAsFixed(1)}",
                            style: GoogleFonts.comfortaa(
                              fontSize: 10.5,
                              fontWeight: FontWeight.w700,
                              color: const Color(0xFF10B981),
                            ),
                          ),
                        ],
                      ),
                    ),
                    ElevatedButton.icon(
                      onPressed: () => _handleUpvote(inc.id),
                      icon: Icon(
                        hasUpvoted ? Icons.thumb_up_rounded : Icons.thumb_up_outlined,
                        size: 15,
                        color: hasUpvoted ? Colors.white : const Color(0xFFF97316),
                      ),
                      label: Text(
                        hasUpvoted ? "Upvoted" : "Upvote",
                        style: GoogleFonts.comfortaa(
                          fontSize: 11.5,
                          fontWeight: FontWeight.w700,
                          color: hasUpvoted ? Colors.white : (isDark ? Colors.white : const Color(0xFF0F172A)),
                        ),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: hasUpvoted
                            ? const Color(0xFF10B981)
                            : (isDark ? const Color(0xFF1D2433) : const Color(0xFFF1F5F9)),
                        elevation: 0,
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
      ],
    );
  }

  // =========================================================================
  // VIEW 3: INCIDENT TRIAGE QUEUE FULL VIEW (CLEAN STATE)
  // =========================================================================
  Widget _buildIncidentTriageQueueView(bool isDark, bool isDesktop) {
    final filtered = _incidentFilterDept == 'ALL'
        ? _liveComplaints
        : _liveComplaints.where((c) => c.department.toUpperCase() == _incidentFilterDept).toList();

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(20, 10, 20, 32),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    "Campus Incident Triage Queue",
                    style: GoogleFonts.comfortaa(
                      fontSize: 22,
                      fontWeight: FontWeight.w900,
                      color: isDark ? Colors.white : const Color(0xFF0F172A),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    "Real-time campus infrastructure reports validated via crowd algorithms",
                    style: GoogleFonts.comfortaa(
                      fontSize: 11.5,
                      color: isDark ? const Color(0xFF8A94A6) : const Color(0xFF64748B),
                    ),
                  ),
                ],
              ),
              ElevatedButton.icon(
                onPressed: () => setState(() => _activeNavIndex = 1),
                icon: const Icon(Icons.add_circle_outline_rounded, size: 16),
                label: Text(
                  "New Query",
                  style: GoogleFonts.comfortaa(fontSize: 12, fontWeight: FontWeight.w700),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFF97316),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),

          // Department Filters
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: ['ALL', 'CIVIL', 'ELECTRICAL', 'PLUMBING', 'SANITATION'].map((dept) {
                final isSelected = _incidentFilterDept == dept;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text(dept),
                    selected: isSelected,
                    selectedColor: const Color(0xFFF97316),
                    backgroundColor: isDark ? const Color(0xFF141A26) : Colors.white,
                    labelStyle: GoogleFonts.comfortaa(
                      fontSize: 11,
                      fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                      color: isSelected ? Colors.white : (isDark ? Colors.white70 : const Color(0xFF475569)),
                    ),
                    onSelected: (val) {
                      if (val) setState(() => _incidentFilterDept = dept);
                    },
                  ),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 18),

          if (_isLoadingComplaints)
            const Center(
              child: Padding(
                padding: EdgeInsets.all(40),
                child: CircularProgressIndicator(color: Color(0xFFF97316)),
              ),
            )
          else if (filtered.isEmpty)
            Container(
              padding: const EdgeInsets.all(36),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF141A26) : Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: isDark ? const Color(0xFF232B3B) : const Color(0xFFE2E8F0),
                ),
              ),
              child: Center(
                child: Column(
                  children: [
                    const Icon(Icons.check_circle_outline_rounded, size: 48, color: Color(0xFF10B981)),
                    const SizedBox(height: 14),
                    Text(
                      "No Active Hazards in Triage Queue",
                      style: GoogleFonts.comfortaa(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: isDark ? Colors.white : const Color(0xFF0F172A),
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      "All utility systems, road segments, and buildings are operational.",
                      style: GoogleFonts.comfortaa(
                        fontSize: 12,
                        color: isDark ? const Color(0xFF8A94A6) : const Color(0xFF64748B),
                      ),
                    ),
                    const SizedBox(height: 18),
                    ElevatedButton(
                      onPressed: () => setState(() => _activeNavIndex = 1),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFF97316),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: Text(
                        "Report a Defect",
                        style: GoogleFonts.comfortaa(fontSize: 12, fontWeight: FontWeight.w700),
                      ),
                    ),
                  ],
                ),
              ),
            )
          else
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: filtered.length,
              itemBuilder: (context, idx) {
                final inc = filtered[idx];
                final deptColor = _getDepartmentColor(inc.department);
                final hasUpvoted = _upvotedIncidentIds.contains(inc.id);

                return Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF141A26) : Colors.white,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(
                      color: isDark ? const Color(0xFF232B3B) : const Color(0xFFE2E8F0),
                    ),
                  ),
                  child: Row(
                    children: [
                      CircleAvatar(
                        radius: 20,
                        backgroundColor: deptColor.withValues(alpha: 0.15),
                        child: Icon(_getDepartmentIcon(inc.department), color: deptColor, size: 20),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              inc.rawText.isNotEmpty ? inc.rawText : inc.department,
                              style: GoogleFonts.comfortaa(
                                fontSize: 14,
                                fontWeight: FontWeight.w800,
                                color: isDark ? Colors.white : const Color(0xFF0F172A),
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              "${inc.campusZone.isNotEmpty ? inc.campusZone : 'Main Campus'} • Status: ${inc.status}",
                              style: GoogleFonts.comfortaa(
                                fontSize: 11,
                                color: isDark ? const Color(0xFF8A94A6) : const Color(0xFF64748B),
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              "${inc.crowdReportCount} Validations • Priority Level ${inc.computedPriority.toStringAsFixed(1)}",
                              style: GoogleFonts.comfortaa(
                                fontSize: 10.5,
                                fontWeight: FontWeight.w700,
                                color: const Color(0xFF10B981),
                              ),
                            ),
                          ],
                        ),
                      ),
                      ElevatedButton.icon(
                        onPressed: () => _handleUpvote(inc.id),
                        icon: Icon(
                          hasUpvoted ? Icons.thumb_up_rounded : Icons.thumb_up_outlined,
                          size: 15,
                          color: hasUpvoted ? Colors.white : const Color(0xFFF97316),
                        ),
                        label: Text(
                          hasUpvoted ? "Upvoted" : "Upvote",
                          style: GoogleFonts.comfortaa(
                            fontSize: 11.5,
                            fontWeight: FontWeight.w700,
                            color: hasUpvoted ? Colors.white : (isDark ? Colors.white : const Color(0xFF0F172A)),
                          ),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: hasUpvoted
                              ? const Color(0xFF10B981)
                              : (isDark ? const Color(0xFF1D2433) : const Color(0xFFF1F5F9)),
                          elevation: 0,
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
        ],
      ),
    );
  }

  // =========================================================================
  // VIEW 4: MY ACTIVE REPORTS FULL VIEW (CLEAN REAL DATABASE STATE)
  // =========================================================================
  Widget _buildMyReportsView(bool isDark, bool isDesktop) {
    final currentUsername = _auth.username;
    // Filter complaints belonging to the current user (or show user's reports)
    final myComplaints = _liveComplaints
        .where((c) =>
            c.userIdentifier.toLowerCase() == currentUsername.toLowerCase() ||
            c.userIdentifier.isEmpty)
        .toList();

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(20, 10, 20, 32),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    "My Active Reports",
                    style: GoogleFonts.comfortaa(
                      fontSize: 22,
                      fontWeight: FontWeight.w900,
                      color: isDark ? Colors.white : const Color(0xFF0F172A),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    "Track the real-time triage, crew dispatch, and resolution verification of your reports",
                    style: GoogleFonts.comfortaa(
                      fontSize: 11.5,
                      color: isDark ? const Color(0xFF8A94A6) : const Color(0xFF64748B),
                    ),
                  ),
                ],
              ),
              ElevatedButton.icon(
                onPressed: () => setState(() => _activeNavIndex = 1),
                icon: const Icon(Icons.add_circle_outline_rounded, size: 16),
                label: Text(
                  "New Query",
                  style: GoogleFonts.comfortaa(fontSize: 12, fontWeight: FontWeight.w700),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFF97316),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),

          if (_isLoadingComplaints)
            const Center(
              child: Padding(
                padding: EdgeInsets.all(40),
                child: CircularProgressIndicator(color: Color(0xFFF97316)),
              ),
            )
          else if (myComplaints.isEmpty)
            // PRISTINE CLEAN ZERO-STATE AS REQUESTED BY USER
            Container(
              padding: const EdgeInsets.symmetric(vertical: 48, horizontal: 24),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF141A26) : Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: isDark ? const Color(0xFF232B3B) : const Color(0xFFE2E8F0),
                ),
              ),
              child: Center(
                child: Column(
                  children: [
                    Container(
                      width: 64,
                      height: 64,
                      decoration: BoxDecoration(
                        color: const Color(0xFF2563EB).withValues(alpha: 0.12),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.assignment_turned_in_outlined,
                        size: 32,
                        color: Color(0xFF2563EB),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      "No Reports Filed Yet",
                      style: GoogleFonts.comfortaa(
                        fontSize: 17,
                        fontWeight: FontWeight.w800,
                        color: isDark ? Colors.white : const Color(0xFF0F172A),
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      "You have not submitted any infrastructure defect reports yet.\nSpot a hazard on campus? Click below to dispatch an automated AI report.",
                      textAlign: TextAlign.center,
                      style: GoogleFonts.comfortaa(
                        fontSize: 12,
                        height: 1.5,
                        color: isDark ? const Color(0xFF8A94A6) : const Color(0xFF64748B),
                      ),
                    ),
                    const SizedBox(height: 20),
                    ElevatedButton.icon(
                      onPressed: () => setState(() => _activeNavIndex = 1),
                      icon: const Icon(Icons.add_circle_outline_rounded, size: 16),
                      label: Text(
                        "File Your First Query",
                        style: GoogleFonts.comfortaa(fontSize: 12.5, fontWeight: FontWeight.w700),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFF97316),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ],
                ),
              ),
            )
          else
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: myComplaints.length,
              itemBuilder: (context, idx) {
                final inc = myComplaints[idx];
                final deptColor = _getDepartmentColor(inc.department);

                return Container(
                  margin: const EdgeInsets.only(bottom: 14),
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF141A26) : Colors.white,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(
                      color: isDark ? const Color(0xFF232B3B) : const Color(0xFFE2E8F0),
                    ),
                  ),
                  child: Row(
                    children: [
                      CircleAvatar(
                        radius: 20,
                        backgroundColor: deptColor.withValues(alpha: 0.15),
                        child: Icon(_getDepartmentIcon(inc.department), color: deptColor, size: 20),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              inc.rawText.isNotEmpty ? inc.rawText : inc.department,
                              style: GoogleFonts.comfortaa(
                                fontSize: 14,
                                fontWeight: FontWeight.w800,
                                color: isDark ? Colors.white : const Color(0xFF0F172A),
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              "${inc.campusZone.isNotEmpty ? inc.campusZone : 'Main Campus'} • Assigned: ${inc.assignedCrewName ?? 'Pending Squad'}",
                              style: GoogleFonts.comfortaa(
                                fontSize: 11,
                                color: isDark ? const Color(0xFF8A94A6) : const Color(0xFF64748B),
                              ),
                            ),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: const Color(0xFF10B981).withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: const Color(0xFF10B981).withValues(alpha: 0.3)),
                        ),
                        child: Text(
                          inc.status,
                          style: GoogleFonts.comfortaa(
                            fontSize: 11,
                            fontWeight: FontWeight.w800,
                            color: const Color(0xFF10B981),
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
        ],
      ),
    );
  }
}
