# create-shortcut.ps1
# Run this once to create a DevHub shortcut on your desktop

$batPath     = "C:\Users\odinw\Documents\Dev-Hub\launch-devhub.bat"
$shortcutPath = "$env:USERPROFILE\Desktop\DevHub.lnk"
$iconPath    = "C:\Windows\System32\SHELL32.dll"   # fallback icon
$iconIndex   = 14                                   # globe icon

$wsh      = New-Object -ComObject WScript.Shell
$shortcut = $wsh.CreateShortcut($shortcutPath)

$shortcut.TargetPath       = $batPath
$shortcut.WorkingDirectory = "C:\Users\odinw\Documents\Dev-Hub"
$shortcut.Description      = "Open DevHub - Developer Toolkit"
$shortcut.WindowStyle      = 7          # 7 = minimized (runs in background)
$shortcut.IconLocation     = "$iconPath,$iconIndex"

$shortcut.Save()

Write-Host "DevHub shortcut created on Desktop!" -ForegroundColor Cyan
Write-Host "Double-click 'DevHub' on your desktop to launch the app." -ForegroundColor Gray
