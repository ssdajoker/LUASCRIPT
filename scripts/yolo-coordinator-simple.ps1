param(
    [int]$Layer = 4,
    [int]$MaxWaitMinutes = 120,
    [int]$CheckIntervalSeconds = 10
)
$ErrorActionPreference = "Continue"

Write-Host "YOLO v3 Agent Coordinator" -ForegroundColor Cyan
Write-Host "Creating work queue for agent implementation"
Write-Host ""

$queue = @{
    status = "WAITING_FOR_AGENT"
    layer = $Layer
    layer_name = switch ($Layer) {
        4 { "Advanced ES6" }
        5 { "Modern JS 2020+" }
        default { "Unknown" }
    }
    tests_needed = @("test:generators", "test:modern")[$Layer - 4]
    implementation_tasks = @(
        @{
            id = "task-$Layer-1"
            feature = "Transpiler implementation for Layer $Layer"
            description = "Implement transpiler features for layer"
            file = "src/transforms/layer-$Layer.js"
            acceptance_criteria = @("Tests pass", "Code quality verified")
        }
    )
    created_at = (Get-Date).ToString('o')
}

$queue | ConvertTo-Json | Out-File "work-queue.json" -Encoding UTF8 -NoNewline

Write-Host "Queue created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Status: $($queue.status)"
Write-Host "Layer: $($queue.layer) - $($queue.layer_name)"
Write-Host "File: work-queue.json"
Write-Host ""
Write-Host "Next: Run  npm run yolo:agent" -ForegroundColor Yellow
Write-Host ""
Write-Host "Or waiting for agent to complete..." -ForegroundColor Gray
Write-Host "(Checking every $CheckIntervalSeconds seconds for up to $MaxWaitMinutes minutes)" -ForegroundColor Gray

$startTime = Get-Date
$maxCycles = ($MaxWaitMinutes * 60) / $CheckIntervalSeconds
$cycle = 0

while ($cycle -lt $maxCycles) {
    $cycle++
    Start-Sleep -Seconds $CheckIntervalSeconds

    if (Test-Path "work-queue.json") {
        $currentQueue = Get-Content "work-queue.json" -Raw
        # Remove BOM if present (PowerShell style)
        if ($currentQueue[0] -eq [char]0xFEFF) {
            $currentQueue = $currentQueue.Substring(1)
        }
        $queueObj = $currentQueue | ConvertFrom-Json

        if ($queueObj.status -eq "COMPLETE") {
            Write-Host ""
            Write-Host "Agent completed Layer $Layer!" -ForegroundColor Green
            Remove-Item "work-queue.json" -Force -ErrorAction SilentlyContinue
            exit 0
        } elseif ($queueObj.status -eq "IN_PROGRESS") {
            Write-Host "  [$cycle] Agent working... ($(((Get-Date) - $startTime).ToString('mm\:ss')))" -ForegroundColor Cyan
        } else {
            Write-Host "  [$cycle] Waiting for agent... ($(((Get-Date) - $startTime).ToString('mm\:ss')))" -ForegroundColor Gray
        }
    }
}

Write-Host ""
Write-Host "Timeout after $MaxWaitMinutes minutes - queue still available" -ForegroundColor Yellow
