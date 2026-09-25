import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

class BackendLauncherService {
  static Future<void> ensureBackendRunning() async {
    if (!Platform.isWindows) return;

    // 1. Fast Health-Check: Is Django already active on 127.0.0.1:8000?
    try {
      final res = await http.get(Uri.parse('http://127.0.0.1:8000/api/health/')).timeout(
        const Duration(milliseconds: 1200),
      );
      if (res.statusCode == 200) {
        debugPrint('[BackendLauncher] Django server already active on 127.0.0.1:8000 (status: 200).');
        return;
      }
    } catch (_) {
      // Backend not responsive or not started yet; proceed to launch
    }

    // 2. Discover backend directory containing manage.py
    final exeDir = File(Platform.resolvedExecutable).parent.path;
    final candidateDirs = [
      r'd:\LetsCode\ACTS_project-main\backend',
      Directory.current.path,
      '$exeDir\\backend',
      Directory(exeDir).parent.parent.parent.parent.path + r'\backend',
    ];

    String? backendDir;
    for (final dir in candidateDirs) {
      try {
        if (File('$dir\\manage.py').existsSync()) {
          backendDir = dir;
          break;
        }
      } catch (_) {}
    }

    if (backendDir == null) {
      debugPrint('[BackendLauncher] Warning: manage.py not found in candidate paths.');
      return;
    }

    // 3. Locate Python executable
    const pythonExe = r'C:\Users\devan\AppData\Local\Programs\Python\Python311\python.exe';
    String pythonCmd = 'python';
    if (File(pythonExe).existsSync()) {
      pythonCmd = pythonExe;
    }

    // 4. Spawn Django Server in Detached Background Mode
    try {
      debugPrint('[BackendLauncher] Spawning Django backend from $backendDir using $pythonCmd...');
      final process = await Process.start(
        pythonCmd,
        ['manage.py', 'runserver', '127.0.0.1:8000', '--noreload'],
        workingDirectory: backendDir,
        mode: ProcessStartMode.detached,
      );
      debugPrint('[BackendLauncher] Django backend spawned successfully (PID: ${process.pid}).');
    } catch (e) {
      debugPrint('[BackendLauncher] Error spawning backend process: $e');
    }

    // 5. Also ensure 3D Twin Vite Server is active on port 5173
    await ensureTwinServerRunning();
  }

  static Future<void> ensureTwinServerRunning() async {
    if (!Platform.isWindows) return;

    try {
      final res = await http.get(Uri.parse('http://127.0.0.1:5173/')).timeout(
        const Duration(milliseconds: 1200),
      );
      if (res.statusCode == 200) {
        debugPrint('[BackendLauncher] 3D Twin Vite server already active on 127.0.0.1:5173.');
        return;
      }
    } catch (_) {}

    final twinDirs = [
      r'D:\LetsCode\ACTS_project-main\3d',
      r'C:\Users\devan\.gemini\antigravity\scratch\abes-campus-pulse',
      '${Directory.current.path}\\3d',
    ];
    String? twinDir;
    for (final dir in twinDirs) {
      if (Directory(dir).existsSync()) {
        twinDir = dir;
        break;
      }
    }
    if (twinDir == null) {
      debugPrint('[BackendLauncher] 3D Twin directory not found in known paths.');
      return;
    }

    try {
      debugPrint('[BackendLauncher] Spawning 3D Twin Vite server from $twinDir...');
      final process = await Process.start(
        'cmd.exe',
        ['/c', 'npm', 'run', 'dev'],
        workingDirectory: twinDir,
        mode: ProcessStartMode.detached,
      );
      debugPrint('[BackendLauncher] 3D Twin Vite server spawned successfully (PID: ${process.pid}).');
    } catch (e) {
      debugPrint('[BackendLauncher] Error spawning 3D Twin Vite server: $e');
    }
  }
}
