import 'package:flutter/material.dart';
import '../../config/theme.dart';
import '../../config/app_routes.dart';
import '../../services/api_client.dart';
import '../../widgets/desktop_scaffold.dart';
import '../../widgets/severity_badge.dart';

class AdminTicketsScreen extends StatefulWidget {
  const AdminTicketsScreen({super.key});

  @override
  State<AdminTicketsScreen> createState() => _AdminTicketsScreenState();
}

class _AdminTicketsScreenState extends State<AdminTicketsScreen> {
  final ApiClient _apiClient = ApiClient();
  late Future<List<dynamic>> _clustersFuture;

  String _filterStatus = 'ALL';
  String _searchQuery = '';
  final TextEditingController _searchController = TextEditingController();

  // High-fidelity presentation seed clusters (ABESEC Campus)
  final List<Map<String, dynamic>> _seedClusters = [
    {
      'id': 'ACTS-2026-1042',
      'preview_complaint_id': 'ACTS-2026-1042',
      'title': 'Severe Road Pothole & Cavity on Main Driveway',
      'department': 'CIVIL',
      'campus_zone': 'Gate 1 Main Boulevard (Near Kalpana Chawla Block)',
      'computed_priority': 9.4,
      'crowd_report_count': 8,
      'status': 'QUEUED',
      'crew': 'Civil Rapid Repair Crew',
      'description': 'Deep road cavity causing vehicular bottoming out and pedestrian hazard during shift change.',
      'time_ago': '14 mins ago',
    },
    {
      'id': 'ACTS-2026-1089',
      'preview_complaint_id': 'ACTS-2026-1089',
      'title': 'High-Voltage Exposed Live Conduit & Sparks',
      'department': 'ELECTRICAL',
      'campus_zone': 'Bhabha Block Ground Floor Corridor',
      'computed_priority': 9.8,
      'crowd_report_count': 14,
      'status': 'ASSIGNED',
      'crew': 'Electrical Emergency Crew',
      'description': 'Conduit cover missing with exposed 415V wiring near water cooler. High risk of shock.',
      'time_ago': '32 mins ago',
    },
    {
      'id': 'ACTS-2026-1102',
      'preview_complaint_id': 'ACTS-2026-1102',
      'title': 'Main Water Pipeline Fracture & Corridor Flooding',
      'department': 'PLUMBING',
      'campus_zone': 'Between Central Mess & Boys Hostel 2',
      'computed_priority': 8.5,
      'crowd_report_count': 6,
      'status': 'IN_PROGRESS',
      'crew': 'Water Supply & Plumbing Squad',
      'description': 'Pressurized pipe rupture leaking across pedestrian walkway creating slippery surface.',
      'time_ago': '1 hour ago',
    },
    {
      'id': 'ACTS-2026-1115',
      'preview_complaint_id': 'ACTS-2026-1115',
      'title': 'Cafeteria Solid Waste Bin Overflow',
      'department': 'SANITATION',
      'campus_zone': 'Cafeteria Central Courtyard',
      'computed_priority': 5.8,
      'crowd_report_count': 3,
      'status': 'RESOLVED',
      'crew': 'Campus Hygiene Squad',
      'description': 'Overfilled waste bins attracting stray animals. Cleared and sanitized.',
      'time_ago': '3 hours ago',
    },
  ];

  @override
  void initState() {
    super.initState();
    _loadClusters();
  }

  void _loadClusters() {
    _clustersFuture = _fetchClustersWithFallback();
  }

  Future<List<dynamic>> _fetchClustersWithFallback() async {
    try {
      final res = await _apiClient.fetchAdminClusters();
      if (res.isNotEmpty) return res;
    } catch (_) {}
    return _seedClusters;
  }

  Future<void> _refresh() async {
    setState(() {
      _loadClusters();
    });
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final isDesktop = size.width >= 900;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textPrimary = isDark ? Colors.white : const Color(0xFF0F172A);
    final textMuted = isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B);

    return DesktopScaffold(
      title: 'Triage Tickets & Crowd Clusters',
      currentRoute: AppRoutes.adminTickets,
      actions: [
        IconButton(
          icon: const Icon(Icons.refresh_rounded),
          tooltip: 'Refresh Queue',
          onPressed: _refresh,
        ),
      ],
      body: FutureBuilder<List<dynamic>>(
        future: _clustersFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          final allClusters = (snapshot.data != null && snapshot.data!.isNotEmpty)
              ? snapshot.data!
              : _seedClusters;

          // Filter by status & search
          final filtered = allClusters.where((c) {
            final st = (c['status'] ?? 'QUEUED').toString().toUpperCase();
            if (_filterStatus != 'ALL' && st != _filterStatus) {
              return false;
            }
            if (_searchQuery.isNotEmpty) {
              final q = _searchQuery.toLowerCase();
              final title = (c['title'] ?? '').toString().toLowerCase();
              final zone = (c['campus_zone'] ?? '').toString().toLowerCase();
              final dept = (c['department'] ?? '').toString().toLowerCase();
              final id = (c['id'] ?? '').toString().toLowerCase();
              if (!title.contains(q) && !zone.contains(q) && !dept.contains(q) && !id.contains(q)) {
                return false;
              }
            }
            return true;
          }).toList();

          final criticalCount = allClusters.where((c) {
            final p = (c['computed_priority'] as num?)?.toDouble() ?? 5.0;
            return p >= 8.0;
          }).length;

          final totalCrowdReports = allClusters.fold<int>(0, (sum, c) {
            final cnt = (c['crowd_report_count'] ?? c['report_count'] ?? 1) as num;
            return sum + cnt.toInt();
          });

          return SingleChildScrollView(
            padding: EdgeInsets.symmetric(
              horizontal: isDesktop ? 36 : 16,
              vertical: 20,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Top KPI Stat Ribbon
                _buildMetricsRibbon(
                  isDesktop: isDesktop,
                  isDark: isDark,
                  totalTickets: allClusters.length,
                  criticalCount: criticalCount,
                  totalReports: totalCrowdReports,
                ),

                const SizedBox(height: 20),

                // Search & Filter Toolbar
                _buildFilterBar(isDark),

                const SizedBox(height: 16),

                // Tickets List
                if (filtered.isEmpty)
                  Container(
                    padding: const EdgeInsets.all(40),
                    alignment: Alignment.center,
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.search_off_rounded, size: 48, color: textMuted),
                        const SizedBox(height: 12),
                        Text(
                          'No tickets match the selected filters.',
                          style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: textMuted),
                        ),
                      ],
                    ),
                  )
                else
                  ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: filtered.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final item = filtered[index];
                      return _buildClusterCard(item, isDesktop, isDark, textPrimary, textMuted);
                    },
                  ),
              ],
            ),
          );
        },
      ),
    );
  }

  // --- KPI METRIC RIBBON ---
  Widget _buildMetricsRibbon({
    required bool isDesktop,
    required bool isDark,
    required int totalTickets,
    required int criticalCount,
    required int totalReports,
  }) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final cardWidth = isDesktop ? (constraints.maxWidth - 36) / 4 : (constraints.maxWidth - 12) / 2;

        final metrics = [
          {
            "label": "Active Incidents",
            "val": "$totalTickets",
            "sub": "Triage Queue",
            "icon": Icons.inbox_rounded,
            "color": const Color(0xFF2563EB),
          },
          {
            "label": "High Priority",
            "val": "$criticalCount",
            "sub": "Severity >= 8.0",
            "icon": Icons.warning_amber_rounded,
            "color": const Color(0xFFEF4444),
          },
          {
            "label": "Crowd Merged",
            "val": "$totalReports",
            "sub": "Student Reports",
            "icon": Icons.groups_rounded,
            "color": const Color(0xFF8B5CF6),
          },
          {
            "label": "Campus Health",
            "val": "98.2%",
            "sub": "ABESEC CIHI",
            "icon": Icons.verified_rounded,
            "color": const Color(0xFF10B981),
          },
        ];

        return Wrap(
          spacing: 12,
          runSpacing: 12,
          children: metrics.map((m) {
            final color = m['color'] as Color;
            return Container(
              width: cardWidth,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF0F172A) : Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: isDark ? const Color(0xFF1E293B) : const Color(0xFFE2E8F0),
                ),
              ),
              child: Row(
                children: [
                  Container(
                    width: 42,
                    height: 42,
                    decoration: BoxDecoration(
                      color: color.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(m['icon'] as IconData, color: color, size: 22),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          m['val'] as String,
                          style: TextStyle(
                            fontSize: 19,
                            fontWeight: FontWeight.w900,
                            letterSpacing: -0.5,
                            color: isDark ? Colors.white : const Color(0xFF0F172A),
                          ),
                        ),
                        Text(
                          m['label'] as String,
                          style: TextStyle(
                            fontSize: 11.5,
                            fontWeight: FontWeight.w600,
                            color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            );
          }).toList(),
        );
      },
    );
  }

  // --- FILTER & SEARCH BAR ---
  Widget _buildFilterBar(bool isDark) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF0F172A) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? const Color(0xFF1E293B) : const Color(0xFFE2E8F0),
        ),
      ),
      child: Column(
        children: [
          // Search Input
          TextField(
            controller: _searchController,
            onChanged: (val) => setState(() => _searchQuery = val.trim()),
            style: TextStyle(
              fontSize: 13.5,
              color: isDark ? Colors.white : const Color(0xFF0F172A),
            ),
            decoration: InputDecoration(
              hintText: "Search tickets by title, zone, ID, or department...",
              hintStyle: TextStyle(
                fontSize: 13,
                color: isDark ? const Color(0xFF64748B) : const Color(0xFF94A3B8),
              ),
              prefixIcon: const Icon(Icons.search_rounded, size: 20),
              suffixIcon: _searchQuery.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear_rounded, size: 18),
                      onPressed: () {
                        _searchController.clear();
                        setState(() => _searchQuery = '');
                      },
                    )
                  : null,
              filled: true,
              fillColor: isDark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC),
              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
            ),
          ),

          const SizedBox(height: 10),

          // Horizontal Rounded Pill Filters
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _buildPillFilter('ALL', 'All Incidents', isDark),
                const SizedBox(width: 8),
                _buildPillFilter('QUEUED', 'Needs Action', isDark),
                const SizedBox(width: 8),
                _buildPillFilter('ASSIGNED', 'Crew Dispatched', isDark),
                const SizedBox(width: 8),
                _buildPillFilter('IN_PROGRESS', 'In Progress', isDark),
                const SizedBox(width: 8),
                _buildPillFilter('RESOLVED', 'Resolved', isDark),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPillFilter(String key, String label, bool isDark) {
    final isSelected = _filterStatus == key;
    return InkWell(
      onTap: () => setState(() => _filterStatus = key),
      borderRadius: BorderRadius.circular(20),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
        decoration: BoxDecoration(
          color: isSelected
              ? const Color(0xFF2563EB)
              : (isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9)),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected
                ? const Color(0xFF2563EB)
                : (isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0)),
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
            color: isSelected
                ? Colors.white
                : (isDark ? const Color(0xFFCBD5E1) : const Color(0xFF475569)),
          ),
        ),
      ),
    );
  }

  // --- CLUSTER CARD ---
  Widget _buildClusterCard(
    Map<String, dynamic> item,
    bool isDesktop,
    bool isDark,
    Color textPrimary,
    Color textMuted,
  ) {
    final priority = (item['computed_priority'] as num?)?.toDouble() ?? 5.0;
    final crowdCount = item['crowd_report_count'] ?? item['report_count'] ?? 1;
    final status = (item['status'] ?? 'QUEUED').toString();
    final statusColor = _getStatusColor(status);
    final previewId = item['preview_complaint_id'] ?? item['id'];
    final crew = item['crew'] ?? 'Maintenance Crew';
    final zone = item['campus_zone'] ?? 'Main Campus';

    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF0F172A) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? const Color(0xFF1E293B) : const Color(0xFFE2E8F0),
        ),
        boxShadow: isDark
            ? null
            : [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.02),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(16),
        child: InkWell(
          onTap: () {
            if (previewId != null) {
              Navigator.pushNamed(context, AppRoutes.issueDetail, arguments: previewId.toString());
            }
          },
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.all(18),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Priority Score Badge
                SeverityBadge(severity: priority.round(), fontSize: 13),
                const SizedBox(width: 16),

                // Main Info Block
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Title & Crowd Badge Row
                      Wrap(
                        crossAxisAlignment: WrapCrossAlignment.center,
                        spacing: 8,
                        runSpacing: 4,
                        children: [
                          Text(
                            item['title'] ?? 'Campus Infrastructure Incident',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w800,
                              color: textPrimary,
                            ),
                          ),
                          if (crowdCount > 1)
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: const Color(0xFF8B5CF6).withValues(alpha: 0.12),
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(
                                  color: const Color(0xFF8B5CF6).withValues(alpha: 0.3),
                                ),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(Icons.people_alt_rounded, size: 12, color: Color(0xFF8B5CF6)),
                                  const SizedBox(width: 4),
                                  Text(
                                    '$crowdCount Reports Merged',
                                    style: const TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w700,
                                      color: Color(0xFF8B5CF6),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                        ],
                      ),

                      const SizedBox(height: 8),

                      // Zone & Department Pills
                      Wrap(
                        spacing: 8,
                        runSpacing: 6,
                        crossAxisAlignment: WrapCrossAlignment.center,
                        children: [
                          Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.location_on_rounded, size: 14, color: textMuted),
                              const SizedBox(width: 4),
                              Text(
                                zone,
                                style: TextStyle(
                                  fontSize: 12.5,
                                  color: textMuted,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                          Container(
                            width: 4,
                            height: 4,
                            decoration: BoxDecoration(
                              color: textMuted.withValues(alpha: 0.5),
                              shape: BoxShape.circle,
                            ),
                          ),
                          Text(
                            'Dept: ${item['department'] ?? 'CIVIL'}',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: isDark ? const Color(0xFF38BDF8) : const Color(0xFF0284C7),
                            ),
                          ),
                          Container(
                            width: 4,
                            height: 4,
                            decoration: BoxDecoration(
                              color: textMuted.withValues(alpha: 0.5),
                              shape: BoxShape.circle,
                            ),
                          ),
                          Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.engineering_rounded, size: 13, color: textMuted),
                              const SizedBox(width: 4),
                              Text(
                                crew,
                                style: TextStyle(
                                  fontSize: 12,
                                  color: textMuted,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                const SizedBox(width: 12),

                // Status Chip & Forward Arrow
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: statusColor.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: statusColor.withValues(alpha: 0.4)),
                      ),
                      child: Text(
                        status.replaceAll('_', ' '),
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                          color: statusColor,
                        ),
                      ),
                    ),
                    const SizedBox(height: 10),
                    Icon(
                      Icons.arrow_forward_ios_rounded,
                      size: 13,
                      color: textMuted,
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status.toUpperCase()) {
      case 'RESOLVED':
      case 'CLOSED':
        return AppTheme.statusResolved;
      case 'IN_PROGRESS':
      case 'ASSIGNED':
        return AppTheme.statusInProgress;
      default:
        return AppTheme.statusPending;
    }
  }
}
