import 'package:flutter/material.dart';
import '../config/theme.dart';

class RightAuxiliaryPanel extends StatelessWidget {
  final bool isExpanded;
  final VoidCallback onToggle;
  final bool isAdmin;
  final String currentRoute;

  const RightAuxiliaryPanel({
    super.key,
    required this.isExpanded,
    required this.onToggle,
    required this.isAdmin,
    required this.currentRoute,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final panelBg = isDark ? const Color(0xFF0D121F) : const Color(0xFFFAFAFC);
    final borderCol = isDark ? const Color(0xFF1E293B) : const Color(0xFFE2E8F0);
    final cardBg = isDark ? const Color(0xFF131B2E) : Colors.white;
    final textPrimary = isDark ? AppTheme.darkText : AppTheme.lightText;
    final textMuted = isDark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted;

    return AnimatedContainer(
      duration: const Duration(milliseconds: 220),
      curve: Curves.easeInOutCubic,
      width: isExpanded ? 310 : 0,
      decoration: BoxDecoration(
        color: panelBg,
        border: Border(left: BorderSide(color: borderCol, width: 1)),
      ),
      child: ClipRect(
        child: OverflowBox(
          minWidth: 310,
          maxWidth: 310,
          alignment: Alignment.topLeft,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Header
              Container(
                height: 64,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                decoration: BoxDecoration(
                  border: Border(bottom: BorderSide(color: borderCol)),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: (isAdmin ? Colors.purple : AppTheme.secondaryTeal).withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Icon(
                        isAdmin ? Icons.speed_rounded : Icons.hub_rounded,
                        color: isAdmin ? Colors.purple.shade300 : AppTheme.secondaryTeal,
                        size: 18,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            isAdmin ? 'TRIAGE TELEMETRY' : 'CAMPUS PULSE',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 0.8,
                              color: textPrimary,
                            ),
                          ),
                          Text(
                            isAdmin ? 'Real-time Operations' : 'Live Campus Vitality',
                            style: TextStyle(fontSize: 10, color: textMuted),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close_rounded, size: 18),
                      color: textMuted,
                      tooltip: 'Hide Panel',
                      splashRadius: 18,
                      onPressed: onToggle,
                    ),
                  ],
                ),
              ),

              // Content Area
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.all(16),
                  children: isAdmin
                      ? _buildAdminTelemetry(cardBg, borderCol, textPrimary, textMuted)
                      : _buildCitizenPulse(cardBg, borderCol, textPrimary, textMuted),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  List<Widget> _buildCitizenPulse(Color cardBg, Color borderCol, Color textPrimary, Color textMuted) {
    return [
      // Live Operational Status
      Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: cardBg,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: borderCol),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.wifi_tethering_rounded, color: AppTheme.secondaryTeal, size: 16),
                const SizedBox(width: 6),
                Text(
                  'Campus Service Health',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: textPrimary),
                ),
              ],
            ),
            const SizedBox(height: 12),
            _serviceStatusRow('Electricity & Lighting', 'Operational', Colors.green, textPrimary),
            const SizedBox(height: 8),
            _serviceStatusRow('Water Supply & Plumb', 'Active Normal', Colors.green, textPrimary),
            const SizedBox(height: 8),
            _serviceStatusRow('Sanitation Crews', 'In Triage', Colors.amber, textPrimary),
            const SizedBox(height: 8),
            _serviceStatusRow('Roads & Walkways', 'Clear', Colors.green, textPrimary),
          ],
        ),
      ),

      const SizedBox(height: 16),

      // Recent Resolved Ticker
      Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: cardBg,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: borderCol),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.task_alt_rounded, color: Colors.green, size: 16),
                const SizedBox(width: 6),
                Text(
                  'Recent Fixes on Campus',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: textPrimary),
                ),
              ],
            ),
            const SizedBox(height: 10),
            _milestoneItem(
              'Hostel B walkway light repaired',
              'Electrical Team • 2h ago',
              textPrimary,
              textMuted,
            ),
            const Divider(height: 16),
            _milestoneItem(
              'Library 2nd floor water leak sealed',
              'Civil Dept • 5h ago',
              textPrimary,
              textMuted,
            ),
            const Divider(height: 16),
            _milestoneItem(
              'Cafeteria trash bin overflow cleared',
              'Sanitation • Yesterday',
              textPrimary,
              textMuted,
            ),
          ],
        ),
      ),

      const SizedBox(height: 16),

      // Emergency Contacts Box
      Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppTheme.primaryBlue.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppTheme.primaryBlue.withValues(alpha: 0.2)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Row(
              children: [
                Icon(Icons.phone_in_talk_rounded, color: AppTheme.primaryBlue, size: 16),
                SizedBox(width: 6),
                Text(
                  'Campus Helplines',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.primaryBlue),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Text('• Security Control: +91 120-2400101', style: TextStyle(fontSize: 11, color: textPrimary)),
            const SizedBox(height: 4),
            Text('• Medical Emergency: Ext. 102', style: TextStyle(fontSize: 11, color: textPrimary)),
            const SizedBox(height: 4),
            Text('• Maintenance Helpdesk: Ext. 204', style: TextStyle(fontSize: 11, color: textPrimary)),
          ],
        ),
      ),
    ];
  }

  List<Widget> _buildAdminTelemetry(Color cardBg, Color borderCol, Color textPrimary, Color textMuted) {
    return [
      // Triage KPI Metrics
      Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: cardBg,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: borderCol),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.bolt_rounded, color: Colors.purple, size: 16),
                const SizedBox(width: 6),
                Text(
                  'Triage Engine Metrics',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: textPrimary),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _metricPill('94.2%', 'AI Confidence', Colors.green, textPrimary, textMuted),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _metricPill('< 4h', 'Avg Triage SLA', AppTheme.primaryBlue, textPrimary, textMuted),
                ),
              ],
            ),
          ],
        ),
      ),

      const SizedBox(height: 16),

      // Department Workload Distribution
      Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: cardBg,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: borderCol),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.bar_chart_rounded, color: AppTheme.secondaryTeal, size: 16),
                const SizedBox(width: 6),
                Text(
                  'Department Active Load',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: textPrimary),
                ),
              ],
            ),
            const SizedBox(height: 12),
            _workloadBar('Sanitation & Hygiene', 0.65, Colors.amber, textPrimary),
            const SizedBox(height: 10),
            _workloadBar('Civil Infrastructure', 0.45, AppTheme.primaryBlue, textPrimary),
            const SizedBox(height: 10),
            _workloadBar('Electrical & Energy', 0.30, Colors.green, textPrimary),
            const SizedBox(height: 10),
            _workloadBar('Horticulture & Grounds', 0.15, Colors.teal, textPrimary),
          ],
        ),
      ),

      const SizedBox(height: 16),

      // ML Clustered Crowds Alert
      Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.purple.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Colors.purple.withValues(alpha: 0.25)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.auto_awesome_rounded, color: Colors.purple, size: 16),
                const SizedBox(width: 6),
                Text(
                  'DBSCAN Spatial Cluster',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.purple.shade300),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              'High density of recurring water pooling detected near Academic Block C steps.',
              style: TextStyle(fontSize: 11, color: textPrimary),
            ),
          ],
        ),
      ),
    ];
  }

  Widget _serviceStatusRow(String name, String status, Color statusCol, Color textPrimary) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Expanded(
          child: Text(name, style: TextStyle(fontSize: 11.5, color: textPrimary)),
        ),
        Row(
          children: [
            Container(
              width: 7,
              height: 7,
              decoration: BoxDecoration(color: statusCol, shape: BoxShape.circle),
            ),
            const SizedBox(width: 6),
            Text(
              status,
              style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.bold, color: statusCol),
            ),
          ],
        ),
      ],
    );
  }

  Widget _milestoneItem(String title, String subtitle, Color textPrimary, Color textMuted) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w600, color: textPrimary),
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
        ),
        const SizedBox(height: 2),
        Text(subtitle, style: TextStyle(fontSize: 10, color: textMuted)),
      ],
    );
  }

  Widget _metricPill(String val, String label, Color accent, Color textPrimary, Color textMuted) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
      decoration: BoxDecoration(
        color: accent.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Column(
        children: [
          Text(
            val,
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: accent),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: TextStyle(fontSize: 9.5, color: textMuted, fontWeight: FontWeight.w600),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _workloadBar(String dept, double progress, Color barCol, Color textPrimary) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(dept, style: TextStyle(fontSize: 11, color: textPrimary)),
            Text('${(progress * 100).toInt()}%', style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.bold, color: barCol)),
          ],
        ),
        const SizedBox(height: 5),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: progress,
            backgroundColor: barCol.withValues(alpha: 0.15),
            valueColor: AlwaysStoppedAnimation<Color>(barCol),
            minHeight: 5,
          ),
        ),
      ],
    );
  }
}
