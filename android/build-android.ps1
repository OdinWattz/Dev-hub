param(
  [ValidateSet('apk', 'aab', 'both')]
  [string]$Target = 'apk'
)

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Split-Path -Parent $scriptDir
$androidNativeDir = Join-Path $scriptDir 'android'
$distDir = Join-Path $scriptDir 'dist'

if (-not (Test-Path $distDir)) {
  New-Item -ItemType Directory -Path $distDir | Out-Null
}

if (-not $env:JAVA_HOME -or -not (Test-Path $env:JAVA_HOME)) {
  $jbrPath = 'C:\Program Files\Android\Android Studio\jbr'
  if (Test-Path $jbrPath) {
    $env:JAVA_HOME = $jbrPath
  } else {
    throw 'JAVA_HOME is not set and Android Studio JBR was not found.'
  }
}

if (-not $env:ANDROID_HOME -or -not (Test-Path $env:ANDROID_HOME)) {
  $sdkPath = Join-Path $env:LOCALAPPDATA 'Android\Sdk'
  if (Test-Path $sdkPath) {
    $env:ANDROID_HOME = $sdkPath
  } else {
    throw 'ANDROID_HOME is not set and Android SDK was not found at %LOCALAPPDATA%\\Android\\Sdk.'
  }
}

$env:Path = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:Path"

Write-Host '1/3 Building static web app...'
Set-Location $repoRoot
npm run build

Write-Host '2/3 Syncing web assets to native Android project...'
Set-Location $scriptDir
npx cap sync android

Write-Host '3/3 Building Android artifacts...'
Set-Location $androidNativeDir

if ($Target -eq 'apk' -or $Target -eq 'both') {
  .\gradlew.bat assembleRelease
  $apkSource = Join-Path $androidNativeDir 'app\build\outputs\apk\release\app-release.apk'
  $apkOut = Join-Path $distDir 'dev-hub-release.apk'
  Copy-Item $apkSource $apkOut -Force
  Write-Host "APK: $apkOut"
}

if ($Target -eq 'aab' -or $Target -eq 'both') {
  .\gradlew.bat bundleRelease
  $aabSource = Join-Path $androidNativeDir 'app\build\outputs\bundle\release\app-release.aab'
  $aabOut = Join-Path $distDir 'dev-hub-release.aab'
  Copy-Item $aabSource $aabOut -Force
  Write-Host "AAB: $aabOut"
}

Write-Host 'Done.'
