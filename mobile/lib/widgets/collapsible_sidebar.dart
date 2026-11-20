import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../config/app_routes.dart';
import '../config/theme.dart';
import '../services/api_client.dart';
import '../services/auth_service.dart';

class CollapsibleSidebar extends StatefulWidget {
  final int activeIndex;
  final ValueChanged<int> onIndexSelected;

  const CollapsibleSidebar({
    super.key,
    required this.activeIndex,
    required this.onIndexSelected,
  });

  @override
  State<CollapsibleSidebar> createState() => _CollapsibleSidebarState();
}

class _CollapsibleSidebarState extends State<CollapsibleSidebar> {
  // Default: Collapsed (toggled ONLY via manual click button)
  bool _isExpanded = false;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return ListenableBuilder(
      listenable: AuthService(),
      builder: (context, _) {
        final auth = AuthService();
        final displayName = auth.fullName.isNotEmpty
            ? auth.fullName
            : (auth.username.isNotEmpty ? auth.username : 'User');
        final email = auth.email;
        final photoUrl = auth.photoUrl;

        return AnimatedContainer(
          duration: const Duration(milliseconds: 220),
          curve: Curves.easeInOutCubic,
          width: _isExpanded ? 256 : 72,
          margin: const EdgeInsets.fromLTRB(16, 12, 8, 16),
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
          decoration: BoxDecoration(
            color: isDark ? AppTheme.darkSurface : AppTheme.lightSurface,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: isDark ? AppTheme.darkBorder : AppTheme.lightBorder,
              width: 1.0,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: isDark ? 0.3 : 0.04),
                blurRadius: 16,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // 1. Top Header Row: Brand Icon + Manual Toggle (<< / >>)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4),
                child: Row(
                  mainAxisAlignment:
                      _isExpanded ? MainAxisAlignment.spaceBetween : MainAxisAlignment.center,
                  children: [
                    if (_isExpanded) ...[
                      Row(
                        children: [
                          Image.asset(
                            'assets/icons/acts_logo.png',
                            width: 28,
                            height: 28,
                            fit: BoxFit.contain,
                          ),
                          const SizedBox(width: 8),
                          Image.asset(
                            isDark
                                ? 'assets/images/acts_text_logo_dark.png'
                                : 'assets/images/acts_text_logo.png',
                            height: 20,
                            fit: BoxFit.contain,
                          ),
                        ],
                      ),
                    ],
                    SizedBox(
                      width: 44,
                      height: 44,
                      child: IconButton(
                        icon: Icon(
                          _isExpanded
                              ? Icons.keyboard_double_arrow_left_rounded
                              : Icons.keyboard_double_arrow_right_rounded,
                          size: 20,
                          color: isDark ? AppTheme.darkTextSecondary : AppTheme.lightTextSecondary,
                        ),
                        onPressed: () => setState(() => _isExpanded = !_isExpanded),
                        tooltip: _isExpanded ? "Collapse Sidebar" : "Expand Sidebar",
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 12),
              Divider(
                color: isDark ? AppTheme.darkBorder : AppTheme.lightBorder,
                height: 1,
              ),
              const SizedBox(height: 12),

              // 2. Navigation Items from Top:
              // Item 1: Home
              _buildNavItem(
                index: 0,
                icon: Icons.dashboard_outlined,
                activeIcon: Icons.dashboard_rounded,
                label: "Campus Radar",
                isDark: isDark,
              ),

              const SizedBox(height: 6),

              // Item 2: + New Query (Defect Dispatch)
              _buildNavItem(
                index: 1,
                icon: Icons.add_circle_outline_rounded,
                activeIcon: Icons.add_circle_rounded,
                label: "Report Defect",
                isSpecial: true,
                isDark: isDark,
              ),

              const SizedBox(height: 6),

              // Item 3: Current Active User Reports (My Reports)
              _buildNavItem(
                index: 4,
                icon: Icons.assignment_outlined,
                activeIcon: Icons.assignment_rounded,
                label: "Active Reports",
                isDark: isDark,
              ),

              const SizedBox(height: 6),

              // Item 4: 3D Campus Twin
              _buildNavItem(
                index: 2,
                icon: Icons.view_in_ar_outlined,
                activeIcon: Icons.view_in_ar_rounded,
                label: "3D Campus Twin",
                isDark: isDark,
              ),

              const SizedBox(height: 6),

              // Item 5: Incident Triage Feed
              _buildNavItem(
                index: 3,
                icon: Icons.ballot_outlined,
                activeIcon: Icons.ballot_rounded,
                label: "Incident Triage",
                isDark: isDark,
              ),

              const Spacer(),

              // 3. User Info (Name, Gmail, DP, Logout) at the BOTTOM
              Divider(
                color: isDark ? AppTheme.darkBorder : AppTheme.lightBorder,
                height: 1,
              ),
              const SizedBox(height: 12),

              _buildBottomUserSection(
                photoUrl: photoUrl,
                displayName: displayName,
                email: email,
                isDark: isDark,
              ),
            ],
          ),
        );
      },
    );
  }

  // --- NAVIGATION ITEM BUILDER ---
  Widget _buildNavItem({
    required int index,
    required IconData icon,
    required IconData activeIcon,
    required String label,
    required bool isDark,
    bool isSpecial = false,
    VoidCallback? onTapOverride,
  }) {
    final isSelected = widget.activeIndex == index && !isSpecial;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () {
          if (onTapOverride != null) {
            onTapOverride();
          } else {
            widget.onIndexSelected(index);
          }
        },
        borderRadius: BorderRadius.circular(12),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          constraints: const BoxConstraints(minHeight: 44),
          padding: EdgeInsets.symmetric(
            horizontal: _isExpanded ? 12 : 0,
            vertical: 10,
          ),
          decoration: BoxDecoration(
            color: isSpecial
                ? (isDark
                    ? AppTheme.abesNavyLight.withValues(alpha: 0.25)
                    : const Color(0xFFEFF6FF))
                : (isSelected
                    ? (isDark
                        ? AppTheme.primaryBlue.withValues(alpha: 0.16)
                        : const Color(0xFFF1F5F9))
                    : Colors.transparent),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isSpecial
                  ? (isDark ? AppTheme.accentBlue : AppTheme.primaryBlue).withValues(alpha: 0.4)
                  : (isSelected
                      ? (isDark ? AppTheme.accentBlue : AppTheme.primaryBlue).withValues(alpha: 0.35)
                      : Colors.transparent),
              width: 1.0,
            ),
          ),
          child: Row(
            mainAxisAlignment:
                _isExpanded ? MainAxisAlignment.start : MainAxisAlignment.center,
            children: [
              Icon(
                isSelected ? activeIcon : icon,
                size: 20,
                color: isSpecial
                    ? (isDark ? AppTheme.accentBlue : AppTheme.primaryBlue)
                    : (isSelected
                        ? (isDark ? AppTheme.accentBlue : AppTheme.primaryBlue)
                        : (isDark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted)),
              ),
              if (_isExpanded) ...[
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    label,
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 13,
                      fontWeight: isSelected || isSpecial ? FontWeight.w700 : FontWeight.w500,
                      height: 1.25,
                      color: isSpecial
                          ? (isDark ? AppTheme.darkText : AppTheme.abesNavy)
                          : (isSelected
                              ? (isDark ? AppTheme.darkText : AppTheme.abesNavy)
                              : (isDark ? AppTheme.darkTextSecondary : AppTheme.lightTextSecondary)),
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  // --- BOTTOM USER SECTION (PROFILE PIC, NAME, GMAIL, LOGOUT) ---
  Widget _buildBottomUserSection({
    required String? photoUrl,
    required String displayName,
    required String email,
    required bool isDark,
  }) {
    if (!_isExpanded) {
      // Collapsed: Compact Avatar & Logout Icon
      return Column(
        children: [
          Tooltip(
            message: "$displayName\n$email",
            child: _buildAvatar(
              radius: 18,
              photoUrl: photoUrl,
              name: displayName,
            ),
          ),
          const SizedBox(height: 6),
          SizedBox(
            width: 44,
            height: 44,
            child: IconButton(
              tooltip: "Logout",
              icon: Icon(
                Icons.logout_rounded,
                size: 18,
                color: isDark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted,
              ),
              onPressed: () => _handleLogout(context),
            ),
          ),
        ],
      );
    }

    // Expanded: Full Profile Card with Photo, Name, Gmail & Logout Button
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.darkSurfaceElevated : AppTheme.lightSurfaceElevated,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: isDark ? AppTheme.darkBorder : AppTheme.lightBorder,
          width: 1.0,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              _buildAvatar(
                radius: 18,
                photoUrl: photoUrl,
                name: displayName,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      displayName,
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 12.5,
                        fontWeight: FontWeight.w700,
                        height: 1.2,
                        color: isDark ? AppTheme.darkText : AppTheme.lightText,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      email,
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 10.5,
                        fontWeight: FontWeight.w500,
                        height: 1.2,
                        color: isDark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          InkWell(
            onTap: () => _handleLogout(context),
            borderRadius: BorderRadius.circular(8),
            child: Container(
              constraints: const BoxConstraints(minHeight: 36),
              padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 8),
              decoration: BoxDecoration(
                color: AppTheme.signalVermilion.withValues(alpha: isDark ? 0.12 : 0.08),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: AppTheme.signalVermilion.withValues(alpha: 0.25),
                  width: 1.0,
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(
                    Icons.logout_rounded,
                    size: 15,
                    color: AppTheme.signalVermilion,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    "Logout",
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 11.5,
                      fontWeight: FontWeight.w700,
                      height: 1.2,
                      color: AppTheme.signalVermilion,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAvatar({
    required double radius,
    required String? photoUrl,
    required String name,
  }) {
    final initial = name.trim().isNotEmpty ? name.trim()[0].toUpperCase() : 'U';
    final diameter = radius * 2;

    if (photoUrl != null && photoUrl.trim().isNotEmpty) {
      return Container(
        width: diameter,
        height: diameter,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          border: Border.all(color: AppTheme.primaryBlue, width: 1.5),
        ),
        child: ClipOval(
          child: Image.network(
            photoUrl,
            width: diameter,
            height: diameter,
            fit: BoxFit.cover,
            errorBuilder: (_, __, ___) => _buildInitialAvatar(diameter, initial),
          ),
        ),
      );
    }

    return _buildInitialAvatar(diameter, initial);
  }

  Widget _buildInitialAvatar(double diameter, String initial) {
    return Container(
      width: diameter,
      height: diameter,
      decoration: const BoxDecoration(
        shape: BoxShape.circle,
        color: AppTheme.abesNavyLight,
      ),
      alignment: Alignment.center,
      child: Text(
        initial,
        style: TextStyle(
          fontSize: diameter * 0.44,
          fontWeight: FontWeight.w800,
          color: Colors.white,
        ),
      ),
    );
  }

  Future<void> _handleLogout(BuildContext context) async {
    await ApiClient().logout();
    if (context.mounted) {
      Navigator.pushReplacementNamed(context, AppRoutes.login);
    }
  }
}
