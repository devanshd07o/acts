import 'package:flutter/material.dart';
import '../config/theme.dart';

class SeverityBadge extends StatelessWidget {
  final int severity;
  final double fontSize;

  const SeverityBadge({
    super.key,
    required this.severity,
    this.fontSize = 12.0,
  });

  @override
  Widget build(BuildContext context) {
    Color badgeColor = AppTheme.getSeverityColor(severity);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: badgeColor.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: badgeColor, width: 1),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.warning_amber_rounded, size: fontSize + 2, color: badgeColor),
          const SizedBox(width: 4),
          Text(
            'Severity: $severity/10',
            style: TextStyle(
              color: badgeColor,
              fontWeight: FontWeight.bold,
              fontSize: fontSize,
            ),
          ),
        ],
      ),
    );
  }
}
