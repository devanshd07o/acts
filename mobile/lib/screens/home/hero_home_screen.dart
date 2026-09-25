import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:latlong2/latlong.dart';
import '../../config/app_routes.dart';
import '../../config/theme.dart';
import '../../models/complaint_model.dart';
import '../../services/api_client.dart';
import '../../services/auth_service.dart';

class HeroHomeScreen extends StatefulWidget {
  const HeroHomeScreen({super.key});

  @override
  State<HeroHomeScreen> createState() => _HeroHomeScreenState();
}

class _HeroHomeScreenState extends State<HeroHomeScreen> {
  final ApiClient _apiClient = ApiClient();
  final AuthService _auth = AuthService();
  final MapController _mapController = MapController();

  // ABESEC Campus Center Coordinates
  final LatLng _campusCenter = const LatLng(28.6341, 77.4474);

  // Active View Mode: 0 = Map, 1 = List, 2 = My Reports
  int _activeNavTab = 0;
  bool _is3DMode = true;
  int _selectedIncidentIndex = 0;
  bool _isLoadingComplaints = true;
  List<ComplaintModel> _liveComplaints = [];

  // Upvoted complaint IDs in this session
  final Set<String> _upvotedIncidentIds = {};

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
        if (_selectedIncidentIndex >= _liveComplaints.length) {
          _selectedIncidentIndex = 0;
        }
      });

      if (_liveComplaints.isNotEmpty) {
        final first = _liveComplaints[_selectedIncidentIndex];
        if (first.latitude != 0.0 && first.longitude != 0.0) {
          _mapController.move(LatLng(first.latitude, first.longitude), 17.5);
        }
      }
    } catch (e) {
      debugPrint("Live complaints fetch error: $e");
    } finally {
      if (mounted) setState(() => _isLoadingComplaints = false);
    }
  }

  Future<void> _handleUpvote(String complaintId) async {
    if (_upvotedIncidentIds.contains(complaintId)) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            "You have already upvoted this incident.",
            style: GoogleFonts.comfortaa(),
          ),
          backgroundColor: const Color(0xFFF97316),
        ),
      );
      return;
    }

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

      // Refresh real data from backend
      _loadComplaints();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFFDC2626),
            content: Text(
              "Upvote failed: $e",
              style: GoogleFonts.comfortaa(),
            ),
          ),
        );
      }
    }
  }

  Future<void> _handleLogout() async {
    await _apiClient.logout();
    if (!mounted) return;
    Navigator.pushReplacementNamed(context, AppRoutes.login);
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
    final size = MediaQuery.of(context).size;
    final isDesktop = size.width >= 980;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppTheme.canvasBaseDark : const Color(0xFFF8FAFC),
      body: SafeArea(
        child: Column(
          children: [
            // 1. BRAND HEADER (Orange 'A' + ACTS + User profile + Logout)
            _buildOfficialHeader(context, isDark, isDesktop),

            // 2. SUB-NAV PILLS (Map | List | My Reports)
            _buildSubNavPills(isDark),

            // 3. MAIN CONTENT
            Expanded(
              child: _activeNavTab == 1
                  ? _buildListView(isDark)
                  : (isDesktop
                      ? _buildDesktopDualLayout(isDark)
                      : _buildMobileRadarLayout(isDark)),
            ),

            // 4. DOCKED BOTTOM NAVIGATION BAR (Mobile Only)
            if (!isDesktop) _buildBottomNavDock(context, isDark),
          ],
        ),
      ),
    );
  }

  // --- BRAND HEADER ---
  Widget _buildOfficialHeader(BuildContext context, bool isDark, bool isDesktop) {
    final username = _auth.username.isNotEmpty ? _auth.username : 'Student';
    final isAdmin = _auth.isAdmin;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.surfaceCardDark : Colors.white,
        border: Border(
          bottom: BorderSide(
            color: isDark ? AppTheme.hairlineBorderDark : const Color(0xFFE5E7EB),
            width: 1.0,
          ),
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFFFF6B00), Color(0xFFF97316)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(10),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFFF97316).withValues(alpha: 0.35),
                      blurRadius: 8,
                      offset: const Offset(0, 3),
                    ),
                  ],
                ),
                child: const Center(
                  child: Text(
                    "A",
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 21,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    "ACTS",
                    style: GoogleFonts.comfortaa(
                      fontSize: 17,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 0.5,
                      color: isDark ? Colors.white : const Color(0xFF0F172A),
                    ),
                  ),
                  Text(
                    "Cleaner Roads. Safer Campuses.",
                    style: GoogleFonts.comfortaa(
                      fontSize: 9.5,
                      fontWeight: FontWeight.w600,
                      letterSpacing: 0.2,
                      color: isDark ? const Color(0xFF8A94A6) : const Color(0xFF64748B),
                    ),
                  ),
                ],
              ),
            ],
          ),

          // If Admin, subtle button to enter Admin Command Console
          if (isAdmin)
            InkWell(
              onTap: () => Navigator.pushNamed(context, AppRoutes.adminMap),
              borderRadius: BorderRadius.circular(10),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: const Color(0xFFF97316).withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFFF97316), width: 1),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.shield_rounded, size: 14, color: Color(0xFFF97316)),
                    const SizedBox(width: 5),
                    Text(
                      "Operations Console",
                      style: GoogleFonts.comfortaa(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFFF97316),
                      ),
                    ),
                  ],
                ),
              ),
            ),

          // Right Controls: Refresh + User Name Pill + Logout Button
          Row(
            children: [
              IconButton(
                tooltip: "Refresh Campus Incidents",
                icon: const Icon(Icons.refresh_rounded, size: 19),
                onPressed: _loadComplaints,
                color: isDark ? Colors.white70 : const Color(0xFF475569),
              ),

              const SizedBox(width: 4),

              // User Name Pill
              InkWell(
                onTap: () => Navigator.pushNamed(context, AppRoutes.myReports),
                borderRadius: BorderRadius.circular(20),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF1D2433) : const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: isDark ? const Color(0xFF232B3B) : const Color(0xFFE2E8F0),
                    ),
                  ),
                  child: Row(
                    children: [
                      CircleAvatar(
                        radius: 11,
                        backgroundColor: const Color(0xFFF97316),
                        child: Text(
                          username.isNotEmpty ? username[0].toUpperCase() : 'S',
                          style: const TextStyle(
                            fontSize: 10.5,
                            fontWeight: FontWeight.w800,
                            color: Colors.white,
                          ),
                        ),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        username,
                        style: GoogleFonts.comfortaa(
                          fontSize: 11.5,
                          fontWeight: FontWeight.w700,
                          color: isDark ? Colors.white : const Color(0xFF0F172A),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(width: 8),

              // Logout Button
              IconButton(
                tooltip: "Logout",
                icon: const Icon(Icons.logout_rounded, size: 18),
                onPressed: _handleLogout,
                color: isDark ? Colors.white60 : const Color(0xFF64748B),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // --- SUB-NAV PILLS ---
  Widget _buildSubNavPills(bool isDark) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      color: isDark ? AppTheme.surfaceCardDark : Colors.white,
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(3),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1D2433) : const Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              children: [
                _buildNavSegmentPill(
                  label: "Map",
                  isSelected: _activeNavTab == 0,
                  onTap: () => setState(() => _activeNavTab = 0),
                  isDark: isDark,
                ),
                _buildNavSegmentPill(
                  label: "List",
                  isSelected: _activeNavTab == 1,
                  onTap: () => setState(() => _activeNavTab = 1),
                  isDark: isDark,
                ),
                _buildNavSegmentPill(
                  label: "My Reports",
                  isSelected: _activeNavTab == 2,
                  onTap: () => Navigator.pushNamed(context, AppRoutes.myReports),
                  isDark: isDark,
                ),
              ],
            ),
          ),
          const Spacer(),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: const Color(0xFF10B981).withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFF10B981).withValues(alpha: 0.3)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.verified_rounded, size: 13, color: Color(0xFF10B981)),
                const SizedBox(width: 5),
                Text(
                  "ABESEC Campus Active",
                  style: GoogleFonts.comfortaa(
                    fontSize: 10.5,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF10B981),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // --- MOBILE RADAR LAYOUT ---
  Widget _buildMobileRadarLayout(bool isDark) {
    final hasComplaints = _liveComplaints.isNotEmpty;
    final ComplaintModel? activeDefect = hasComplaints
        ? _liveComplaints[_selectedIncidentIndex.clamp(0, _liveComplaints.length - 1)]
        : null;

    return Stack(
      children: [
        Positioned.fill(
          child: _buildInteractiveCampusMap(isDark),
        ),

        _buildFloatingBuildingChips(isDark),

        Positioned(
          top: 16,
          right: 16,
          child: _buildFloatingMapControls(isDark),
        ),

        Positioned(
          left: 16,
          right: 16,
          bottom: 16,
          child: _buildFloatingIssueCard(activeDefect, isDark),
        ),
      ],
    );
  }

  // --- DESKTOP DUAL LAYOUT ---
  Widget _buildDesktopDualLayout(bool isDark) {
    final hasComplaints = _liveComplaints.isNotEmpty;
    final ComplaintModel? activeDefect = hasComplaints
        ? _liveComplaints[_selectedIncidentIndex.clamp(0, _liveComplaints.length - 1)]
        : null;

    return Row(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Left 65%: Map
        Expanded(
          flex: 65,
          child: Stack(
            children: [
              Positioned.fill(
                child: _buildInteractiveCampusMap(isDark),
              ),
              _buildFloatingBuildingChips(isDark),
              Positioned(
                top: 20,
                right: 20,
                child: _buildFloatingMapControls(isDark),
              ),
            ],
          ),
        ),

        // Right 35%: Telemetry & Action Drawer
        Expanded(
          flex: 35,
          child: Container(
            decoration: BoxDecoration(
              color: isDark ? AppTheme.surfaceCardDark : Colors.white,
              border: Border(
                left: BorderSide(
                  color: isDark ? AppTheme.hairlineBorderDark : const Color(0xFFE5E7EB),
                ),
              ),
            ),
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    "SELECTED DEFECT TELEMETRY",
                    style: GoogleFonts.comfortaa(
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 1.2,
                      color: isDark ? const Color(0xFF8A94A6) : AppTheme.textMutedLight,
                    ),
                  ),
                  const SizedBox(height: 14),

                  _buildFloatingIssueCard(activeDefect, isDark),

                  const SizedBox(height: 28),

                  Text(
                    "LIVE DATABASE INCIDENTS (${_liveComplaints.length})",
                    style: GoogleFonts.comfortaa(
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 1.2,
                      color: isDark ? const Color(0xFF8A94A6) : AppTheme.textMutedLight,
                    ),
                  ),
                  const SizedBox(height: 12),

                  if (_isLoadingComplaints)
                    const Center(
                      child: Padding(
                        padding: EdgeInsets.all(20),
                        child: CircularProgressIndicator(color: Color(0xFFF97316)),
                      ),
                    )
                  else if (_liveComplaints.isEmpty)
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF1D2433) : const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        "No open defects found in campus database. All systems normal.",
                        style: GoogleFonts.comfortaa(
                          fontSize: 12,
                          color: isDark ? Colors.white60 : const Color(0xFF64748B),
                        ),
                      ),
                    )
                  else
                    ..._liveComplaints.asMap().entries.map((entry) {
                      final idx = entry.key;
                      final inc = entry.value;
                      final isSel = _selectedIncidentIndex == idx;
                      final deptColor = _getDepartmentColor(inc.department);

                      return Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: InkWell(
                          onTap: () {
                            setState(() => _selectedIncidentIndex = idx);
                            if (inc.latitude != 0.0 && inc.longitude != 0.0) {
                              _mapController.move(LatLng(inc.latitude, inc.longitude), 17.5);
                            }
                          },
                          borderRadius: BorderRadius.circular(12),
                          child: Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: isSel
                                  ? const Color(0xFFF97316).withValues(alpha: 0.1)
                                  : (isDark ? const Color(0xFF1D2433) : const Color(0xFFF8FAFC)),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: isSel
                                    ? const Color(0xFFF97316)
                                    : (isDark ? const Color(0xFF232B3B) : const Color(0xFFE2E8F0)),
                                width: isSel ? 1.5 : 1.0,
                              ),
                            ),
                            child: Row(
                              children: [
                                Container(
                                  width: 8,
                                  height: 8,
                                  decoration: BoxDecoration(
                                    color: deptColor,
                                    shape: BoxShape.circle,
                                  ),
                                ),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        inc.rawText.isNotEmpty ? inc.rawText : inc.department,
                                        style: GoogleFonts.comfortaa(
                                          fontSize: 12,
                                          fontWeight: FontWeight.w700,
                                          color: isDark ? Colors.white : const Color(0xFF0F172A),
                                        ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                      Text(
                                        "${inc.campusZone.isNotEmpty ? inc.campusZone : 'Campus'} • ${inc.crowdReportCount} Verified",
                                        style: GoogleFonts.comfortaa(
                                          fontSize: 10.5,
                                          color: isDark ? const Color(0xFF8A94A6) : const Color(0xFF64748B),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: deptColor.withValues(alpha: 0.1),
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  child: Text(
                                    "SEV ${inc.initialSeverity}",
                                    style: GoogleFonts.comfortaa(
                                      fontSize: 9.5,
                                      fontWeight: FontWeight.w800,
                                      color: deptColor,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    }),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  // --- LIST VIEW TAB ---
  Widget _buildListView(bool isDark) {
    if (_isLoadingComplaints) {
      return const Center(
        child: CircularProgressIndicator(color: Color(0xFFF97316)),
      );
    }

    if (_liveComplaints.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.check_circle_outline_rounded, size: 54, color: Color(0xFF10B981)),
            const SizedBox(height: 14),
            Text(
              "All Clear! No Open Incidents",
              style: GoogleFonts.comfortaa(
                fontSize: 18,
                fontWeight: FontWeight.w800,
                color: isDark ? Colors.white : const Color(0xFF0F172A),
              ),
            ),
            const SizedBox(height: 6),
            Text(
              "No civic hazards reported in the campus database.",
              style: GoogleFonts.comfortaa(
                fontSize: 12,
                color: isDark ? Colors.white60 : const Color(0xFF64748B),
              ),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(20),
      itemCount: _liveComplaints.length,
      itemBuilder: (context, idx) {
        final inc = _liveComplaints[idx];
        final deptColor = _getDepartmentColor(inc.department);

        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          elevation: 0,
          color: isDark ? const Color(0xFF1D2433) : Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
            side: BorderSide(
              color: isDark ? const Color(0xFF232B3B) : const Color(0xFFE2E8F0),
            ),
          ),
          child: ListTile(
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            leading: CircleAvatar(
              backgroundColor: deptColor.withValues(alpha: 0.15),
              child: Icon(_getDepartmentIcon(inc.department), color: deptColor, size: 20),
            ),
            title: Text(
              inc.rawText.isNotEmpty ? inc.rawText : inc.department,
              style: GoogleFonts.comfortaa(
                fontSize: 13.5,
                fontWeight: FontWeight.w800,
                color: isDark ? Colors.white : const Color(0xFF0F172A),
              ),
            ),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
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
                  "${inc.crowdReportCount} Students Verified • Priority: ${inc.computedPriority.toStringAsFixed(1)}",
                  style: GoogleFonts.comfortaa(
                    fontSize: 10.5,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF10B981),
                  ),
                ),
              ],
            ),
            trailing: ElevatedButton(
              onPressed: () => _handleUpvote(inc.id),
              style: ElevatedButton.styleFrom(
                backgroundColor: _upvotedIncidentIds.contains(inc.id)
                    ? const Color(0xFF10B981)
                    : (isDark ? const Color(0xFF232B3B) : const Color(0xFFF1F5F9)),
                foregroundColor: _upvotedIncidentIds.contains(inc.id)
                    ? Colors.white
                    : (isDark ? Colors.white : const Color(0xFF0F172A)),
                elevation: 0,
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              child: Text(
                _upvotedIncidentIds.contains(inc.id) ? "Upvoted" : "👍 Upvote",
                style: GoogleFonts.comfortaa(fontSize: 11, fontWeight: FontWeight.w700),
              ),
            ),
          ),
        );
      },
    );
  }

  // --- MAP LAYER ---
  Widget _buildInteractiveCampusMap(bool isDark) {
    final markers = <Marker>[];

    for (int i = 0; i < _liveComplaints.length; i++) {
      final inc = _liveComplaints[i];
      if (inc.latitude == 0.0 && inc.longitude == 0.0) continue;

      final isSelected = _selectedIncidentIndex == i;
      final color = _getDepartmentColor(inc.department);

      markers.add(
        Marker(
          point: LatLng(inc.latitude, inc.longitude),
          width: isSelected ? 64 : 48,
          height: isSelected ? 64 : 48,
          child: GestureDetector(
            onTap: () {
              setState(() => _selectedIncidentIndex = i);
              _mapController.move(LatLng(inc.latitude, inc.longitude), 17.5);
            },
            child: Stack(
              alignment: Alignment.center,
              children: [
                Container(
                  width: isSelected ? 58 : 40,
                  height: isSelected ? 58 : 40,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: color.withValues(alpha: isSelected ? 0.35 : 0.20),
                  ),
                ),
                Container(
                  width: isSelected ? 38 : 28,
                  height: isSelected ? 38 : 28,
                  decoration: BoxDecoration(
                    color: color,
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 2.0),
                    boxShadow: [
                      BoxShadow(
                        color: color.withValues(alpha: 0.5),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Center(
                    child: Icon(
                      _getDepartmentIcon(inc.department),
                      size: isSelected ? 18 : 14,
                      color: Colors.white,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return FlutterMap(
      mapController: _mapController,
      options: MapOptions(
        initialCenter: _campusCenter,
        initialZoom: 17.2,
        minZoom: 15.0,
        maxZoom: 19.0,
      ),
      children: [
        TileLayer(
          urlTemplate: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
          subdomains: const ['a', 'b', 'c', 'd'],
        ),
        MarkerLayer(markers: markers),
      ],
    );
  }

  // --- FLOATING ISSUE CARD ---
  Widget _buildFloatingIssueCard(ComplaintModel? defect, bool isDark) {
    if (defect == null) {
      return Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF141A26) : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isDark ? const Color(0xFF232B3B) : const Color(0xFFE5E7EB),
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: const Color(0xFF10B981).withValues(alpha: 0.15),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.check_circle_rounded, color: Color(0xFF10B981), size: 24),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    "Campus Radar Clear",
                    style: GoogleFonts.comfortaa(
                      fontSize: 14,
                      fontWeight: FontWeight.w800,
                      color: isDark ? Colors.white : const Color(0xFF0F172A),
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    "No active infrastructure hazards in database. Tap (+) to report.",
                    style: GoogleFonts.comfortaa(
                      fontSize: 11,
                      color: isDark ? const Color(0xFF8A94A6) : const Color(0xFF64748B),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      );
    }

    final hasUpvoted = _upvotedIncidentIds.contains(defect.id);
    final deptColor = _getDepartmentColor(defect.department);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF141A26) : Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(
          color: isDark ? const Color(0xFF232B3B) : const Color(0xFFE5E7EB),
          width: 1.2,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.35 : 0.08),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Center(
            child: Container(
              width: 36,
              height: 4,
              decoration: BoxDecoration(
                color: isDark ? Colors.white24 : Colors.black12,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),

          const SizedBox(height: 12),

          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Defect Image or Department Icon
              ClipRRect(
                borderRadius: BorderRadius.circular(14),
                child: defect.imageUrl != null && defect.imageUrl!.isNotEmpty
                    ? Image.network(
                        defect.imageUrl!,
                        width: 58,
                        height: 58,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => _buildFallbackThumbnail(deptColor, defect.department),
                      )
                    : _buildFallbackThumbnail(deptColor, defect.department),
              ),

              const SizedBox(width: 12),

              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      defect.rawText.isNotEmpty ? defect.rawText : "${defect.department} Defect",
                      style: GoogleFonts.comfortaa(
                        fontSize: 14.5,
                        fontWeight: FontWeight.w800,
                        color: isDark ? Colors.white : const Color(0xFF0F172A),
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      "${defect.crowdReportCount} Students Verified • Urgency ${defect.computedPriority.toStringAsFixed(1)}",
                      style: GoogleFonts.comfortaa(
                        fontSize: 11.5,
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFF10B981),
                      ),
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2.5),
                          decoration: BoxDecoration(
                            color: deptColor.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            defect.department,
                            style: GoogleFonts.comfortaa(
                              fontSize: 9.5,
                              fontWeight: FontWeight.w700,
                              color: deptColor,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          defect.campusZone.isNotEmpty ? defect.campusZone : "ABESEC Campus",
                          style: GoogleFonts.comfortaa(
                            fontSize: 10,
                            fontWeight: FontWeight.w600,
                            color: isDark ? const Color(0xFF8A94A6) : const Color(0xFF64748B),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),

          const SizedBox(height: 14),

          Row(
            children: [
              Expanded(
                flex: 5,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.pushNamed(
                      context,
                      AppRoutes.issueDetail,
                      arguments: defect.id,
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF0F172A),
                    foregroundColor: Colors.white,
                    elevation: 0,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: Text(
                    "View Details",
                    style: GoogleFonts.comfortaa(
                      fontSize: 12.5,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ),

              const SizedBox(width: 10),

              Expanded(
                flex: 5,
                child: ElevatedButton.icon(
                  onPressed: () => _handleUpvote(defect.id),
                  icon: Icon(
                    hasUpvoted ? Icons.thumb_up_rounded : Icons.thumb_up_outlined,
                    size: 16,
                    color: hasUpvoted ? Colors.white : const Color(0xFFF97316),
                  ),
                  label: Text(
                    hasUpvoted ? "Upvoted" : "👍 Upvote",
                    style: GoogleFonts.comfortaa(
                      fontSize: 12.5,
                      fontWeight: FontWeight.w700,
                      color: hasUpvoted ? Colors.white : (isDark ? Colors.white : const Color(0xFF0F172A)),
                    ),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: hasUpvoted
                        ? const Color(0xFF10B981)
                        : (isDark ? const Color(0xFF1D2433) : const Color(0xFFF1F5F9)),
                    elevation: 0,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildFallbackThumbnail(Color deptColor, String dept) {
    return Container(
      width: 58,
      height: 58,
      color: deptColor.withValues(alpha: 0.12),
      child: Center(
        child: Icon(_getDepartmentIcon(dept), color: deptColor, size: 28),
      ),
    );
  }

  // --- FLOATING BUILDING CHIPS ---
  Widget _buildFloatingBuildingChips(bool isDark) {
    return Positioned(
      top: 14,
      left: 16,
      right: 70,
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: [
            _buildBuildingChip("Kalpana Chawla", const LatLng(28.6358, 77.4471), isDark),
            const SizedBox(width: 8),
            _buildBuildingChip("Aryabhatta Academic", const LatLng(28.6335, 77.4465), isDark),
            const SizedBox(width: 8),
            _buildBuildingChip("Bhabha Hostel", const LatLng(28.6352, 77.4482), isDark),
            const SizedBox(width: 8),
            _buildBuildingChip("Ramanujan Labs", const LatLng(28.6338, 77.4488), isDark),
          ],
        ),
      ),
    );
  }

  Widget _buildBuildingChip(String label, LatLng coords, bool isDark) {
    return InkWell(
      onTap: () => _mapController.move(coords, 17.5),
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF141A26).withValues(alpha: 0.9) : Colors.white.withValues(alpha: 0.95),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: isDark ? Colors.white12 : const Color(0xFFE2E8F0)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.08),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 6,
              height: 6,
              decoration: const BoxDecoration(
                color: Color(0xFFF97316),
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: 6),
            Text(
              label,
              style: GoogleFonts.comfortaa(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: isDark ? Colors.white : const Color(0xFF0F172A),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // --- FLOATING MAP CONTROLS ---
  Widget _buildFloatingMapControls(bool isDark) {
    return Column(
      children: [
        _buildMapControlBtn(
          icon: Icons.near_me_outlined,
          onTap: () => _mapController.move(_campusCenter, 17.5),
          isDark: isDark,
        ),
        const SizedBox(height: 8),
        InkWell(
          onTap: () => setState(() => _is3DMode = !_is3DMode),
          borderRadius: BorderRadius.circular(10),
          child: Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(
              color: _is3DMode
                  ? const Color(0xFF0F172A)
                  : (isDark ? const Color(0xFF141A26) : Colors.white),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(
                color: isDark ? Colors.white12 : const Color(0xFFE2E8F0),
              ),
            ),
            child: Center(
              child: Text(
                "3D",
                style: GoogleFonts.comfortaa(
                  fontSize: 11,
                  fontWeight: FontWeight.w900,
                  color: _is3DMode ? Colors.white : (isDark ? Colors.white70 : const Color(0xFF0F172A)),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildMapControlBtn({
    required IconData icon,
    required VoidCallback onTap,
    required bool isDark,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Container(
        width: 38,
        height: 38,
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF141A26) : Colors.white,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: isDark ? Colors.white12 : const Color(0xFFE2E8F0)),
        ),
        child: Icon(
          icon,
          size: 18,
          color: isDark ? Colors.white70 : const Color(0xFF0F172A),
        ),
      ),
    );
  }

  // --- BOTTOM NAV DOCK ---
  Widget _buildBottomNavDock(BuildContext context, bool isDark) {
    return Container(
      height: 68,
      padding: const EdgeInsets.symmetric(horizontal: 24),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.surfaceCardDark : Colors.white,
        border: Border(
          top: BorderSide(
            color: isDark ? AppTheme.hairlineBorderDark : const Color(0xFFE5E7EB),
          ),
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          IconButton(
            icon: const Icon(Icons.radar_rounded, size: 24, color: Color(0xFFF97316)),
            onPressed: () => setState(() => _activeNavTab = 0),
          ),
          IconButton(
            icon: const Icon(Icons.list_alt_rounded, size: 24),
            onPressed: () => setState(() => _activeNavTab = 1),
          ),
          FloatingActionButton(
            mini: true,
            backgroundColor: const Color(0xFFF97316),
            foregroundColor: Colors.white,
            elevation: 4,
            onPressed: () => Navigator.pushNamed(context, AppRoutes.reportIssue),
            child: const Icon(Icons.add, size: 24),
          ),
          IconButton(
            icon: const Icon(Icons.history_rounded, size: 24),
            onPressed: () => Navigator.pushNamed(context, AppRoutes.myReports),
          ),
          IconButton(
            icon: const Icon(Icons.notifications_none_rounded, size: 24),
            onPressed: () {},
          ),
        ],
      ),
    );
  }

  Widget _buildNavSegmentPill({
    required String label,
    required bool isSelected,
    required VoidCallback onTap,
    required bool isDark,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected
              ? const Color(0xFF0F172A)
              : Colors.transparent,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Text(
          label,
          style: GoogleFonts.comfortaa(
            fontSize: 11.5,
            fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
            color: isSelected ? Colors.white : (isDark ? Colors.white70 : const Color(0xFF64748B)),
          ),
        ),
      ),
    );
  }
}
