<#
Portable LuaJIT setup into .tools\luajit\bin
This script installs or locates LuaJIT on Windows and copies a working luajit.exe
into the repo-local .tools\luajit\bin for portable use. It tries:
1) Winget DEVCOM.LuaJIT
2) Searches common installation paths for luajit.exe or luajit64.exe
#>

param(
    [string]$RepoRoot = (Get-Location).Path,
    [switch]$Quiet
)

$ErrorActionPreference = 'Stop'
function Write-Info($msg) { if (-not $Quiet) { Write-Host "[setup_portable_luajit] $msg" } }

$toolsDir = Join-Path $RepoRoot '.tools'
$jitDir = Join-Path $toolsDir 'luajit'
$jitBin = Join-Path $jitDir 'bin'
New-Item -Path $toolsDir -ItemType Directory -Force | Out-Null
New-Item -Path $jitDir -ItemType Directory -Force | Out-Null
New-Item -Path $jitBin -ItemType Directory -Force | Out-Null

function Try-WingetInstall {
  param([string]$Id)
  try {
    Write-Info "winget install $Id"
    winget install --id $Id --source winget --accept-package-agreements --accept-source-agreements | Out-Null
  } catch { Write-Info "winget install failed for $($Id): $($_.Exception.Message)" }
}

function Find-LuaJITExe {
  $pf = $env:ProgramFiles
  $pfx86 = ${env:ProgramFiles(x86)}
  $localPrograms = Join-Path $env:LOCALAPPDATA 'Programs'
  $candidates = @(
    'C:\LuaJIT',
    'C:\Program Files\LuaJIT',
    'C:\Program Files (x86)\LuaJIT',
    $pf,
    $pfx86,
    $localPrograms
  ) | Where-Object { $_ -and (Test-Path $_) }
  foreach ($base in $candidates) {
    $jitCandidate = Get-ChildItem -Path $base -Recurse -ErrorAction SilentlyContinue -Include 'luajit.exe','luajit64.exe' | Where-Object { $_.Name -match '^luajit(64)?\.exe$' } | Select-Object -First 1
    if ($jitCandidate) { return $jitCandidate.FullName }
  }
  return $null
}

# If we already have a portable luajit, skip
$portableJit = Join-Path $jitBin 'luajit.exe'
if (Test-Path $portableJit) {
  Write-Info "Portable LuaJIT already present: $portableJit"
  & $portableJit -v
  exit 0
}

# Try winget installs
Try-WingetInstall -Id 'DEVCOM.LuaJIT'
$found = Find-LuaJITExe

if (-not $found) {
  throw "LuaJIT executable not found. Try running PowerShell as Administrator or install LuaJIT manually."
}

Write-Info "Found LuaJIT at: $found"
Copy-Item -Path $found -Destination $portableJit -Force

Write-Info "Portable LuaJIT installed at $jitBin"
& $portableJit -v
