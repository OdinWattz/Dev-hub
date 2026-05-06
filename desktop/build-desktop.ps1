param(
  [ValidateSet('installer', 'portable', 'both')]
  [string]$Target = 'both'
)

$ErrorActionPreference = 'Stop'

$scriptDir  = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot   = Split-Path -Parent $scriptDir
$webDir     = Join-Path $scriptDir 'web'
$distDir    = Join-Path $scriptDir 'dist'

if (-not (Test-Path $distDir)) {
  New-Item -ItemType Directory -Path $distDir | Out-Null
}

# ── 1. Build Next.js web app ───────────────────────────────────────────────
Write-Host '1/4 Building static web app...'
Set-Location $repoRoot
npm run build  # No CAPACITOR_BUILD needed — app:// protocol handles absolute paths

# ── 2. Copy web output into desktop/web/ ──────────────────────────────────
Write-Host '2/4 Copying web assets to desktop/web/...'
if (Test-Path $webDir) { Remove-Item $webDir -Recurse -Force }
Copy-Item (Join-Path $repoRoot 'out') $webDir -Recurse

# ── 3. Install desktop dependencies ───────────────────────────────────────
Write-Host '3/4 Installing desktop dependencies...'
Set-Location $scriptDir
npm install

# ── 4. Build Electron app ─────────────────────────────────────────────────
Write-Host '4/4 Building Electron app...'
$builderArgs = @('--win')

if ($Target -eq 'installer') {
  $builderArgs += '--config.win.target=nsis'
} elseif ($Target -eq 'portable') {
  $builderArgs += '--config.win.target=portable'
}

npx electron-builder @builderArgs

# Report artifacts
Get-ChildItem $distDir -Filter '*.exe' | ForEach-Object {
  Write-Host "Artifact: $($_.FullName)  ($([Math]::Round($_.Length / 1MB, 1)) MB)"
}

Write-Host 'Done.'
