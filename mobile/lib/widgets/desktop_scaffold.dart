import 'package:flutter/material.dart';
import '../config/theme.dart';
import '../config/app_routes.dart';
import '../services/auth_service.dart';
import '../services/theme_service.dart';
import 'right_auxiliary_panel.dart';

class DesktopScaffold extends StatefulWidget {
  final Widget body;
  final String title;
  final String currentRoute;
  final List<Widget>? actions;
  final Widget? floatingActionButton;

  // Persists sidebar states across route switches
  static final ValueNotifier<bool> isSidebarExpanded = ValueNotifier<bool>(true);
  static final ValueNotifier<bool> isRightPanelExpanded = ValueNotifier<bool>(false);

  const DesktopScaffold({
    super.key,
    required this.body,
    required this.title,
    required this.currentRoute,
    this.actions,
    this.floatingActionButton,
  });

  @override
  State<DesktopScaffold> createState() => _DesktopScaffoldState();
}

class _DesktopScaffoldState extends State<DesktopScaffold> {
  @override
  void initState() {
    super.initState();
    DesktopScaffold.isSidebarExpanded.value = true;
  }

  @override
  Widget build(BuildContext context) {
    final isDesktop = MediaQuery.of(context).size.width >= 800;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final auth = AuthService();
    final isAdmin = auth.isAdmin;

    if (!isDesktop) {
      // Mobile Layout: Top AppBar + BottomNavigationBar
      return Scaffold(
        appBar: AppBar(
          title: Text(
            widget.title,
            style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 18),
          ),
          actions: [
            IconButton(
              icon: Icon(
                isDark ? Icons.light_mode_rounded : Icons.dark_mode_rounded,
                size: 20,
                color: isDark ? const Color(0xFFFBBF24) : AppTheme.lightTextMuted,
              ),
              tooltip: isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme',
              onPressed: () => ThemeService().toggleTheme(context),
            ),
            ...?widget.actions,
            IconButton(
              icon: const Icon(Icons.logout_rounded, size: 20),
              tooltip: 'Logout',
              onPressed: () => _handleLogout(context),
            ),
          ],
        ),
        body: widget.body,
        bottomNavigationBar: BottomNavigationBar(
          type: BottomNavigationBarType.fixed,
          currentIndex: _getNavIndex(widget.currentRoute, isAdmin),
          selectedItemColor: isAdmin ? const Color(0xFFF59E0B) : const Color(0xFF2563EB),
          unselectedItemColor: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
          backgroundColor: isDark ? const Color(0xFF0F172A) : Colors.white,
          selectedFontSize: 11,
          unselectedFontSize: 11,
          onTap: (index) => _onNavTapped(context, index, isAdmin),
          items: isAdmin
              ? const [
                  BottomNavigationBarItem(
                    icon: Icon(Icons.inbox_outlined),
                    label: 'Triage Queue',
                  ),
                  BottomNavigationBarItem(
                    icon: Icon(Icons.map_outlined),
                    label: 'Tactical Map',
                  ),
                  BottomNavigationBarItem(
                    icon: Icon(Icons.view_in_ar_rounded),
                    label: '3D Twin',
                  ),
                  BottomNavigationBarItem(
                    icon: Icon(Icons.analytics_outlined),
                    label: 'Analytics',
                  ),
                ]
              : const [
                  BottomNavigationBarItem(
                    icon: Icon(Icons.home_rounded),
                    label: 'Home',
                  ),
                  BottomNavigationBarItem(
                    icon: Icon(Icons.add_circle_outline_rounded),
                    label: 'Report',
                  ),
                  BottomNavigationBarItem(
                    icon: Icon(Icons.assignment_outlined),
                    label: 'My Reports',
                  ),
                  BottomNavigationBarItem(
                    icon: Icon(Icons.view_in_ar_rounded),
                    label: '3D Twin',
                  ),
                ],
        ),
        floatingActionButton: widget.floatingActionButton,
      );
    }

    // Desktop Layout: Clean 3-Column Architecture
    return ValueListenableBuilder<bool>(
      valueListenable: DesktopScaffold.isSidebarExpanded,
      builder: (context, isLeftExpanded, _) {
        return ValueListenableBuilder<bool>(
          valueListenable: DesktopScaffold.isRightPanelExpanded,
          builder: (context, isRightExpanded, _) {
            // In Light Mode, Left Sidebar is pure clean white with soft subtle border
            final sidebarBg = isDark ? const Color(0xFF0B0F19) : Colors.white;
            final sidebarBorder = isDark ? const Color(0xFF1E293B) : const Color(0xFFE2E8F0);
            final headerBg = isDark ? const Color(0xFF0F172A) : Colors.white;
            final headerBorder = isDark ? const Color(0xFF1E293B) : const Color(0xFFE2E8F0);
            final headerTextColor = isDark ? Colors.white : const Color(0xFF0F172A);

            return Scaffold(
              backgroundColor: isDark ? const Color(0xFF07090E) : const Color(0xFFF8FAFC),
              body: Row(
                children: [
                  // 1. Expandable Left Sidebar (Nav & Profile)
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 220),
                    curve: Curves.easeInOutCubic,
                    width: isLeftExpanded ? 260 : 76,
                    decoration: BoxDecoration(
                      color: sidebarBg,
                      border: Border(right: BorderSide(color: sidebarBorder, width: 1)),
                      boxShadow: [
                        if (!isDark)
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.02),
                            blurRadius: 10,
                            offset: const Offset(2, 0),
                          ),
                      ],
                    ),
                    child: ClipRect(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          // Branding Header
                          _buildSidebarHeader(isLeftExpanded, isDark),

                          Divider(color: sidebarBorder, height: 1),
                          const SizedBox(height: 16),

                          // Nav Items (Rounded Pill Style)
                          Expanded(
                            child: ListView(
                              padding: EdgeInsets.symmetric(horizontal: isLeftExpanded ? 14 : 10),
                              children: isAdmin
                                  ? _buildAdminNavItems(context, isLeftExpanded, isDark)
                                  : _buildCitizenNavItems(context, isLeftExpanded, isDark),
                            ),
                          ),

                          Divider(color: sidebarBorder, height: 1),

                          // User Profile & Logout Box
                          _buildSidebarFooter(context, auth, isAdmin, isLeftExpanded, isDark),
                        ],
                      ),
                    ),
                  ),

                  // 2. Main Expansive Center Canvas
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // Desktop Top Navigation Header
                        Container(
                          height: 64,
                          padding: const EdgeInsets.symmetric(horizontal: 24),
                          decoration: BoxDecoration(
                            color: headerBg,
                            border: Border(bottom: BorderSide(color: headerBorder, width: 1)),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Row(
                                children: [
                                  IconButton(
                                    icon: Icon(
                                      isLeftExpanded ? Icons.menu_open_rounded : Icons.menu_rounded,
                                      color: headerTextColor,
                                      size: 22,
                                    ),
                                    tooltip: isLeftExpanded ? 'Collapse Sidebar' : 'Expand Sidebar',
                                    onPressed: () {
                                      DesktopScaffold.isSidebarExpanded.value = !isLeftExpanded;
                                    },
                                  ),
                                  const SizedBox(width: 10),
                                  Text(
                                    widget.title,
                                    style: TextStyle(
                                      fontSize: 19,
                                      fontWeight: FontWeight.w900,
                                      color: headerTextColor,
                                      letterSpacing: -0.4,
                                    ),
                                  ),
                                ],
                              ),

                              // Header Controls Group
                              Row(
                                children: [
                                  // Engine Status Indicator
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF10B981).withValues(alpha: isDark ? 0.15 : 0.1),
                                      borderRadius: BorderRadius.circular(20),
                                      border: Border.all(
                                        color: const Color(0xFF10B981).withValues(alpha: 0.3),
                                        width: 1,
                                      ),
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Container(
                                          width: 7,
                                          height: 7,
                                          decoration: const BoxDecoration(
                                            color: Color(0xFF10B981),
                                            shape: BoxShape.circle,
                                          ),
                                        ),
                                        const SizedBox(width: 8),
                                        const Text(
                                          'Campus Engine Online',
                                          style: TextStyle(
                                            color: Color(0xFF10B981),
                                            fontSize: 11.5,
                                            fontWeight: FontWeight.w800,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(width: 12),

                                  // Theme Toggle
                                  IconButton(
                                    icon: Icon(
                                      isDark ? Icons.light_mode_rounded : Icons.dark_mode_rounded,
                                      size: 20,
                                      color: isDark ? const Color(0xFFFBBF24) : const Color(0xFF64748B),
                                    ),
                                    tooltip: isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme',
                                    onPressed: () => ThemeService().toggleTheme(context),
                                  ),

                                  ...?widget.actions,

                                  const SizedBox(width: 4),

                                  // Toggle Auxiliary Right Panel
                                  IconButton(
                                    icon: Icon(
                                      isRightExpanded ? Icons.view_sidebar_rounded : Icons.view_sidebar_outlined,
                                      color: isRightExpanded ? const Color(0xFF2563EB) : const Color(0xFF64748B),
                                      size: 20,
                                    ),
                                    tooltip: isRightExpanded ? 'Hide Auxiliary Panel' : 'Show Auxiliary Panel',
                                    onPressed: () {
                                      DesktopScaffold.isRightPanelExpanded.value = !isRightExpanded;
                                    },
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),

                        // Main Scrollable / Viewport Canvas
                        Expanded(
                          child: widget.body,
                        ),
                      ],
                    ),
                  ),

                  // 3. Right Auxiliary Panel (Contextual Telemetry & Feeds)
                  RightAuxiliaryPanel(
                    isExpanded: isRightExpanded,
                    onToggle: () {
                      DesktopScaffold.isRightPanelExpanded.value = !isRightExpanded;
                    },
                    isAdmin: isAdmin,
                    currentRoute: widget.currentRoute,
                  ),
                ],
              ),
              floatingActionButton: widget.floatingActionButton,
            );
          },
        );
      },
    );
  }

  Widget _buildSidebarHeader(bool isExpanded, bool isDark) {
    if (!isExpanded) {
      return Container(
        height: 72,
        alignment: Alignment.center,
        child: Tooltip(
          message: 'Expand Sidebar (ACTS)',
          child: InkWell(
            borderRadius: BorderRadius.circular(12),
            onTap: () => DesktopScaffold.isSidebarExpanded.value = true,
            child: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF2563EB), Color(0xFF7C3AED)],
                ),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.shield_rounded, color: Colors.white, size: 22),
            ),
          ),
        ),
      );
    }

    return Container(
      height: 72,
      padding: const EdgeInsets.symmetric(horizontal: 18),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF2563EB), Color(0xFF7C3AED)],
              ),
              borderRadius: BorderRadius.circular(10),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF2563EB).withValues(alpha: 0.3),
                  blurRadius: 10,
                  offset: const Offset(0, 3),
                ),
              ],
            ),
            child: const Icon(Icons.shield_rounded, color: Colors.white, size: 22),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  'ACTS',
                  style: TextStyle(
                    color: isDark ? Colors.white : const Color(0xFF0F172A),
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1.1,
                  ),
                ),
                Text(
                  'Civic Triage Engine',
                  style: TextStyle(
                    color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                    fontSize: 10.5,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            icon: Icon(
              Icons.chevron_left_rounded,
              color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
              size: 20,
            ),
            tooltip: 'Collapse Sidebar',
            onPressed: () => DesktopScaffold.isSidebarExpanded.value = false,
          ),
        ],
      ),
    );
  }

  Widget _buildSidebarFooter(BuildContext context, AuthService auth, bool isAdmin, bool isExpanded, bool isDark) {
    final footerBg = isDark ? const Color(0xFF0A0E17) : const Color(0xFFF8FAFC);
    final textColor = isDark ? Colors.white : const Color(0xFF0F172A);

    if (!isExpanded) {
      return Container(
        padding: const EdgeInsets.symmetric(vertical: 14),
        color: footerBg,
        child: Column(
          children: [
            Tooltip(
              message: '${auth.username} (${isAdmin ? 'Admin' : 'Citizen'})',
              child: CircleAvatar(
                radius: 17,
                backgroundColor: const Color(0xFF2563EB),
                child: Text(
                  auth.username.isNotEmpty ? auth.username[0].toUpperCase() : 'U',
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 13),
                ),
              ),
            ),
            const SizedBox(height: 8),
            IconButton(
              icon: Icon(Icons.logout_rounded, color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B), size: 18),
              tooltip: 'Log Out',
              onPressed: () => _handleLogout(context),
            ),
          ],
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      color: footerBg,
      child: Row(
        children: [
          CircleAvatar(
            radius: 18,
            backgroundColor: const Color(0xFF2563EB),
            child: Text(
              auth.username.isNotEmpty ? auth.username[0].toUpperCase() : 'U',
              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 14),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  auth.username,
                  style: TextStyle(color: textColor, fontWeight: FontWeight.w800, fontSize: 13.5),
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: const Color(0xFF2563EB).withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    isAdmin ? 'OPERATIONS DESK' : 'ABESEC CITIZEN',
                    style: const TextStyle(
                      color: Color(0xFF2563EB),
                      fontSize: 8.5,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 0.4,
                    ),
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            icon: Icon(Icons.logout_rounded, color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B), size: 18),
            tooltip: 'Log Out',
            onPressed: () => _handleLogout(context),
          ),
        ],
      ),
    );
  }

  List<Widget> _buildCitizenNavItems(BuildContext context, bool isExpanded, bool isDark) {
    return [
      _navPillItem(
        context: context,
        icon: Icons.grid_view_rounded,
        label: 'Overview',
        route: AppRoutes.home,
        isActive: widget.currentRoute == AppRoutes.home,
        isExpanded: isExpanded,
        isDark: isDark,
      ),
      const SizedBox(height: 6),
      _navPillItem(
        context: context,
        icon: Icons.add_circle_outline_rounded,
        label: 'Report Issue',
        route: AppRoutes.reportIssue,
        isActive: widget.currentRoute == AppRoutes.reportIssue,
        isExpanded: isExpanded,
        isDark: isDark,
      ),
      const SizedBox(height: 6),
      _navPillItem(
        context: context,
        icon: Icons.map_outlined,
        label: 'Campus Map',
        route: AppRoutes.adminMap,
        isActive: widget.currentRoute == AppRoutes.adminMap,
        isExpanded: isExpanded,
        isDark: isDark,
      ),
      const SizedBox(height: 6),
      _navPillItem(
        context: context,
        icon: Icons.assignment_outlined,
        label: 'My Reports',
        route: AppRoutes.myReports,
        isActive: widget.currentRoute == AppRoutes.myReports,
        isExpanded: isExpanded,
        isDark: isDark,
      ),
      const SizedBox(height: 6),
      _navPillItem(
        context: context,
        icon: Icons.view_in_ar_rounded,
        label: 'Campus 3D Twin',
        route: AppRoutes.campus3DTwin,
        isActive: widget.currentRoute == AppRoutes.campus3DTwin,
        isExpanded: isExpanded,
        isDark: isDark,
      ),
    ];
  }

  List<Widget> _buildAdminNavItems(BuildContext context, bool isExpanded, bool isDark) {
    return [
      _navPillItem(
        context: context,
        icon: Icons.inbox_outlined,
        label: 'Triage Queue',
        route: AppRoutes.adminTickets,
        isActive: widget.currentRoute == AppRoutes.adminTickets,
        isExpanded: isExpanded,
        isDark: isDark,
      ),
      const SizedBox(height: 6),
      _navPillItem(
        context: context,
        icon: Icons.map_outlined,
        label: 'Tactical GIS Map',
        route: AppRoutes.adminMap,
        isActive: widget.currentRoute == AppRoutes.adminMap,
        isExpanded: isExpanded,
        isDark: isDark,
      ),
      const SizedBox(height: 6),
      _navPillItem(
        context: context,
        icon: Icons.view_in_ar_rounded,
        label: 'Campus 3D Twin',
        route: AppRoutes.campus3DTwin,
        isActive: widget.currentRoute == AppRoutes.campus3DTwin,
        isExpanded: isExpanded,
        isDark: isDark,
      ),
      const SizedBox(height: 6),
      _navPillItem(
        context: context,
        icon: Icons.analytics_outlined,
        label: 'Analytics & Health',
        route: AppRoutes.analytics,
        isActive: widget.currentRoute == AppRoutes.analytics,
        isExpanded: isExpanded,
        isDark: isDark,
      ),
      const SizedBox(height: 6),
      _navPillItem(
        context: context,
        icon: Icons.switch_account_outlined,
        label: 'Student View',
        route: AppRoutes.home,
        isActive: widget.currentRoute == AppRoutes.home,
        isExpanded: isExpanded,
        isDark: isDark,
      ),
    ];
  }

  // Rounded Pill Navigation Item (Modern Luxury Style)
  Widget _navPillItem({
    required BuildContext context,
    required IconData icon,
    required String label,
    required String route,
    required bool isActive,
    required bool isExpanded,
    required bool isDark,
  }) {
    Color bg;
    Color fg;

    if (isActive) {
      bg = const Color(0xFF2563EB);
      fg = Colors.white;
    } else {
      bg = Colors.transparent;
      fg = isDark ? const Color(0xFF94A3B8) : const Color(0xFF475569);
    }

    return Container(
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(16), // Rounded Pill shape
        boxShadow: isActive
            ? [
                BoxShadow(
                  color: const Color(0xFF2563EB).withValues(alpha: 0.35),
                  blurRadius: 10,
                  offset: const Offset(0, 3),
                ),
              ]
            : null,
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () {
            if (!isActive) {
              Navigator.pushReplacementNamed(context, route);
            }
          },
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: EdgeInsets.symmetric(
              horizontal: isExpanded ? 16 : 0,
              vertical: 13,
            ),
            child: isExpanded
                ? Row(
                    children: [
                      Icon(icon, color: fg, size: 20),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          label,
                          style: TextStyle(
                            color: fg,
                            fontWeight: isActive ? FontWeight.w800 : FontWeight.w600,
                            fontSize: 13.5,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  )
                : Center(child: Icon(icon, color: fg, size: 22)),
          ),
        ),
      ),
    );
  }

  void _onNavTapped(BuildContext context, int index, bool isAdmin) {
    if (isAdmin) {
      switch (index) {
        case 0:
          if (widget.currentRoute != AppRoutes.adminTickets) {
            Navigator.pushReplacementNamed(context, AppRoutes.adminTickets);
          }
          break;
        case 1:
          if (widget.currentRoute != AppRoutes.adminMap) {
            Navigator.pushReplacementNamed(context, AppRoutes.adminMap);
          }
          break;
        case 2:
          if (widget.currentRoute != AppRoutes.campus3DTwin) {
            Navigator.pushReplacementNamed(context, AppRoutes.campus3DTwin);
          }
          break;
        case 3:
          if (widget.currentRoute != AppRoutes.analytics) {
            Navigator.pushReplacementNamed(context, AppRoutes.analytics);
          }
          break;
      }
    } else {
      switch (index) {
        case 0:
          if (widget.currentRoute != AppRoutes.home) {
            Navigator.pushReplacementNamed(context, AppRoutes.home);
          }
          break;
        case 1:
          if (widget.currentRoute != AppRoutes.reportIssue) {
            Navigator.pushReplacementNamed(context, AppRoutes.reportIssue);
          }
          break;
        case 2:
          if (widget.currentRoute != AppRoutes.myReports) {
            Navigator.pushReplacementNamed(context, AppRoutes.myReports);
          }
          break;
        case 3:
          if (widget.currentRoute != AppRoutes.campus3DTwin) {
            Navigator.pushReplacementNamed(context, AppRoutes.campus3DTwin);
          }
          break;
      }
    }
  }

  int _getNavIndex(String route, bool isAdmin) {
    if (isAdmin) {
      if (route == AppRoutes.adminTickets) return 0;
      if (route == AppRoutes.adminMap) return 1;
      if (route == AppRoutes.campus3DTwin) return 2;
      if (route == AppRoutes.analytics) return 3;
      return 0;
    } else {
      if (route == AppRoutes.home) return 0;
      if (route == AppRoutes.reportIssue) return 1;
      if (route == AppRoutes.myReports) return 2;
      if (route == AppRoutes.campus3DTwin) return 3;
      return 0;
    }
  }

  Future<void> _handleLogout(BuildContext ctx) async {
    await AuthService().clearAuth();
    if (!mounted || !ctx.mounted) return;
    Navigator.pushReplacementNamed(ctx, AppRoutes.login);
  }
}
