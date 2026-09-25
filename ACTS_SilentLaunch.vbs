Set WshShell = CreateObject("WScript.Shell")

' 1. Check if Django backend is already running on port 8000, if not start it silently
Dim http
On Error Resume Next
Set http = CreateObject("MSXML2.ServerXMLHTTP.6.0")
http.open "GET", "http://127.0.0.1:8000/api/health/", False
http.setTimeouts 1000, 1000, 1000, 1000
http.send ""

If Err.Number <> 0 Or http.status <> 200 Then
    ' Start Django backend completely hidden (window style 0)
    WshShell.Run "cmd.exe /c ""cd /d D:\LetsCode\ACTS_project-main\backend && python manage.py runserver 0.0.0.0:8000""", 0, False
End If
On Error GoTo 0

' 2. Check if 3D Twin is running on port 5173
On Error Resume Next
Set http = CreateObject("MSXML2.ServerXMLHTTP.6.0")
http.open "GET", "http://127.0.0.1:5173/", False
http.setTimeouts 1000, 1000, 1000, 1000
http.send ""

If Err.Number <> 0 Then
    ' Start 3D Twin Vite completely hidden (window style 0)
    WshShell.Run "cmd.exe /c ""cd /d D:\LetsCode\ACTS_project-main\3d && npm run dev""", 0, False
End If
On Error GoTo 0

' 3. Check if Web Admin is running on port 5174
On Error Resume Next
Set http = CreateObject("MSXML2.ServerXMLHTTP.6.0")
http.open "GET", "http://127.0.0.1:5174/", False
http.setTimeouts 1000, 1000, 1000, 1000
http.send ""

If Err.Number <> 0 Then
    ' Start Web Admin Vite completely hidden (window style 0)
    WshShell.Run "cmd.exe /c ""cd /d D:\LetsCode\ACTS_project-main\web && npx vite --port 5174""", 0, False
End If
On Error GoTo 0

' 4. Brief delay for socket readiness
WScript.Sleep 1500

' 5. Launch Flutter Desktop Release App (normal GUI window, zero terminal)
WshShell.Run """D:\LetsCode\ACTS_project-main\mobile\build\windows\x64\runner\Release\acts_mobile.exe""", 1, False
