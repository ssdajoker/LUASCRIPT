<#
Add .tools\lua\bin and .tools\luajit\bin to User PATH
This script appends the portable Lua and LuaJIT directories to your user PATH
so you can run lua/luajit from any terminal without prefixing paths.
Requires no admin privileges; only modifies the current user's environment.
#>

param(
    [string]$RepoRoot = (Get-Location).Path,
    [switch]$Remove
)

$ErrorActionPreference = 'Stop'

$luaBin = Join-Path $RepoRoot '.tools\lua\bin'
$jitBin = Join-Path $RepoRoot '.tools\luajit\bin'

# Get current user PATH
$currentPath = [Environment]::GetEnvironmentVariable('Path', 'User')
$pathEntries = $currentPath -split ';' | Where-Object { $_ }

if ($Remove) {
    Write-Host "[add_to_path] Removing .tools paths from User PATH"
    $newEntries = $pathEntries | Where-Object { $_ -ne $luaBin -and $_ -ne $jitBin }
    $newPath = ($newEntries -join ';')
    [Environment]::SetEnvironmentVariable('Path', $newPath, 'User')
    Write-Host "[add_to_path] Removed. Restart terminal to apply."
    exit 0
}

# Check if already present
$hasLua = $pathEntries -contains $luaBin
$hasJit = $pathEntries -contains $jitBin

if ($hasLua -and $hasJit) {
    Write-Host "[add_to_path] .tools paths already in User PATH"
    exit 0
}

# Add missing paths
$toAdd = @()
if (-not $hasLua -and (Test-Path $luaBin)) { $toAdd += $luaBin }
if (-not $hasJit -and (Test-Path $jitBin)) { $toAdd += $jitBin }

if ($toAdd.Count -eq 0) {
    Write-Host "[add_to_path] No portable tools found to add (run setup scripts first)"
    exit 0
}

Write-Host "[add_to_path] Adding to User PATH:"
$toAdd | ForEach-Object { Write-Host "  $_" }

$newPath = (($pathEntries + $toAdd) -join ';')
[Environment]::SetEnvironmentVariable('Path', $newPath, 'User')

Write-Host "[add_to_path] Added. Restart your terminal for changes to take effect."
Write-Host "[add_to_path] Or run: `$env:PATH = [System.Environment]::GetEnvironmentVariable('Path','User') + ';' + [System.Environment]::GetEnvironmentVariable('Path','Machine')"
