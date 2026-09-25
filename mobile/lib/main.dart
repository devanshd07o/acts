import 'package:flutter/material.dart';
import 'config/app_routes.dart';
import 'config/theme.dart';
import 'services/auth_service.dart';
import 'services/theme_service.dart';
import 'services/backend_launcher_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // Auto-launch Django backend daemon if not already running
  BackendLauncherService.ensureBackendRunning();
  await AuthService().init();
  await ThemeService().init();
  runApp(const ActsApp());
}

class ActsApp extends StatelessWidget {
  const ActsApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<ThemeMode>(
      valueListenable: ThemeService().themeModeNotifier,
      builder: (context, currentMode, _) {
        return MaterialApp(
          title: 'ACTS - Civic Triage System',
          debugShowCheckedModeBanner: false,
          theme: AppTheme.lightTheme,
          darkTheme: AppTheme.darkTheme,
          themeMode: currentMode,
          initialRoute: AppRoutes.initialRoute,
          routes: AppRoutes.routes,
          onGenerateRoute: AppRoutes.onGenerateRoute,
        );
      },
    );
  }
}
