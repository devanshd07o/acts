import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // --- Institutional ABESEC Brand Tokens ---
  static const Color abesNavy = Color(0xFF0F2744);          // Institutional Deep Navy
  static const Color abesNavyLight = Color(0xFF1E3A8A);     // Royal Academic Navy
  static const Color abesCrimson = Color(0xFF991B1B);       // ABES Institutional Crimson
  static const Color abesBurgundy = Color(0xFF881337);      // Academic Velvet Burgundy
  static const Color abesGold = Color(0xFFD97706);          // ABES Institutional Gold / Ochre
  
  // --- Curated 2026 Interactive Tokens (Anti-Slop Sovereign Standard) ---
  static const Color brandSapphire = Color(0xFF1D4ED8);     // Deep Sapphire Interactive
  static const Color primaryBlue = Color(0xFF2563EB);       // Primary Interactive Blue
  static const Color accentBlue = Color(0xFF3B82F6);        // Active Focus Blue
  static const Color secondaryTeal = Color(0xFF0F766E);     // Deep Technical Teal
  static const Color secondaryTealDark = Color(0xFF14B8A6); // Triage Luminescent Accent
  
  // --- Muted Operational Signals (Tactical & Non-Clownish) ---
  static const Color signalVermilion = Color(0xFFDC2626);   // Critical / High-Voltage / Structural Alert
  static const Color signalAmber = Color(0xFFB45309);       // Warm Ochre (Needs Triage / Queued)
  static const Color signalCobalt = Color(0xFF0284C7);      // Tactical Slate Cobalt (Crew Dispatched)
  static const Color signalEmerald = Color(0xFF059669);     // Verified Lustrous Emerald (Resolved Proof)

  // --- Light Theme Tokens (Warm Ceramic Studio Canvas) ---
  static const Color lightBackground = Color(0xFFF6F7F9);   // Warm Ceramic Canvas
  static const Color lightSurface = Color(0xFFFFFFFF);      // Pure Crisp Surface Card
  static const Color lightSurfaceElevated = Color(0xFFF0F2F5); // Soft Titanium Pill
  static const Color lightBorder = Color(0xFFE2E8F0);       // Hairline 1px Structural Divider
  static const Color lightBorderStrong = Color(0xFFCBD5E1); // Defined 1px Interactive Border
  static const Color lightText = Color(0xFF0A0D14);         // Near-Black Display Text
  static const Color lightTextSecondary = Color(0xFF334155); // Rich Charcoal Subheading
  static const Color lightTextMuted = Color(0xFF64748B);    // Neutral Slate Metadata

  // --- Dark Theme Tokens (Deep Obsidian Studio Finish) ---
  static const Color darkBackground = Color(0xFF070A0F);    // Deep Obsidian Tactical Canvas
  static const Color darkSurface = Color(0xFF111622);       // Midnight Obsidian Card Surface
  static const Color darkSurfaceElevated = Color(0xFF1A2233); // Slate Elevation Surface
  static const Color darkBorder = Color(0xFF1F293D);        // Crisp 1px Hairline Structural Divider
  static const Color darkBorderStrong = Color(0xFF334155);  // Defined 1px Interactive Border
  static const Color darkText = Color(0xFFF8FAFC);          // Pure Titanium White Display Text
  static const Color darkTextSecondary = Color(0xFFCBD5E1); // Silver Slate Subheading
  static const Color darkTextMuted = Color(0xFF8A94A6);     // Atmospheric Muted Metadata
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

  // Helper for Tabular Figures (Typography precision for scores, counts, timers)
  static TextStyle tabular([TextStyle? base]) {
    return (base ?? const TextStyle()).copyWith(
      fontFeatures: const [FontFeature.tabularFigures()],
    );
  }

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
    final baseTextTheme = GoogleFonts.plusJakartaSansTextTheme(ThemeData.light().textTheme);
    
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      fontFamily: GoogleFonts.plusJakartaSans().fontFamily,
      textTheme: baseTextTheme.copyWith(
        displayLarge: baseTextTheme.displayLarge?.copyWith(
          color: lightText,
          fontSize: 32,
          fontWeight: FontWeight.w800,
          height: 1.15,
          letterSpacing: -0.8,
        ),
        displayMedium: baseTextTheme.displayMedium?.copyWith(
          color: lightText,
          fontSize: 24,
          fontWeight: FontWeight.w700,
          height: 1.2,
          letterSpacing: -0.5,
        ),
        titleLarge: baseTextTheme.titleLarge?.copyWith(
          color: lightText,
          fontSize: 18,
          fontWeight: FontWeight.w700,
          height: 1.25,
          letterSpacing: -0.3,
        ),
        titleMedium: baseTextTheme.titleMedium?.copyWith(
          color: lightText,
          fontSize: 15,
          fontWeight: FontWeight.w600,
          height: 1.3,
        ),
        bodyLarge: baseTextTheme.bodyLarge?.copyWith(
          color: textBodyLight,
          fontSize: 15,
          fontWeight: FontWeight.w400,
          height: 1.5,
        ),
        bodyMedium: baseTextTheme.bodyMedium?.copyWith(
          color: textBodyLight,
          fontSize: 13.5,
          fontWeight: FontWeight.w400,
          height: 1.45,
        ),
        labelLarge: baseTextTheme.labelLarge?.copyWith(
          fontSize: 13,
          fontWeight: FontWeight.w600,
          height: 1.2,
        ),
      ),
      scaffoldBackgroundColor: lightBackground,
      colorScheme: const ColorScheme.light(
        primary: abesNavyLight,
        secondary: abesGold,
        tertiary: abesCrimson,
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
          fontWeight: FontWeight.w800,
          height: 1.2,
          letterSpacing: -0.3,
        ),
      ),
      cardTheme: CardThemeData(
        color: lightSurface,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: lightBorder, width: 1.0),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: lightSurface,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: lightBorder, width: 1.0),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: lightBorder, width: 1.0),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: primaryBlue, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: signalVermilion, width: 1.0),
        ),
        labelStyle: const TextStyle(color: lightTextMuted, fontSize: 14, height: 1.3),
        hintStyle: const TextStyle(color: lightTextMuted, fontSize: 14, height: 1.3),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryBlue,
          foregroundColor: Colors.white,
          elevation: 0,
          minimumSize: const Size(44, 48),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w700,
            height: 1.2,
            letterSpacing: 0.2,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: lightText,
          minimumSize: const Size(44, 48),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          side: const BorderSide(color: lightBorder, width: 1.0),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            height: 1.2,
          ),
        ),
      ),
      dividerTheme: const DividerThemeData(
        color: lightBorder,
        thickness: 1.0,
        space: 1.0,
      ),
    );
  }

  // --- Dark ThemeData ---
  static ThemeData get darkTheme {
    final baseTextTheme = GoogleFonts.plusJakartaSansTextTheme(ThemeData.dark().textTheme);
    
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      fontFamily: GoogleFonts.plusJakartaSans().fontFamily,
      textTheme: baseTextTheme.copyWith(
        displayLarge: baseTextTheme.displayLarge?.copyWith(
          color: darkText,
          fontSize: 32,
          fontWeight: FontWeight.w800,
          height: 1.15,
          letterSpacing: -0.8,
        ),
        displayMedium: baseTextTheme.displayMedium?.copyWith(
          color: darkText,
          fontSize: 24,
          fontWeight: FontWeight.w700,
          height: 1.2,
          letterSpacing: -0.5,
        ),
        titleLarge: baseTextTheme.titleLarge?.copyWith(
          color: darkText,
          fontSize: 18,
          fontWeight: FontWeight.w700,
          height: 1.25,
          letterSpacing: -0.3,
        ),
        titleMedium: baseTextTheme.titleMedium?.copyWith(
          color: darkText,
          fontSize: 15,
          fontWeight: FontWeight.w600,
          height: 1.3,
        ),
        bodyLarge: baseTextTheme.bodyLarge?.copyWith(
          color: textBodyDark,
          fontSize: 15,
          fontWeight: FontWeight.w400,
          height: 1.5,
        ),
        bodyMedium: baseTextTheme.bodyMedium?.copyWith(
          color: textBodyDark,
          fontSize: 13.5,
          fontWeight: FontWeight.w400,
          height: 1.45,
        ),
        labelLarge: baseTextTheme.labelLarge?.copyWith(
          fontSize: 13,
          fontWeight: FontWeight.w600,
          height: 1.2,
        ),
      ),
      scaffoldBackgroundColor: darkBackground,
      colorScheme: const ColorScheme.dark(
        primary: accentBlue,
        secondary: abesGold,
        tertiary: abesCrimson,
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
          fontWeight: FontWeight.w800,
          height: 1.2,
          letterSpacing: -0.3,
        ),
      ),
      cardTheme: CardThemeData(
        color: darkSurface,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: darkBorder, width: 1.0),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: darkSurfaceElevated,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: darkBorder, width: 1.0),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: darkBorder, width: 1.0),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: accentBlue, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: signalVermilion, width: 1.0),
        ),
        labelStyle: const TextStyle(color: darkTextMuted, fontSize: 14, height: 1.3),
        hintStyle: const TextStyle(color: darkTextMuted, fontSize: 14, height: 1.3),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: accentBlue,
          foregroundColor: Colors.white,
          elevation: 0,
          minimumSize: const Size(44, 48),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w700,
            height: 1.2,
            letterSpacing: 0.2,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: darkText,
          minimumSize: const Size(44, 48),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          side: const BorderSide(color: darkBorder, width: 1.0),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            height: 1.2,
          ),
        ),
      ),
      dividerTheme: const DividerThemeData(
        color: darkBorder,
        thickness: 1.0,
        space: 1.0,
      ),
    );
  }
}
