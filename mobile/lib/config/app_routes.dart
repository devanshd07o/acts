import 'package:flutter/material.dart';
import '../screens/auth/login_screen.dart';
import '../screens/auth/register_screen.dart';
import '../screens/onboarding/onboarding_screen.dart';
import '../screens/home/portal_home_screen.dart';
import '../screens/map/campus_3d_twin_screen.dart';
import '../screens/citizen/report_issue_screen.dart';
import '../screens/citizen/my_reports_screen.dart';
import '../screens/admin/admin_map_screen.dart';
import '../screens/admin/admin_tickets_screen.dart';
import '../screens/admin/issue_detail_screen.dart';
import '../screens/analytics/campus_analytics_screen.dart';
import '../services/auth_service.dart';

class AppRoutes {
  static const String onboarding = '/onboarding';
  static const String login = '/login';
  static const String register = '/register';
  static const String home = '/home';
  static const String campus3DTwin = '/campus-3d-twin';
  static const String reportIssue = '/report';
  static const String myReports = '/my-reports';
  static const String adminMap = '/admin-map';
  static const String adminTickets = '/admin-tickets';
  static const String issueDetail = '/issue-detail';
  static const String analytics = '/analytics';

  static String get initialRoute {
    final auth = AuthService();
    if (auth.isLoggedIn) {
      return home;
    }
    return login;
  }

  static Map<String, WidgetBuilder> get routes => {
        onboarding: (context) => const OnboardingScreen(),
        login: (context) => const LoginScreen(),
        register: (context) => const RegisterScreen(),
        home: (context) => const PortalHomeScreen(),
        campus3DTwin: (context) => const Campus3DTwinScreen(),
        reportIssue: (context) => const ReportIssueScreen(),
        myReports: (context) => const MyReportsScreen(),
        adminMap: (context) => const AdminMapScreen(),
        adminTickets: (context) => const AdminTicketsScreen(),
        analytics: (context) => const CampusAnalyticsScreen(),
      };

  static Route<dynamic>? onGenerateRoute(RouteSettings settings) {
    if (settings.name == issueDetail) {
      final complaintId = settings.arguments as String?;
      return MaterialPageRoute(
        builder: (context) => IssueDetailScreen(complaintId: complaintId ?? ''),
      );
    }
    return null;
  }
}
