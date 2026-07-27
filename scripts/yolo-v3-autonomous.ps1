# 🌙 YOLO v3.0 - OVERNIGHT AUTONOMOUS MODE
# Long-running evolution through all 10 layers
# Designed for unattended overnight execution

param(
    [int]$Hours = 8,
    [bool]$EnableAllLayers = $true,
    [bool]$Nuclear = $false,
    [bool]$AggressiveProgress = $true
)

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║   🌙 YOLO v3 - OVERNIGHT AUTONOMOUS MODE                        ║" -ForegroundColor Magenta
Write-Host "║   Unattended Evolution • All Layers • AI-Powered                ║" -ForegroundColor Magenta
Write-Host "╚══════════════════════════════════════════════════════════════════╝" -ForegroundColor Magenta
Write-Host ""

$startTime = Get-Date
$endTime = $startTime.AddHours($Hours)

Write-Host "Overnight Mode Configuration:" -ForegroundColor Cyan
Write-Host "  Start Time: $($startTime.ToString('yyyy-MM-dd HH:mm:ss'))" -ForegroundColor White
Write-Host "  End Time: $($endTime.ToString('yyyy-MM-dd HH:mm:ss'))" -ForegroundColor White
Write-Host "  Duration: $Hours hours" -ForegroundColor White
Write-Host "  Nuclear Mode: $(if ($Nuclear) { '☢️  ENABLED' } else { '🛡️  Safe Mode' })" -ForegroundColor $(if ($Nuclear) { 'Red' } else { 'Green' })
Write-Host "  All Layers: $(if ($EnableAllLayers) { '✅ Yes' } else { '❌ No' })" -ForegroundColor White
Write-Host ""

# Set global nuclear mode if requested
if ($Nuclear) {
    $global:CC_MODE = "Nuclear"
    Write-Host "⚠️  WARNING: Nuclear Mode - Allows potentially destructive operations" -ForegroundColor Red
    Write-Host "   This is intended for overnight runs only. Press Ctrl+C to cancel." -ForegroundColor Yellow
    Write-Host ""
    Start-Sleep -Seconds 5
}

# Calculate iterations based on time
$minutesPerIteration = 5  # Estimate
$totalMinutes = $Hours * 60
$estimatedIterations = [int]($totalMinutes / $minutesPerIteration)

Write-Host "  Estimated Iterations: ~$estimatedIterations" -ForegroundColor Cyan
Write-Host ""

# Create log file for overnight run
$logFile = "artifacts/yolo-v3-overnight-$(Get-Date -Format 'yyyy-MM-dd-HHmmss').log"
$logDir = Split-Path $logFile -Parent
if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
}

function Write-OvernightLog {
    param([string]$Message)
    $timestamp = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss')
    $logEntry = "[$timestamp] $Message"
    Add-Content -Path $logFile -Value $logEntry
    Write-Host $logEntry -ForegroundColor Gray
}

Write-OvernightLog "🌙 Overnight YOLO v3 started"
Write-OvernightLog "Configuration: Hours=$Hours, Nuclear=$Nuclear, AllLayers=$EnableAllLayers"

# Main execution loop
$cycleNumber = 0
$layersCompleted = @()
$totalProgressMade = $false

while ((Get-Date) -lt $endTime) {
    $cycleNumber++
    $remainingMinutes = [int](($endTime - (Get-Date)).TotalMinutes)

    Write-Host ""
    Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host " OVERNIGHT CYCLE $cycleNumber - $remainingMinutes minutes remaining" -ForegroundColor Cyan
    Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""

    Write-OvernightLog "Starting cycle $cycleNumber (${remainingMinutes}m remaining)"

    try {
        # Run YOLO v3 layered mode
        $params = @{
            MaxIterations = 20
            TimeoutMinutes = $minutesPerIteration
            EnableAI = $true
            Verbose = $false
        }

        Write-Host "  Launching YOLO v3 Layered Mode..." -ForegroundColor Yellow

        # Capture output
        $output = & ".\scripts\yolo-v3-layered.ps1" @params 2>&1
        $exitCode = $LASTEXITCODE

        # Log output
        $output | ForEach-Object {
            Write-OvernightLog "  [v3] $_"
        }

        if ($exitCode -eq 0) {
            Write-OvernightLog "✅ Cycle $cycleNumber completed successfully"
            $totalProgressMade = $true

            # Check if a layer was completed
            if ($output -match "Layer (\d+) complete") {
                $completedLayer = $matches[1]
                if ($layersCompleted -notcontains $completedLayer) {
                    $layersCompleted += $completedLayer
                    Write-Host ""
                    Write-Host "  🎉 LAYER $completedLayer COMPLETED!" -ForegroundColor Green
                    Write-Host ""
                    Write-OvernightLog "🎉 Layer $completedLayer completed!"
                }
            }
        } else {
            Write-OvernightLog "⚠️  Cycle $cycleNumber exited with code $exitCode"
        }

        # Check if all layers complete
        if ($output -match "ALL LAYERS COMPLETE") {
            Write-Host ""
            Write-Host "╔══════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
            Write-Host "║   🎉 ALL 10 LAYERS COMPLETE!                                    ║" -ForegroundColor Green
            Write-Host "║   LUASCRIPT is production-ready!                                ║" -ForegroundColor Green
            Write-Host "╚══════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
            Write-Host ""
            Write-OvernightLog "🎉 ALL 10 LAYERS COMPLETE!"
            break
        }

        # Pause between cycles
        Start-Sleep -Seconds 30

    } catch {
        $errorMsg = $_.Exception.Message
        Write-OvernightLog "Error in cycle $cycleNumber - $errorMsg"
        Write-Host "  Error: $errorMsg" -ForegroundColor Red

        # Continue despite errors (overnight mode is resilient)
        Start-Sleep -Seconds 60
    }

    # Safety check: Don't run forever if stuck
    if ($cycleNumber -ge 50) {
        Write-OvernightLog "Maximum cycles (50) reached - stopping"
        Write-Host "  Maximum cycles reached - stopping for safety" -ForegroundColor Yellow
        break
    }
}

# Final summary
$duration = (Get-Date) - $startTime
Write-Host ""
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host " 🌙 OVERNIGHT SESSION COMPLETE" -ForegroundColor Magenta
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host ""
Write-Host "  Duration: $($duration.ToString('hh\:mm\:ss'))" -ForegroundColor Cyan
Write-Host "  Cycles: $cycleNumber" -ForegroundColor Cyan
Write-Host "  Layers Completed: $(if ($layersCompleted.Count -gt 0) { $layersCompleted -join ', ' } else { 'None' })" -ForegroundColor Cyan
Write-Host "  Progress Made: $(if ($totalProgressMade) { '✅ Yes' } else { '⚠️  Limited' })" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Log File: $logFile" -ForegroundColor Yellow
Write-Host ""

Write-OvernightLog "🌙 Overnight session complete: $cycleNumber cycles, $($duration.TotalHours) hours elapsed"

if ($layersCompleted.Count -gt 0) {
    Write-OvernightLog "Layers completed: $($layersCompleted -join ', ')"
}

# Show git log of what was accomplished
Write-Host "Recent commits during overnight run:" -ForegroundColor Cyan
& git log --oneline --since="$($startTime.ToString('yyyy-MM-dd HH:mm:ss'))" | Select-Object -First 10

Write-Host ""
Write-Host "Good morning! ☀️  Check the log for details." -ForegroundColor Green
Write-Host ""
