# Multi-Layer Autonomous Development Loop
# Runs through layers 4-10 with generous timeouts
# Trigger-based, not time-based

param(
    [int]$StartLayer = 4,
    [int]$EndLayer = 10,
    [int]$MaxWaitPerLayer = 120  # 2 hours per layer max
)

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "MULTI-LAYER AUTONOMOUS LOOP" -ForegroundColor Cyan
Write-Host "Layers $StartLayer to $EndLayer" -ForegroundColor Cyan
Write-Host "Max wait per layer: $MaxWaitPerLayer minutes" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

$overallStart = Get-Date

for ($layer = $StartLayer; $layer -le $EndLayer; $layer++) {
    $layerStart = Get-Date

    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Yellow
    Write-Host "LAYER $layer" -ForegroundColor Yellow
    Write-Host "=========================================" -ForegroundColor Yellow
    Write-Host ""

    # Step 1: Coordinator creates work queue
    Write-Host "Step 1: Creating work queue..." -ForegroundColor Cyan
    & npm run yolo:coordinator -- -Layer $layer -MaxWaitMinutes $MaxWaitPerLayer

    $coordinatorResult = $LASTEXITCODE

    if ($coordinatorResult -eq 0) {
        Write-Host ""
        Write-Host "Layer $layer COMPLETE (already passing or completed by agent)!" -ForegroundColor Green
        Write-Host "Time: $(((Get-Date) - $layerStart).ToString('mm\:ss'))" -ForegroundColor Green
        continue
    }

    # Step 2: Agent implements features
    Write-Host ""
    Write-Host "Step 2: Evolved theatrical agent implementation..." -ForegroundColor Cyan
    & npm run yolo:agent-evolved

    $agentResult = $LASTEXITCODE

    if ($agentResult -eq 0) {
        Write-Host ""
        Write-Host "Layer $layer implementation complete!" -ForegroundColor Green
        Write-Host "Time: $(((Get-Date) - $layerStart).ToString('mm\:ss'))" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "Layer $layer implementation incomplete" -ForegroundColor Yellow
        Write-Host "Moving to next layer anyway..." -ForegroundColor Gray
    }

    $layerDuration = ((Get-Date) - $layerStart).TotalMinutes
    Write-Host ""
    Write-Host "Layer $layer total time: $([Math]::Round($layerDuration, 1)) minutes" -ForegroundColor Cyan
}

$overallDuration = ((Get-Date) - $overallStart).TotalMinutes

Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host "MULTI-LAYER LOOP COMPLETE" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Total time: $([Math]::Round($overallDuration, 1)) minutes" -ForegroundColor Green
Write-Host "Layers processed: $StartLayer to $EndLayer" -ForegroundColor Green
Write-Host ""
