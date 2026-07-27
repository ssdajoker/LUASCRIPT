# 🩺 YOLO HEALTH CHECK - Quick Quality Gates Diagnostic
# Use this before running YOLO v2 to see current status

$ErrorActionPreference = "Continue"

function Write-Status {
    param([string]$Gate, [bool]$Passed, [string]$Time)
    $emoji = if ($Passed) { "✅" } else { "❌" }
    $color = if ($Passed) { "Green" } else { "Red" }
    $status = if ($Passed) { "PASS" } else { "FAIL" }

    Write-Host ("  {0} {1,-20} {2,-6} ({3})" -f $emoji, $Gate, $status, $Time) -ForegroundColor $color
}

function Test-QuickGate {
    param([string]$Name, [string]$Command)

    $start = Get-Date
    try {
        $null = & npm run $Command 2>&1
        $exitCode = $LASTEXITCODE
        $duration = (Get-Date) - $start

        Write-Status -Gate $Name -Passed ($exitCode -eq 0) -Time ("{0:F1}s" -f $duration.TotalSeconds)
        return ($exitCode -eq 0)
    } catch {
        $duration = (Get-Date) - $start
        Write-Status -Gate $Name -Passed $false -Time ("{0:F1}s" -f $duration.TotalSeconds)
        return $false
    }
}

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  🩺 YOLO HEALTH CHECK - Quality Gates Status                ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$results = @()
$results += Test-QuickGate "Harness" "harness"
$results += Test-QuickGate "IR Validation" "ir:validate:all"
$results += Test-QuickGate "Parity" "test:parity"
$results += Test-QuickGate "Determinism" "test:determinism"

$passed = ($results | Where-Object { $_ }).Count
$failed = ($results | Where-Object { -not $_ }).Count

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "SUMMARY: ✅ $passed passed | ❌ $failed failed" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

if ($failed -eq 0) {
    Write-Host "🎉 ALL GATES HEALTHY!" -ForegroundColor Green
    Write-Host "   No need to run YOLO - everything is passing." -ForegroundColor Green
    Write-Host ""
    exit 0
} else {
    Write-Host "⚠️  $failed gate(s) need attention" -ForegroundColor Yellow
    Write-Host "   Run YOLO v2 to fix: .\scripts\yolo-v2-intelligent.ps1" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}
