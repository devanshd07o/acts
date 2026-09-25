using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Threading;
using System.Threading.Tasks;

class Program
{
    static bool IsPortListening(string url)
    {
        try
        {
            var req = (HttpWebRequest)WebRequest.Create(url);
            req.Timeout = 1000;
            req.Method = "GET";
            using (var resp = (HttpWebResponse)req.GetResponse())
            {
                return true;
            }
        }
        catch
        {
            return false;
        }
    }

    static void StartHiddenProcess(string cmd, string args, string workingDir)
    {
        try
        {
            var psi = new ProcessStartInfo
            {
                FileName = cmd,
                Arguments = args,
                WorkingDirectory = workingDir,
                CreateNoWindow = true,
                UseShellExecute = false,
                WindowStyle = ProcessWindowStyle.Hidden
            };
            Process.Start(psi);
        }
        catch { }
    }

    [STAThread]
    static void Main()
    {
        string root = @"D:\LetsCode\ACTS_project-main";
        string appPath = Path.Combine(root, @"mobile\build\windows\x64\runner\Release\acts_mobile.exe");

        // 1. INSTANT APP LAUNCH: Open Flutter Desktop App immediately with zero delay
        if (File.Exists(appPath))
        {
            try
            {
                var appPsi = new ProcessStartInfo
                {
                    FileName = appPath,
                    WorkingDirectory = Path.GetDirectoryName(appPath),
                    UseShellExecute = true
                };
                Process.Start(appPsi);
            }
            catch { }
        }

        // 2. PARALLEL BACKGROUND SERVICES: Launch backend, 3D twin, web admin completely silently
        Task.Run(() =>
        {
            // Django backend (port 8000)
            if (!IsPortListening("http://127.0.0.1:8000/api/health/"))
            {
                StartHiddenProcess("cmd.exe", "/c python manage.py runserver 0.0.0.0:8000", Path.Combine(root, "backend"));
            }

            // 3D Digital Twin (port 5173)
            if (!IsPortListening("http://127.0.0.1:5173/"))
            {
                StartHiddenProcess("cmd.exe", "/c npm run dev", Path.Combine(root, "3d"));
            }

            // Web Admin (port 5174)
            if (!IsPortListening("http://127.0.0.1:5174/"))
            {
                StartHiddenProcess("cmd.exe", "/c npx vite --port 5174", Path.Combine(root, "web"));
            }
        }).Wait(1500);
    }
}
