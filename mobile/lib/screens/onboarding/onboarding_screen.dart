import 'package:flutter/material.dart';
import '../../config/app_routes.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  final List<OnboardingSlide> _slides = const [
    OnboardingSlide(
      tag: "AUTONOMOUS TRIAGE ENGINE",
      headline: "Zero Manual Delays.\nInstant Civic AI.",
      subhead:
          "Report broken infrastructure in natural language. Multimodal neural classifiers evaluate category, severity, and skill requirements in under 400 milliseconds.",
      badgeText: "⚡ 400ms Neural Triage",
      icon: Icons.auto_awesome_rounded,
      accentColor: Color(0xFF3B82F6),
      metricLabel: "TRIAGE LATENCY",
      metricValue: "0.38s",
    ),
    OnboardingSlide(
      tag: "CROWD-WEIGHTED INTELLIGENCE",
      headline: "When 10 Voice It,\nThe System Listens.",
      subhead:
          "Sub-60-meter spatial clustering automatically fuses duplicate reports into a single high-priority master ticket. Urgency scales dynamically with crowd consensus.",
      badgeText: "📍 Sub-60m Spatial Clustering",
      icon: Icons.hub_rounded,
      accentColor: Color(0xFF8B5CF6),
      metricLabel: "DUPLICATION CUT",
      metricValue: "92.4%",
    ),
    OnboardingSlide(
      tag: "SMART DISPATCH & TWO-WAY AUDIT",
      headline: "Nearest Crews Dispatched.\nVerified by You.",
      subhead:
          "Automated skill matching routes the closest available crew across campus. Tickets are only closed when the original reporter verifies the resolution.",
      badgeText: "🛡️ Two-Way Reporter Verification",
      icon: Icons.verified_user_rounded,
      accentColor: Color(0xFF10B981),
      metricLabel: "VERIFIED FIXES",
      metricValue: "99.1%",
    ),
  ];

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _onNext() {
    if (_currentPage < _slides.length - 1) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 400),
        curve: Curves.easeInOutCubic,
      );
    } else {
      _goToLogin();
    }
  }

  void _goToLogin() {
    Navigator.pushReplacementNamed(context, AppRoutes.login);
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final isDesktop = size.width >= 900;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final bgGradient = isDark
        ? const LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFF07090E), Color(0xFF0F172A), Color(0xFF05070B)],
          )
        : const LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFFF8FAFC), Color(0xFFEFF6FF), Color(0xFFF1F5F9)],
          );

    return Scaffold(
      body: Container(
        decoration: BoxDecoration(gradient: bgGradient),
        child: Stack(
          children: [
            // Ambient Radial Glow
            Positioned(
              top: -120,
              right: -100,
              child: Container(
                width: 480,
                height: 480,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [
                      _slides[_currentPage].accentColor.withValues(alpha: isDark ? 0.18 : 0.12),
                      Colors.transparent,
                    ],
                  ),
                ),
              ),
            ),
            Positioned(
              bottom: -150,
              left: -100,
              child: Container(
                width: 500,
                height: 500,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [
                      const Color(0xFF3B82F6).withValues(alpha: isDark ? 0.12 : 0.08),
                      Colors.transparent,
                    ],
                  ),
                ),
              ),
            ),

            // Top Header Bar
            SafeArea(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 18),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    // Brand Signature
                    Row(
                      children: [
                        Image.asset(
                          'assets/icons/acts_logo.png',
                          width: 40,
                          height: 40,
                          fit: BoxFit.contain,
                        ),
                        const SizedBox(width: 12),
                        Image.asset(
                          isDark
                              ? 'assets/images/acts_text_logo_dark.png'
                              : 'assets/images/acts_text_logo.png',
                          height: 30,
                          fit: BoxFit.contain,
                        ),
                      ],
                    ),

                    // Skip CTA
                    TextButton(
                      onPressed: _goToLogin,
                      style: TextButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(20),
                          side: BorderSide(
                            color: isDark ? Colors.white12 : Colors.black12,
                          ),
                        ),
                      ),
                      child: Text(
                        "Skip to Portal",
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: isDark ? Colors.white70 : const Color(0xFF334155),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Main Content Area
            Positioned.fill(
              top: 80,
              bottom: 100,
              child: PageView.builder(
                controller: _pageController,
                onPageChanged: (idx) => setState(() => _currentPage = idx),
                itemCount: _slides.length,
                itemBuilder: (context, index) {
                  final slide = _slides[index];
                  return Padding(
                    padding: EdgeInsets.symmetric(
                      horizontal: isDesktop ? size.width * 0.12 : 24,
                    ),
                    child: isDesktop
                        ? _buildDesktopSlide(slide, isDark)
                        : _buildMobileSlide(slide, isDark),
                  );
                },
              ),
            ),

            // Bottom Navigation Footer
            Positioned(
              left: 24,
              right: 24,
              bottom: 28,
              child: SafeArea(
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    // Dot Indicators
                    Row(
                      children: List.generate(
                        _slides.length,
                        (i) => AnimatedContainer(
                          duration: const Duration(milliseconds: 300),
                          margin: const EdgeInsets.only(right: 8),
                          width: _currentPage == i ? 32 : 8,
                          height: 8,
                          decoration: BoxDecoration(
                            color: _currentPage == i
                                ? _slides[_currentPage].accentColor
                                : (isDark ? Colors.white24 : Colors.black12),
                            borderRadius: BorderRadius.circular(4),
                          ),
                        ),
                      ),
                    ),

                    // Action Controls
                    Row(
                      children: [
                        if (_currentPage > 0)
                          Padding(
                            padding: const EdgeInsets.only(right: 12),
                            child: IconButton(
                              onPressed: () {
                                _pageController.previousPage(
                                  duration: const Duration(milliseconds: 350),
                                  curve: Curves.easeInOut,
                                );
                              },
                              icon: Icon(
                                Icons.arrow_back_rounded,
                                color: isDark ? Colors.white60 : Colors.black54,
                              ),
                            ),
                          ),

                        // Primary Next / Enter Button
                        ElevatedButton(
                          onPressed: _onNext,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: _slides[_currentPage].accentColor,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(
                              horizontal: 26,
                              vertical: 16,
                            ),
                            elevation: 8,
                            shadowColor: _slides[_currentPage]
                                .accentColor
                                .withValues(alpha: 0.5),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                            ),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                _currentPage == _slides.length - 1
                                    ? "Launch Portal"
                                    : "Continue",
                                style: const TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w700,
                                  letterSpacing: 0.3,
                                ),
                              ),
                              const SizedBox(width: 8),
                              const Icon(Icons.arrow_forward_rounded, size: 18),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDesktopSlide(OnboardingSlide slide, bool isDark) {
    return Row(
      children: [
        // Left Column: Typography & Story
        Expanded(
          flex: 6,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Badge
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                decoration: BoxDecoration(
                  color: slide.accentColor.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(30),
                  border: Border.all(
                    color: slide.accentColor.withValues(alpha: 0.3),
                  ),
                ),
                child: Text(
                  slide.tag,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 1.5,
                    color: slide.accentColor,
                  ),
                ),
              ),
              const SizedBox(height: 24),
              // Headline
              Text(
                slide.headline,
                style: TextStyle(
                  fontSize: 44,
                  height: 1.15,
                  fontWeight: FontWeight.w900,
                  letterSpacing: -1.2,
                  color: isDark ? Colors.white : const Color(0xFF0F172A),
                ),
              ),
              const SizedBox(height: 18),
              // Subhead
              ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 520),
                child: Text(
                  slide.subhead,
                  style: TextStyle(
                    fontSize: 16,
                    height: 1.6,
                    fontWeight: FontWeight.w400,
                    color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF475569),
                  ),
                ),
              ),
              const SizedBox(height: 36),
              // Telemetry KPI Pill
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF131B2E) : Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: isDark ? Colors.white10 : Colors.black12,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.05),
                      blurRadius: 20,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 10,
                      height: 10,
                      decoration: BoxDecoration(
                        color: slide.accentColor,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: slide.accentColor.withValues(alpha: 0.8),
                            blurRadius: 8,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Text(
                      slide.metricLabel,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 1.1,
                        color: isDark ? Colors.white54 : Colors.black54,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Text(
                      slide.metricValue,
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w900,
                        color: slide.accentColor,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),

        const SizedBox(width: 48),

        // Right Column: Interactive Hologram / Visual Artifact
        Expanded(
          flex: 5,
          child: Center(
            child: _buildVisualCard(slide, isDark, 380),
          ),
        ),
      ],
    );
  }

  Widget _buildMobileSlide(OnboardingSlide slide, bool isDark) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Center(child: _buildVisualCard(slide, isDark, 200)),
        const SizedBox(height: 28),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
          decoration: BoxDecoration(
            color: slide.accentColor.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(30),
            border: Border.all(
              color: slide.accentColor.withValues(alpha: 0.3),
            ),
          ),
          child: Text(
            slide.tag,
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w800,
              letterSpacing: 1.4,
              color: slide.accentColor,
            ),
          ),
        ),
        const SizedBox(height: 14),
        Text(
          slide.headline,
          style: TextStyle(
            fontSize: 28,
            height: 1.2,
            fontWeight: FontWeight.w900,
            letterSpacing: -0.8,
            color: isDark ? Colors.white : const Color(0xFF0F172A),
          ),
        ),
        const SizedBox(height: 12),
        Text(
          slide.subhead,
          style: TextStyle(
            fontSize: 14,
            height: 1.5,
            color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF475569),
          ),
        ),
      ],
    );
  }

  Widget _buildVisualCard(OnboardingSlide slide, bool isDark, double size) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF101726) : Colors.white,
        borderRadius: BorderRadius.circular(32),
        border: Border.all(
          color: isDark ? Colors.white.withValues(alpha: 0.08) : Colors.black.withValues(alpha: 0.08),
          width: 1.5,
        ),
        boxShadow: [
          BoxShadow(
            color: slide.accentColor.withValues(alpha: 0.15),
            blurRadius: 40,
            offset: const Offset(0, 16),
          ),
        ],
      ),
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Concentric Radar Rings
          Container(
            width: size * 0.75,
            height: size * 0.75,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(
                color: slide.accentColor.withValues(alpha: 0.12),
                width: 1,
              ),
            ),
          ),
          Container(
            width: size * 0.5,
            height: size * 0.5,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(
                color: slide.accentColor.withValues(alpha: 0.2),
                width: 1,
              ),
            ),
          ),
          // Central Glowing Icon Hub
          Container(
            width: size * 0.28,
            height: size * 0.28,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: RadialGradient(
                colors: [
                  slide.accentColor,
                  slide.accentColor.withValues(alpha: 0.6),
                ],
              ),
              boxShadow: [
                BoxShadow(
                  color: slide.accentColor.withValues(alpha: 0.6),
                  blurRadius: 28,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: Icon(slide.icon, color: Colors.white, size: size * 0.13),
          ),
        ],
      ),
    );
  }
}

class OnboardingSlide {
  final String tag;
  final String headline;
  final String subhead;
  final String badgeText;
  final IconData icon;
  final Color accentColor;
  final String metricLabel;
  final String metricValue;

  const OnboardingSlide({
    required this.tag,
    required this.headline,
    required this.subhead,
    required this.badgeText,
    required this.icon,
    required this.accentColor,
    required this.metricLabel,
    required this.metricValue,
  });
}
