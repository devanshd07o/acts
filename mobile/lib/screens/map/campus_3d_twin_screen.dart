import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:webview_windows/webview_windows.dart';
import '../../config/app_routes.dart';
import '../../services/auth_service.dart';

class Campus3DTwinScreen extends StatefulWidget {
  final VoidCallback? onBackToHome;

  const Campus3DTwinScreen({super.key, this.onBackToHome});

  @override
  State<Campus3DTwinScreen> createState() => _Campus3DTwinScreenState();
}

class _Campus3DTwinScreenState extends State<Campus3DTwinScreen> {
  final WebviewController _webviewController = WebviewController();
  final FocusNode _focusNode = FocusNode();
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

  void _handleBack(BuildContext context) {
    if (widget.onBackToHome != null) {
      widget.onBackToHome!();
      return;
    }

    if (Navigator.canPop(context)) {
      Navigator.pop(context);
      return;
    }

    // Fallback if route was replaced
    final isAdmin = AuthService().isAdmin;
    Navigator.pushReplacementNamed(
      context,
      isAdmin ? AppRoutes.adminTickets : AppRoutes.home,
    );
  }

  @override
  void dispose() {
    _focusNode.dispose();
    if (_isWebviewInitialized) {
      _webviewController.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (!didPop) {
          _handleBack(context);
        }
      },
      child: KeyboardListener(
        focusNode: _focusNode,
        autofocus: true,
        onKeyEvent: (event) {
          if (event is KeyDownEvent &&
              event.logicalKey == LogicalKeyboardKey.escape) {
            _handleBack(context);
          }
        },
        child: Scaffold(
          backgroundColor: isDark ? const Color(0xFF070A11) : const Color(0xFFF1F5F9),
          body: SafeArea(
            child: Column(
              children: [
                // 1. Crystal-Clear Top Control Bar (NEVER occluded by Win32 Webview)
                _buildTopHeader(context, isDark),

                // 2. High-Performance 3D Canvas (Webview stays strictly in this area)
                Expanded(
                  child: _build3DViewport(isDark),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTopHeader(BuildContext context, bool isDark) {
    return Container(
      height: 54,
      padding: const EdgeInsets.symmetric(horizontal: 14),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF0B0F19) : Colors.white,
        border: Border(
          bottom: BorderSide(
            color: isDark ? const Color(0xFF1E293B) : const Color(0xFFE2E8F0),
            width: 1.0,
          ),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.3 : 0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          // RETURN BUTTON (Direct, high-contrast, guaranteed clickable)
          InkWell(
            onTap: () => _handleBack(context),
            borderRadius: BorderRadius.circular(12),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
              decoration: BoxDecoration(
                color: const Color(0xFF2563EB).withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: const Color(0xFF2563EB).withValues(alpha: 0.4),
                  width: 1.2,
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.arrow_back_rounded, size: 16, color: Color(0xFF38BDF8)),
                  const SizedBox(width: 8),
                  Text(
                    "Return to App",
                    style: GoogleFonts.comfortaa(
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                      color: isDark ? Colors.white : const Color(0xFF0F172A),
                    ),
                  ),
                  const SizedBox(width: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF1E293B) : const Color(0xFFE2E8F0),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      "Esc",
                      style: GoogleFonts.comfortaa(
                        fontSize: 9.5,
                        fontWeight: FontWeight.w700,
                        color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF475569),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // SCENE TITLE & STATUS PILL
          Row(
            children: [
              Container(
                width: 8,
                height: 8,
                decoration: const BoxDecoration(
                  color: Color(0xFF10B981),
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 8),
              Text(
                "ABESEC 3D Digital Twin",
                style: GoogleFonts.comfortaa(
                  fontSize: 13,
                  fontWeight: FontWeight.w800,
                  color: isDark ? Colors.white : const Color(0xFF0F172A),
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                decoration: BoxDecoration(
                  color: const Color(0xFF10B981).withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  "60 FPS LIVE",
                  style: GoogleFonts.comfortaa(
                    fontSize: 9.5,
                    fontWeight: FontWeight.w800,
                    color: const Color(0xFF10B981),
                  ),
                ),
              ),
            ],
          ),

          // ACTION BUTTONS (Reload & External Studio Window)
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              IconButton(
                tooltip: "Reload 3D Scene",
                onPressed: () {
                  if (_isWebviewInitialized) {
                    _webviewController.reload();
                  }
                },
                icon: const Icon(Icons.refresh_rounded, size: 18),
                style: IconButton.styleFrom(
                  backgroundColor: isDark ? const Color(0xFF141A26) : const Color(0xFFF1F5F9),
                  foregroundColor: isDark ? Colors.white70 : const Color(0xFF475569),
                ),
              ),
              const SizedBox(width: 6),
              IconButton(
                tooltip: "Open Studio in Browser",
                onPressed: _launchExternalTwin,
                icon: const Icon(Icons.open_in_new_rounded, size: 18),
                style: IconButton.styleFrom(
                  backgroundColor: isDark ? const Color(0xFF141A26) : const Color(0xFFF1F5F9),
                  foregroundColor: const Color(0xFF38BDF8),
                ),
              ),
            ],
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
              child: CircularProgressIndicator(color: Color(0xFF38BDF8), strokeWidth: 3),
            ),
            const SizedBox(height: 16),
            Text(
              "Streaming Three.js Campus Digital Twin...",
              style: GoogleFonts.comfortaa(
                fontSize: 13,
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

    // Fallback UI if Webview is inactive or on non-windows platform
    return Center(
      child: Container(
        constraints: const BoxConstraints(maxWidth: 480),
        padding: const EdgeInsets.all(28),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF111827) : Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(
            color: isDark ? const Color(0xFF1F2937) : const Color(0xFFE2E8F0),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.15),
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
                color: const Color(0xFF38BDF8).withValues(alpha: 0.12),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.view_in_ar_rounded, color: Color(0xFF38BDF8), size: 30),
            ),
            const SizedBox(height: 16),
            Text(
              "ABESEC 3D Digital Twin",
              style: GoogleFonts.comfortaa(
                fontSize: 16,
                fontWeight: FontWeight.w900,
                color: isDark ? Colors.white : const Color(0xFF0F172A),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              "High-fidelity Three.js Campus Scene running live on http://127.0.0.1:5173/ with Bhabha, Aryabhata colonnades, entrance arch & incident radar rings.",
              textAlign: TextAlign.center,
              style: GoogleFonts.comfortaa(
                fontSize: 12,
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
                backgroundColor: const Color(0xFF2563EB),
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
}
