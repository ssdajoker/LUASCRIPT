[CmdletBinding()]
param(
    [Parameter(Position = 0)]
    [ValidateSet(
        'status',
        'doctor',
        'verify',
        'prefetch',
        'push-dry-run',
        'push',
        'bridge-packet-refresh',
        'mirror-update'
    )]
    [string]$Command = 'status',

    [string]$MirrorPath
)

$ErrorActionPreference = 'Stop'
$requiredVersion = '1.5.1'
$repoRoot = Split-Path -Parent $PSScriptRoot

# Repocalypse 1.5.1 launches verification commands through Python text-mode
# subprocesses. Force UTF-8 so LUASCRIPT's Unicode diagnostics are decoded
# consistently on Windows hosts whose legacy code page is CP-1252.
$env:PYTHONUTF8 = '1'
$env:PYTHONIOENCODING = 'utf-8'

if ([string]::IsNullOrWhiteSpace($env:REPOCALYPSE_HOME)) {
    throw 'REPOCALYPSE_HOME must point to the active combined Repocalypse checkout.'
}

$repocalypseHome = [System.IO.Path]::GetFullPath($env:REPOCALYPSE_HOME)
if (-not (Test-Path -LiteralPath $repocalypseHome -PathType Container)) {
    throw "REPOCALYPSE_HOME does not exist: $repocalypseHome"
}

$toolDir = Join-Path $repocalypseHome 'ivc-v1.4\.venv\Scripts'
$nogit = Join-Path $toolDir 'nogit.exe'
$ivc = Join-Path $toolDir 'ivc.exe'
foreach ($tool in @($nogit, $ivc)) {
    if (-not (Test-Path -LiteralPath $tool -PathType Leaf)) {
        throw "Repocalypse tool is missing: $tool"
    }
}

function Assert-ToolVersion {
    param([string]$ToolPath, [string]$ToolName)

    $reported = (& $ToolPath --version 2>&1 | Out-String).Trim()
    if ($LASTEXITCODE -ne 0 -or $reported -notmatch [regex]::Escape($requiredVersion)) {
        throw "$ToolName must report version $requiredVersion; received '$reported'."
    }
}

function Invoke-Checked {
    param([string]$ToolPath, [string[]]$Arguments)

    & $ToolPath @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "$(Split-Path -Leaf $ToolPath) failed with exit code $LASTEXITCODE."
    }
}

function Resolve-IVCMirrorPath {
    param([string]$CandidatePath)

    if ([string]::IsNullOrWhiteSpace($CandidatePath)) {
        if (-not [string]::IsNullOrWhiteSpace($env:LUASCRIPT_IVC_MIRROR)) {
            $CandidatePath = $env:LUASCRIPT_IVC_MIRROR
        } else {
            $CandidatePath = Join-Path (Split-Path -Parent $repoRoot) 'LUASCRIPT.ivc-mirror'
        }
    }

    $resolvedMirror = [System.IO.Path]::GetFullPath($CandidatePath)
    if (-not (Test-Path -LiteralPath (Join-Path $resolvedMirror '.ivc') -PathType Container)) {
        throw "IVC mirror is not initialized: $resolvedMirror"
    }

    return $resolvedMirror
}

function Write-BridgePacket {
    param([string]$ResolvedMirror)

    $packet = Join-Path $repoRoot '.nogit\bridge\ivc_export.json'
    $packetParent = Split-Path -Parent $packet
    New-Item -ItemType Directory -Path $packetParent -Force | Out-Null
    Invoke-Checked $ivc @(
        'bridge', 'nogit', 'export-empty-packet',
        '--repo-path', $ResolvedMirror,
        '--output', $packet
    )
}

Assert-ToolVersion -ToolPath $nogit -ToolName 'No-Git'
Assert-ToolVersion -ToolPath $ivc -ToolName 'IVC'

Push-Location $repoRoot
try {
    switch ($Command) {
        'status' {
            Invoke-Checked $nogit @('status')
        }
        'doctor' {
            Invoke-Checked $nogit @('doctor')
        }
        'verify' {
            Invoke-Checked $nogit @('verify')
        }
        'prefetch' {
            Invoke-Checked $nogit @('prefetch')
        }
        'push-dry-run' {
            Invoke-Checked $nogit @('push', '--dry-run')
        }
        'push' {
            Invoke-Checked $nogit @('push')
        }
        'bridge-packet-refresh' {
            $resolvedMirror = Resolve-IVCMirrorPath -CandidatePath $MirrorPath
            Write-BridgePacket -ResolvedMirror $resolvedMirror
        }
        'mirror-update' {
            $resolvedMirror = Resolve-IVCMirrorPath -CandidatePath $MirrorPath

            $gitSha = (& git rev-parse HEAD).Trim()
            if ($LASTEXITCODE -ne 0) {
                throw 'Unable to resolve the current Git HEAD.'
            }

            Write-BridgePacket -ResolvedMirror $resolvedMirror

            Invoke-Checked $ivc @(
                'bridge', 'git', 'export-to-ivc',
                '--repo-path', $repoRoot,
                '--ivc-repo-path', $resolvedMirror,
                '--message', "Git sync $gitSha"
            )

            Invoke-Checked $ivc @(
                'bridge', 'git', 'translate',
                '--repo-path', $repoRoot,
                '--ivc-repo-path', $resolvedMirror,
                $gitSha
            )
        }
    }
} finally {
    Pop-Location
}
