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
  // Default: Collapsed (toggled ONLY via manual click button - NO auto hover)
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
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeInOutCubic,
          width: _isExpanded ? 248 : 68,
          margin: const EdgeInsets.fromLTRB(16, 12, 8, 16),
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 10),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF141A26) : Colors.white,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(
              color: isDark ? const Color(0xFF232B3B) : const Color(0xFFE2E8F0),
              width: 1.2,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: isDark ? 0.35 : 0.05),
                blurRadius: 18,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // 1. Top Header Row: Brand Icon + Manual Toggle (<< / >>)
              Row(
                mainAxisAlignment:
                    _isExpanded ? MainAxisAlignment.spaceBetween : MainAxisAlignment.center,
                children: [
                  if (_isExpanded) ...[
                    Row(
                      children: [
                        Image.asset(
                          'assets/icons/acts_logo.png',
                          width: 26,
                          height: 26,
                          fit: BoxFit.contain,
                        ),
                        const SizedBox(width: 8),
                        Image.asset(
                          isDark
                              ? 'assets/images/acts_text_logo_dark.png'
                              : 'assets/images/acts_text_logo.png',
                          height: 18,
                          fit: BoxFit.contain,
                        ),
                      ],
                    ),
                  ],
                  IconButton(
                    icon: Icon(
                      _isExpanded
                          ? Icons.keyboard_double_arrow_left_rounded
                          : Icons.keyboard_double_arrow_right_rounded,
                      size: 20,
                      color: isDark ? Colors.white70 : const Color(0xFF475569),
                    ),
                    onPressed: () => setState(() => _isExpanded = !_isExpanded),
                    tooltip: _isExpanded ? "Collapse Sidebar" : "Expand Sidebar",
                  ),
                ],
              ),

              const SizedBox(height: 12),
              Divider(
                color: isDark ? const Color(0xFF1E2638) : const Color(0xFFE5E7EB),
                height: 1,
              ),
              const SizedBox(height: 14),

              // 2. Navigation Items from Top:
              // Item 1: Home
              _buildNavItem(
                index: 0,
                icon: Icons.home_rounded,
                label: "Home",
                isDark: isDark,
              ),

              const SizedBox(height: 8),

              // Item 2: + New Query (Prominent Orange)
              _buildNavItem(
                index: 1,
                icon: Icons.add_circle_rounded,
                label: "New Query",
                isSpecial: true,
                isDark: isDark,
              ),

              const SizedBox(height: 8),

              // Item 3: Current Active User Reports (My Reports)
              _buildNavItem(
                index: 4,
                icon: Icons.assignment_outlined,
                label: "My Active Reports",
                isDark: isDark,
              ),

              const SizedBox(height: 8),

              // Item 4: 3D Campus Twin
              _buildNavItem(
                index: 2,
                icon: Icons.view_in_ar_rounded,
                label: "3D Campus Twin",
                isDark: isDark,
              ),

              const SizedBox(height: 8),

              // Item 5: Incident Triage Feed
              _buildNavItem(
                index: 3,
                icon: Icons.format_list_bulleted_rounded,
                label: "Incident Triage",
                isDark: isDark,
              ),

              const Spacer(),

              // 3. User Info (Name, Gmail, DP, Logout) at the BOTTOM
              Divider(
                color: isDark ? const Color(0xFF1E2638) : const Color(0xFFE5E7EB),
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
        borderRadius: BorderRadius.circular(14),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          padding: EdgeInsets.symmetric(
            horizontal: _isExpanded ? 12 : 0,
            vertical: 11,
          ),
          decoration: BoxDecoration(
            color: isSpecial
                ? const Color(0xFFF97316).withValues(alpha: isDark ? 0.16 : 0.12)
                : (isSelected
                    ? (isDark
                        ? const Color(0xFF2563EB).withValues(alpha: 0.18)
                        : const Color(0xFFEFF6FF))
                    : Colors.transparent),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: isSpecial
                  ? const Color(0xFFF97316).withValues(alpha: 0.35)
                  : (isSelected
                      ? const Color(0xFF2563EB).withValues(alpha: 0.4)
                      : Colors.transparent),
              width: 1.2,
            ),
          ),
          child: Row(
            mainAxisAlignment:
                _isExpanded ? MainAxisAlignment.start : MainAxisAlignment.center,
            children: [
              Icon(
                icon,
                size: 20,
                color: isSpecial
                    ? const Color(0xFFF97316)
                    : (isSelected
                        ? const Color(0xFF2563EB)
                        : (isDark ? const Color(0xFF94A3B8) : const Color(0xFF475569))),
              ),
              if (_isExpanded) ...[
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    label,
                    style: GoogleFonts.comfortaa(
                      fontSize: 12.5,
                      fontWeight: isSelected || isSpecial ? FontWeight.w800 : FontWeight.w600,
                      color: isSpecial
                          ? const Color(0xFFF97316)
                          : (isSelected
                              ? (isDark ? Colors.white : const Color(0xFF1D4ED8))
                              : (isDark ? const Color(0xFFE2E8F0) : const Color(0xFF1E293B))),
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
              radius: 17,
              photoUrl: photoUrl,
              name: displayName,
            ),
          ),
          const SizedBox(height: 8),
          IconButton(
            tooltip: "Logout",
            icon: Icon(
              Icons.logout_rounded,
              size: 18,
              color: isDark ? Colors.white60 : const Color(0xFF64748B),
            ),
            onPressed: () => _handleLogout(context),
          ),
        ],
      );
    }

    // Expanded: Full Profile Card with Photo, Name, Gmail & Logout Button
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF182030) : const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? const Color(0xFF263249) : const Color(0xFFE2E8F0),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              _buildAvatar(
                radius: 19,
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
                      style: GoogleFonts.comfortaa(
                        fontSize: 12.5,
                        fontWeight: FontWeight.w800,
                        color: isDark ? Colors.white : const Color(0xFF0F172A),
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      email,
                      style: GoogleFonts.comfortaa(
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                        color: isDark ? const Color(0xFF8A94A6) : AppTheme.textMutedLight,
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
            borderRadius: BorderRadius.circular(10),
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 7),
              decoration: BoxDecoration(
                color: const Color(0xFFEF4444).withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                  color: const Color(0xFFEF4444).withValues(alpha: 0.25),
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(
                    Icons.logout_rounded,
                    size: 15,
                    color: Color(0xFFEF4444),
                  ),
                  const SizedBox(width: 6),
                  Text(
                    "Logout",
                    style: GoogleFonts.comfortaa(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: const Color(0xFFEF4444),
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
          border: Border.all(color: const Color(0xFFF97316), width: 1.5),
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
        gradient: LinearGradient(
          colors: [Color(0xFFF97316), Color(0xFFEA580C)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      alignment: Alignment.center,
      child: Text(
        initial,
        style: TextStyle(
          fontSize: diameter * 0.45,
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
