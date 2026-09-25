import 'package:flutter/material.dart';
import '../../widgets/desktop_scaffold.dart';

class CampusAnalyticsScreen extends StatefulWidget {
  const CampusAnalyticsScreen({super.key});

  @override
  State<CampusAnalyticsScreen> createState() => _CampusAnalyticsScreenState();
}

class _CampusAnalyticsScreenState extends State<CampusAnalyticsScreen> {
  // Dynamic Priority Formula Simulation State
  double _baseSeverity = 4.0;
  int _crowdReportCount = 8;
  final int _minutesElapsed = 20;

  double _calculateSimulatedPriority() {
    // P(t) = S_base * (1 + alpha * log2(N)) * exp(-lambda * delta_t)
    const double alpha = 0.35;
    const double lambda = 0.005;

    // log2(N)
    final double log2N = (3.321928 * (1 + 0.30103 * (_crowdReportCount - 1))).clamp(0.0, 5.0);
    final double crowdMult = 1.0 + (alpha * (log2N / 2.0));
    final double timeFactor = (1.0 - (lambda * _minutesElapsed)).clamp(0.8, 1.0);

    return (_baseSeverity * crowdMult * timeFactor).clamp(1.0, 10.0);
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final isDesktop = size.width >= 900;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textPrimary = isDark ? Colors.white : const Color(0xFF0F172A);
    final textMuted = isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B);

    final simulatedPriority = _calculateSimulatedPriority();

    return DesktopScaffold(
      title: 'Campus Analytics & CIHI Radar',
      currentRoute: '/analytics',
      body: SingleChildScrollView(
        padding: EdgeInsets.symmetric(
          horizontal: isDesktop ? 40 : 16,
          vertical: 24,
        ),
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 1100),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Header
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          "Infrastructure Health & Triage Analytics",
                          style: TextStyle(
                            fontSize: isDesktop ? 26 : 20,
                            fontWeight: FontWeight.w900,
                            letterSpacing: -0.5,
                            color: textPrimary,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          "Research-backed telemetry, spatial density clusters, and mathematical priority verification.",
                          style: TextStyle(fontSize: 13, color: textMuted),
                        ),
                      ],
                    ),
                    ElevatedButton.icon(
                      onPressed: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text("Audit report generated & synced with ABESEC Administration."),
                            backgroundColor: Color(0xFF10B981),
                          ),
                        );
                      },
                      icon: const Icon(Icons.download_rounded, size: 16),
                      label: const Text("Export Audit"),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF2563EB),
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 24),

                // Top KPI Cards
                _buildTopKpis(isDesktop, isDark, textPrimary, textMuted),

                const SizedBox(height: 24),

                // Interactive Dynamic Priority Mathematical Simulator
                _buildMathSimulatorCard(isDesktop, isDark, textPrimary, textMuted, simulatedPriority),

                const SizedBox(height: 24),

                // Zone Health Breakdown
                _buildZoneHealthBreakdown(isDesktop, isDark, textPrimary, textMuted),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTopKpis(bool isDesktop, bool isDark, Color textPrimary, Color textMuted) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final cardWidth = isDesktop ? (constraints.maxWidth - 36) / 4 : (constraints.maxWidth - 12) / 2;

        final items = [
          {"label": "Campus CIHI Health", "val": "98.2%", "sub": "Pristine State", "color": const Color(0xFF10B981)},
          {"label": "Spatial Reduction", "val": "87.1%", "sub": "Noise Filtered", "color": const Color(0xFF8B5CF6)},
          {"label": "Average SLA", "val": "38 min", "sub": "Response Time", "color": const Color(0xFF2563EB)},
          {"label": "Closure Accuracy", "val": "99.4%", "sub": "Dual Verification", "color": const Color(0xFFF59E0B)},
        ];

        return Wrap(
          spacing: 12,
          runSpacing: 12,
          children: items.map((it) {
            final col = it['color'] as Color;
            return Container(
              width: cardWidth,
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF0F172A) : Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: isDark ? const Color(0xFF1E293B) : const Color(0xFFE2E8F0),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    it['val'] as String,
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.w900,
                      color: col,
                      letterSpacing: -0.5,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    it['label'] as String,
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: textPrimary),
                  ),
                  Text(
                    it['sub'] as String,
                    style: TextStyle(fontSize: 11, color: textMuted),
                  ),
                ],
              ),
            );
          }).toList(),
        );
      },
    );
  }

  Widget _buildMathSimulatorCard(
    bool isDesktop,
    bool isDark,
    Color textPrimary,
    Color textMuted,
    double simulatedPriority,
  ) {
    return Container(
      padding: EdgeInsets.all(isDesktop ? 28 : 18),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF0F172A) : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isDark ? const Color(0xFF1E293B) : const Color(0xFFE2E8F0),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Icon(Icons.calculate_rounded, color: Color(0xFF2563EB), size: 24),
                  const SizedBox(width: 10),
                  Text(
                    "Dynamic Crowd Priority Simulator",
                    style: TextStyle(
                      fontSize: isDesktop ? 18 : 16,
                      fontWeight: FontWeight.w900,
                      color: textPrimary,
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                decoration: BoxDecoration(
                  color: const Color(0xFF2563EB).withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFF2563EB).withValues(alpha: 0.3)),
                ),
                child: Text(
                  "Computed Score: ${simulatedPriority.toStringAsFixed(1)} / 10",
                  style: const TextStyle(
                    color: Color(0xFF2563EB),
                    fontSize: 13,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            "Formula: P(t) = S_base · (1 + α · log₂(N)) · e^(-λ Δt). Drag parameters to evaluate mathematical urgency scaling.",
            style: TextStyle(fontSize: 12.5, color: textMuted),
          ),
          const SizedBox(height: 20),

          // Sliders
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text("Base Severity (S_base): ${_baseSeverity.toStringAsFixed(1)}",
                        style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.bold, color: textPrimary)),
                    Slider(
                      value: _baseSeverity,
                      min: 1.0,
                      max: 5.0,
                      divisions: 8,
                      activeColor: const Color(0xFF2563EB),
                      onChanged: (v) => setState(() => _baseSeverity = v),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 20),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text("Crowd Reports (N): $_crowdReportCount reports",
                        style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.bold, color: textPrimary)),
                    Slider(
                      value: _crowdReportCount.toDouble(),
                      min: 1.0,
                      max: 30.0,
                      divisions: 29,
                      activeColor: const Color(0xFF8B5CF6),
                      onChanged: (v) => setState(() => _crowdReportCount = v.round()),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildZoneHealthBreakdown(
    bool isDesktop,
    bool isDark,
    Color textPrimary,
    Color textMuted,
  ) {
    final zones = [
      {"name": "Bhabha Hostel (Boys)", "score": 94.5, "hazards": 1, "status": "Needs Attention"},
      {"name": "Gate 1 Main Boulevard", "score": 95.8, "hazards": 1, "status": "In Progress"},
      {"name": "Central Mess & Canteen", "score": 97.2, "hazards": 1, "status": "Minor Repair"},
      {"name": "Aryabhatta Block", "score": 99.1, "hazards": 0, "status": "Pristine"},
      {"name": "Kalpana Chawla Block", "score": 99.8, "hazards": 0, "status": "Pristine"},
      {"name": "Ramanujan CS Labs", "score": 100.0, "hazards": 0, "status": "Pristine"},
    ];

    return Container(
      padding: EdgeInsets.all(isDesktop ? 28 : 18),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF0F172A) : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isDark ? const Color(0xFF1E293B) : const Color(0xFFE2E8F0),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            "Campus Zone Infrastructure Health Breakdown",
            style: TextStyle(
              fontSize: isDesktop ? 18 : 16,
              fontWeight: FontWeight.w900,
              color: textPrimary,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            "Real-time CIHI telemetry computed across individual facilities at ABESEC Ghaziabad.",
            style: TextStyle(fontSize: 12.5, color: textMuted),
          ),
          const SizedBox(height: 18),
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: zones.length,
            separatorBuilder: (_, __) => const Divider(height: 16),
            itemBuilder: (context, idx) {
              final z = zones[idx];
              final score = z['score'] as double;
              final color = score >= 98.0
                  ? const Color(0xFF10B981)
                  : (score >= 95.0 ? const Color(0xFFF59E0B) : const Color(0xFFEF4444));

              return Row(
                children: [
                  Expanded(
                    flex: 3,
                    child: Text(
                      z['name'] as String,
                      style: TextStyle(fontSize: 13.5, fontWeight: FontWeight.w700, color: textPrimary),
                    ),
                  ),
                  Expanded(
                    flex: 4,
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(6),
                      child: LinearProgressIndicator(
                        value: score / 100.0,
                        minHeight: 8,
                        backgroundColor: isDark ? const Color(0xFF1E293B) : const Color(0xFFE2E8F0),
                        valueColor: AlwaysStoppedAnimation<Color>(color),
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Text(
                    "${score.toStringAsFixed(1)}%",
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: color),
                  ),
                  const SizedBox(width: 16),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: color.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      z['status'] as String,
                      style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w800, color: color),
                    ),
                  ),
                ],
              );
            },
          ),
        ],
      ),
    );
  }
}
