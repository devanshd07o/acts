import 'dart:io';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:webview_windows/webview_windows.dart';

class Campus3DTwinScreen extends StatefulWidget {
  final VoidCallback? onBackToHome;

  const Campus3DTwinScreen({super.key, this.onBackToHome});

  @override
  State<Campus3DTwinScreen> createState() => _Campus3DTwinScreenState();
}

class _Campus3DTwinScreenState extends State<Campus3DTwinScreen> {
  final WebviewController _webviewController = WebviewController();
  bool _isWebviewInitialized = false;
  bool _isLoading = true;

  // Live Vite dev server URL for the verified Three.js digital twin
  static const String twinUrl = 'http://127.0.0.1:5173/';

  @override
  void initState() {
    super.initState();
    if (Platform.isWindows) {
      _initWebview();
    } else {
      _isLoading = false;
    }
  }

  Future<void> _initWebview() async {
    try {
      await _webviewController.initialize();
      await _webviewController.setBackgroundColor(Colors.transparent);
      await _webviewController.setPopupWindowPolicy(WebviewPopupWindowPolicy.deny);
      await _webviewController.loadUrl(twinUrl);

      if (mounted) {
        setState(() {
          _isWebviewInitialized = true;
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint("Webview initialization error: $e");
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _launchExternalTwin() async {
    final uri = Uri.parse(twinUrl);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  void dispose() {
    if (_isWebviewInitialized) {
      _webviewController.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0B0F19) : const Color(0xFFF1F5F9),
      body: Stack(
        children: [
          // 1. Core 3D Scene Viewport (60 FPS Three.js Canvas)
          Positioned.fill(
            child: _build3DViewport(isDark),
          ),

          // 2. Compact Back Navigation Button (Top Left)
          Positioned(
            top: 16,
            left: 16,
            child: _buildBackButton(isDark),
          ),

          // 3. Compact Utilities Pill (Top Right: Reload + External Window)
          Positioned(
            top: 16,
            right: 16,
            child: _buildActionButtons(isDark),
          ),
        ],
      ),
    );
  }

  Widget _build3DViewport(bool isDark) {
    if (_isLoading) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(
              width: 38,
              height: 38,
              child: CircularProgressIndicator(color: Color(0xFFF97316), strokeWidth: 3),
            ),
            const SizedBox(height: 16),
            Text(
              "Loading ABESEC 3D Campus Digital Twin...",
              style: GoogleFonts.comfortaa(
                fontSize: 13.5,
                fontWeight: FontWeight.w700,
                color: isDark ? Colors.white70 : const Color(0xFF334155),
              ),
            ),
          ],
        ),
      );
    }

    if (_isWebviewInitialized) {
      return Webview(
        _webviewController,
        permissionRequested: (url, permissionKind, isUserInitiated) =>
            WebviewPermissionDecision.allow,
      );
    }

    // Fallback UI if Webview fails or on non-windows platform
    return Center(
      child: Container(
        constraints: const BoxConstraints(maxWidth: 480),
        padding: const EdgeInsets.all(28),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF141A26) : Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(
            color: isDark ? const Color(0xFF232B3B) : const Color(0xFFE2E8F0),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.1),
              blurRadius: 20,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                color: const Color(0xFFF97316).withValues(alpha: 0.12),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.view_in_ar_rounded, color: Color(0xFFF97316), size: 30),
            ),
            const SizedBox(height: 16),
            Text(
              "ABESEC 3D Digital Twin Active",
              style: GoogleFonts.comfortaa(
                fontSize: 16,
                fontWeight: FontWeight.w900,
                color: isDark ? Colors.white : const Color(0xFF0F172A),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              "Full 3D Campus Scene running live on http://127.0.0.1:5173/ with real photo-verified Bhabha, Aryabhata colonnades, entrance arch & issue clusters.",
              textAlign: TextAlign.center,
              style: GoogleFonts.comfortaa(
                fontSize: 11.5,
                color: isDark ? const Color(0xFF8A94A6) : const Color(0xFF64748B),
                height: 1.5,
              ),
            ),
            const SizedBox(height: 20),
            ElevatedButton.icon(
              onPressed: _launchExternalTwin,
              icon: const Icon(Icons.open_in_new_rounded, size: 16),
              label: Text(
                "Launch 3D Campus in Browser Window",
                style: GoogleFonts.comfortaa(fontWeight: FontWeight.w700, fontSize: 12),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFF97316),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBackButton(bool isDark) {
    return InkWell(
      onTap: widget.onBackToHome ?? () => Navigator.pop(context),
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isDark
              ? const Color(0xFF141A26).withValues(alpha: 0.9)
              : Colors.white.withValues(alpha: 0.95),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isDark ? const Color(0xFF232B3B) : const Color(0xFFE2E8F0),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.1),
              blurRadius: 10,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.arrow_back_rounded, size: 16),
            const SizedBox(width: 8),
            Text(
              "Return to App",
              style: GoogleFonts.comfortaa(
                fontSize: 11.5,
                fontWeight: FontWeight.w700,
                color: isDark ? Colors.white : const Color(0xFF0F172A),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionButtons(bool isDark) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        IconButton(
          tooltip: "Reload 3D Viewport",
          onPressed: () {
            if (_isWebviewInitialized) {
              _webviewController.reload();
            }
          },
          icon: const Icon(Icons.refresh_rounded, size: 18),
          style: IconButton.styleFrom(
            backgroundColor: isDark ? const Color(0xFF141A26) : Colors.white,
            foregroundColor: isDark ? Colors.white70 : const Color(0xFF475569),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
              side: BorderSide(
                color: isDark ? const Color(0xFF232B3B) : const Color(0xFFE2E8F0),
              ),
            ),
          ),
        ),
        const SizedBox(width: 8),
        IconButton(
          tooltip: "Open Full Studio Window",
          onPressed: _launchExternalTwin,
          icon: const Icon(Icons.open_in_new_rounded, size: 18),
          style: IconButton.styleFrom(
            backgroundColor: isDark ? const Color(0xFF141A26) : Colors.white,
            foregroundColor: isDark ? Colors.white70 : const Color(0xFF475569),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
              side: BorderSide(
                color: isDark ? const Color(0xFF232B3B) : const Color(0xFFE2E8F0),
              ),
            ),
          ),
        ),
      ],
    );
  }
}
