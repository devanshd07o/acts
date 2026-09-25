import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // --- Curated 2026 Brand & Semantic Tokens (Non-Generic) ---
  static const Color brandSapphire = Color(0xFF1D4ED8);     // Deep Sapphire Action
  static const Color primaryBlue = Color(0xFF2563EB);       // Primary Interactive Blue
  static const Color accentBlue = Color(0xFF3B82F6);        // Active Focus Blue
  static const Color secondaryTeal = Color(0xFF0F766E);     // Deep Muted Teal
  static const Color secondaryTealDark = Color(0xFF14B8A6); // Glowing Triage Accent
  
  // --- Muted Operational Signals (Anti-AI Clowns) ---
  static const Color signalVermilion = Color(0xFFDC2626);   // High-Voltage / Safety Hazard (Critical)
  static const Color signalAmber = Color(0xFFB45309);       // Warm Ochre (Needs Action / Queued)
  static const Color signalCobalt = Color(0xFF0284C7);      // Sky Cobalt (In Progress / Dispatched)
  static const Color signalEmerald = Color(0xFF059669);     // Lustrous Emerald (Verified Resolved)

  // --- Light Theme Tokens (Warm Ceramic Studio Finish) ---
  static const Color lightBackground = Color(0xFFF6F7F9);   // Warm Ceramic Canvas
  static const Color lightSurface = Color(0xFFFFFFFF);      // Crisp White Card
  static const Color lightSurfaceElevated = Color(0xFFF0F2F5); // Soft Titanium Pill
  static const Color lightBorder = Color(0xFFE5E7EB);       // Hairline 1px Divider
  static const Color lightText = Color(0xFF0A0D14);         // Near-Black Display Text
  static const Color lightTextMuted = Color(0xFF64748B);    // Neutral Slate

  // --- Dark Theme Tokens (Deep Obsidian Studio Finish) ---
  static const Color darkBackground = Color(0xFF0B0F17);    // Deep Obsidian Canvas
  static const Color darkSurface = Color(0xFF141A26);       // Midnight Glass Surface
  static const Color darkSurfaceElevated = Color(0xFF1D2433); // Slate Elevation Pill
  static const Color darkBorder = Color(0xFF232B3B);        // Crisp 1px Divider
  static const Color darkText = Color(0xFFF8FAFC);          // Titanium White Text
  static const Color darkTextMuted = Color(0xFF8A94A6);     // Muted Slate Text
  static const Color primaryDark = Color(0xFF0F172A);

  // --- Severity Tokens ---
  static const Color severityLow = signalEmerald;
  static const Color severityMedium = signalAmber;
  static const Color severityHigh = Color(0xFFC2410C);      // Burnt Amber
  static const Color severityCritical = signalVermilion;

  // --- Status Tokens ---
  static const Color statusPending = signalAmber;
  static const Color statusAssigned = Color(0xFF7C3AED);    // Velvet Violet
  static const Color statusInProgress = signalCobalt;
  static const Color statusResolved = signalEmerald;
  static const Color statusReopened = signalVermilion;

  // Backward compatibility & DESIGN_SYSTEM.md aliases
  static const Color backgroundLight = lightBackground;
  static const Color surfaceWhite = lightSurface;
  static const Color surfaceCard = lightSurface;
  static const Color borderLight = lightBorder;
  static const Color textDark = lightText;
  static const Color textMuted = lightTextMuted;

  // Curated Design System Tokens
  static const Color canvasBaseLight = lightBackground;
  static const Color canvasBaseDark = darkBackground;
  static const Color surfaceCardLight = lightSurface;
  static const Color surfaceCardDark = darkSurface;
  static const Color surfaceElevatedLight = lightSurfaceElevated;
  static const Color surfaceElevatedDark = darkSurfaceElevated;
  static const Color hairlineBorderLight = lightBorder;
  static const Color hairlineBorderDark = darkBorder;
  static const Color textDisplayLight = lightText;
  static const Color textDisplayDark = darkText;
  static const Color textBodyLight = Color(0xFF1F2937);
  static const Color textBodyDark = Color(0xFFCBD5E1);
  static const Color textMutedLight = lightTextMuted;
  static const Color textMutedDark = darkTextMuted;

  static Color getSeverityColor(num score) {
    if (score <= 3.5) return severityLow;
    if (score <= 6.5) return severityMedium;
    if (score <= 8.5) return severityHigh;
    return severityCritical;
  }

  static String getSeverityLabel(num score) {
    if (score <= 3.5) return 'LOW';
    if (score <= 6.5) return 'MEDIUM';
    if (score <= 8.5) return 'HIGH';
    return 'CRITICAL';
  }

  // --- Light ThemeData ---
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      fontFamily: GoogleFonts.comfortaa().fontFamily,
      textTheme: GoogleFonts.comfortaaTextTheme(
        ThemeData.light().textTheme.apply(
          bodyColor: lightText,
          displayColor: lightText,
        ),
      ),
      scaffoldBackgroundColor: lightBackground,
      colorScheme: const ColorScheme.light(
        primary: primaryBlue,
        secondary: secondaryTeal,
        surface: lightSurface,
        onSurface: lightText,
        outline: lightBorder,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: lightSurface,
        foregroundColor: lightText,
        elevation: 0,
        scrolledUnderElevation: 1,
        centerTitle: false,
        titleTextStyle: TextStyle(
          color: lightText,
          fontSize: 18,
          fontWeight: FontWeight.w700,
          letterSpacing: -0.3,
        ),
      ),
      cardTheme: CardThemeData(
        color: lightSurface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: lightBorder, width: 1),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: lightSurface,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: lightBorder),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: lightBorder),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: primaryBlue, width: 2),
        ),
        labelStyle: const TextStyle(color: lightTextMuted, fontSize: 14),
        hintStyle: const TextStyle(color: lightTextMuted, fontSize: 14),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryBlue,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
            letterSpacing: 0.3,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: lightText,
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          side: const BorderSide(color: lightBorder),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      ),
      dividerTheme: const DividerThemeData(
        color: lightBorder,
        thickness: 1,
      ),
    );
  }

  // --- Dark ThemeData ---
  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      fontFamily: GoogleFonts.comfortaa().fontFamily,
      textTheme: GoogleFonts.comfortaaTextTheme(
        ThemeData.dark().textTheme.apply(
          bodyColor: darkText,
          displayColor: darkText,
        ),
      ),
      scaffoldBackgroundColor: darkBackground,
      colorScheme: const ColorScheme.dark(
        primary: accentBlue,
        secondary: secondaryTealDark,
        surface: darkSurface,
        onSurface: darkText,
        outline: darkBorder,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: darkSurface,
        foregroundColor: darkText,
        elevation: 0,
        scrolledUnderElevation: 1,
        centerTitle: false,
        titleTextStyle: TextStyle(
          color: darkText,
          fontSize: 18,
          fontWeight: FontWeight.w700,
          letterSpacing: -0.3,
        ),
      ),
      cardTheme: CardThemeData(
        color: darkSurface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: darkBorder, width: 1),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: darkSurfaceElevated,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: darkBorder),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: darkBorder),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: accentBlue, width: 2),
        ),
        labelStyle: const TextStyle(color: darkTextMuted, fontSize: 14),
        hintStyle: const TextStyle(color: darkTextMuted, fontSize: 14),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: accentBlue,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
            letterSpacing: 0.3,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: darkText,
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          side: const BorderSide(color: darkBorder),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      ),
      dividerTheme: const DividerThemeData(
        color: darkBorder,
        thickness: 1,
      ),
    );
  }
}
