import 'package:flutter/material.dart';
import '../config/theme.dart';

class CustomMapPin extends StatelessWidget {
  final int severity;
  final VoidCallback? onTap;

  const CustomMapPin({
    super.key,
    required this.severity,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    Color pinColor = AppTheme.getSeverityColor(severity);

    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              color: pinColor,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: pinColor.withValues(alpha: 0.4),
                  blurRadius: 8,
                  spreadRadius: 2,
                ),
              ],
            ),
            child: const Icon(
              Icons.location_on,
              color: Colors.white,
              size: 20,
            ),
          ),
          Container(
            width: 4,
            height: 4,
            decoration: BoxDecoration(
              color: pinColor,
              shape: BoxShape.circle,
            ),
          ),
        ],
      ),
    );
  }
}
