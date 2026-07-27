<#
Portable Lua setup into .tools\lua\bin
This script installs or locates Lua on Windows and copies a working lua.exe
into the repo-local .tools\lua\bin for portable use. It tries:
1) Winget DEVCOM.Lua (Lua 5.4)
2) Winget rjpcomputing.luaforwindows (Lua 5.1)
3) Searches common installation paths for lua.exe or lua54.exe
#>

param(
        [string]$RepoRoot = (Get-Location).Path,
        [switch]$Quiet
)

$ErrorActionPreference = 'Stop'
function Write-Info($msg) { if (-not $Quiet) { Write-Host "[setup_portable_lua] $msg" } }

$toolsDir = Join-Path $RepoRoot '.tools'
$luaDir = Join-Path $toolsDir 'lua'
$luaBin = Join-Path $luaDir 'bin'
New-Item -Path $toolsDir -ItemType Directory -Force | Out-Null
New-Item -Path $luaDir -ItemType Directory -Force | Out-Null
New-Item -Path $luaBin -ItemType Directory -Force | Out-Null

function Try-WingetInstall {
    param([string]$Id)
    try {
        Write-Info "winget install $Id"
        winget install --id $Id --source winget --accept-package-agreements --accept-source-agreements | Out-Null
    } catch { Write-Info "winget install failed for $($Id): $($_.Exception.Message)" }
}

function Find-LuaExe {
    $pf = $env:ProgramFiles
    $pfx86 = ${env:ProgramFiles(x86)}
    $localPrograms = Join-Path $env:LOCALAPPDATA 'Programs'
    $candidates = @(
        'C:\Lua',
        'C:\Program Files\Lua',
        'C:\Program Files (x86)\Lua',
        $pf,
        $pfx86,
        $localPrograms
    ) | Where-Object { $_ -and (Test-Path $_) }
    foreach ($base in $candidates) {
        $luaCandidate = Get-ChildItem -Path $base -Recurse -ErrorAction SilentlyContinue -Include 'lua.exe','lua54.exe','lua*.exe' | Where-Object { $_.Name -match '^lua(\d+)?\.exe$' } | Select-Object -First 1
        if ($luaCandidate) { return $luaCandidate.FullName }
    }
    return $null
}

# If we already have a portable lua, skip
$portableLua = Join-Path $luaBin 'lua.exe'
if (Test-Path $portableLua) {
    Write-Info "Portable Lua already present: $portableLua"
    & $portableLua -v
    exit 0
}

# Try winget installs
Try-WingetInstall -Id 'DEVCOM.Lua'
$found = Find-LuaExe
if (-not $found) {
    Try-WingetInstall -Id 'rjpcomputing.luaforwindows'
    $found = Find-LuaExe
}

if (-not $found) {
    throw "Lua executable not found. Try running PowerShell as Administrator or install Lua manually."
}

Write-Info "Found Lua at: $found"
Copy-Item -Path $found -Destination $portableLua -Force

Write-Info "Portable Lua installed at $luaBin"
& $portableLua -v
