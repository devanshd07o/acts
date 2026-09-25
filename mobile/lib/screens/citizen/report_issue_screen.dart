import 'package:flutter/material.dart';
import '../../config/app_routes.dart';
import '../../widgets/desktop_scaffold.dart';
import 'new_query_view.dart';

class ReportIssueScreen extends StatelessWidget {
  const ReportIssueScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final isDesktop = size.width >= 900;

    final content = NewQueryView(
      onCancel: () {
        if (Navigator.canPop(context)) {
          Navigator.pop(context);
        } else {
          Navigator.pushReplacementNamed(context, AppRoutes.home);
        }
      },
      onReportSubmitted: () {
        Navigator.pushReplacementNamed(context, AppRoutes.home);
      },
    );

    return isDesktop
        ? DesktopScaffold(
            title: "Report Issue",
            currentRoute: AppRoutes.reportIssue,
            body: content,
          )
        : Scaffold(
            body: SafeArea(child: content),
          );
  }
}
