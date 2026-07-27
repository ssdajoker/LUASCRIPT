#!/usr/bin/env pwsh
# 🔄 YOLO v3 AGENT COORDINATOR
# Creates work queue for autonomous agent, monitors completion
# Agent (GitHub Copilot) reads queue and implements features

param(
    [int]$TargetLayer = 4,
    [int]$MaxWaitCycles = 120,  # 2 hours max wait for agent
    [int]$WaitIntervalSeconds = 30
)

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   🔄 YOLO v3 AGENT COORDINATOR                                  ║" -ForegroundColor Cyan
Write-Host "║   PowerShell ↔ Agent Loop • Autonomous Implementation           ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

function New-WorkQueue {
    param(
        [int]$Layer,
        [string]$LayerName,
        [string[]]$Tests,
        [string[]]$FailureFiles,
        [hashtable[]]$Tasks
    )

    $queue = @{
        created_at = (Get-Date).ToString('o')
        status = "WAITING_FOR_AGENT"
        layer = $Layer
        layer_name = $LayerName
        tests_needed = $Tests
        test_failures = @()
        implementation_tasks = $Tasks
        agent_instructions = "1. Read this queue 2. Implement tasks 3. Run tests until passing 4. Set status=COMPLETE 5. Commit"
        wait_timeout_seconds = 7200
    }

    # Add failure details
    foreach ($file in $FailureFiles) {
        if (Test-Path $file) {
            $failures = Get-Content $file -Raw
            $queue.test_failures += @{
                test = Split-Path $file -Leaf
                failures_file = $file
                preview = $failures.Substring(0, [Math]::Min(500, $failures.Length)) + "..."
            }
        }
    }

    return $queue
}

function Test-Layer {
    param([int]$Layer)

    $tests = switch ($Layer) {
        4 { @("test:generators") }
        5 { @("test:modern") }
        6 { @("test:performance") }
        7 { @("test:errors") }
        8 { @("test:edge") }
        9 { @("test:docs") }
        10 { @("test:production") }
        default { @() }
    }

    Write-Host "  Running tests for Layer $Layer..." -ForegroundColor Gray

    $allPassed = $true
    $failureFiles = @()

    foreach ($test in $tests) {
        Write-Host "    - $test" -ForegroundColor Gray

        $testOutput = & npm run $test 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Host "      ❌ FAILED" -ForegroundColor Red
            $allPassed = $false

            $failFile = "artifacts/layer-$Layer-$test-failures.txt"
            $testOutput | Out-File $failFile -Encoding UTF8
            $failureFiles += $failFile
            Write-Host "      📝 Details: $failFile" -ForegroundColor Yellow
        } else {
            Write-Host "      ✅ PASSED" -ForegroundColor Green
        }
    }

    return @{
        AllPassed = $allPassed
        FailureFiles = $failureFiles
    }
}

function Invoke-AgentCoordinator {
    param([int]$Layer)

    # Layer configuration
    $layerConfig = @{
        4 = @{
            Name = "Advanced ES6"
            Tests = @("test:generators")
            Tasks = @(
                @{
                    id = "task-4-1"
                    feature = "Generator function transpilation"
                    description = "Transpile ES6 generators to compatible code"
                    file = "src/transforms/generators.js"
                    acceptance_criteria = @(
                        "function* works",
                        "yield works",
                        "Generator methods work"
                    )
                }
            )
        }
        5 = @{
            Name = "Modern JS 2020+"
            Tests = @("test:modern")
            Tasks = @(
                @{
                    id = "task-5-1"
                    feature = "Optional chaining (?.) operator"
                    description = "Transpile ?. to null-safe operations"
                    file = "src/transforms/optional-chaining.js"
                    acceptance_criteria = @(
                        "obj?.prop works",
                        "fn?.() works",
                        "arr?.[0] works"
                    )
                },
                @{
                    id = "task-5-2"
                    feature = "Nullish coalescing (??) operator"
                    description = "Transpile ?? to null coalescing"
                    file = "src/transforms/nullish-coalescing.js"
                    acceptance_criteria = @(
                        "a ?? b works",
                        "Prefers nullish checks over falsy"
                    )
                }
            )
        }
        6 = @{
            Name = "Performance Optimization"
            Tests = @("test:performance")
            Tasks = @(
                @{
                    id = "task-6-1"
                    feature = "Code optimization"
                    description = "Optimize generated Lua code"
                    file = "src/optimize.js"
                    acceptance_criteria = @(
                        "Unused variables removed",
                        "Dead code eliminated"
                    )
                }
            )
        }
    }

    if (-not $layerConfig.ContainsKey($Layer)) {
        Write-Host "❌ Layer $Layer not configured" -ForegroundColor Red
        return $false
    }

    $config = $layerConfig[$Layer]

    Write-Host ""
    Write-Host "═════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "  LAYER $Layer: $($config.Name)" -ForegroundColor Cyan
    Write-Host "═════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""

    # Test current status
    Write-Host "📊 Current Status:" -ForegroundColor Cyan
    $testResult = Test-Layer -Layer $Layer

    if ($testResult.AllPassed) {
        Write-Host ""
        Write-Host "✅ Layer $Layer COMPLETE - All tests passing!" -ForegroundColor Green

        # Commit
        & git add -A 2>&1 | Out-Null
        & git commit -m "✅ Layer $Layer complete: $($config.Name)" --no-verify 2>&1 | Out-Null
        Write-Host "📝 Committed progress" -ForegroundColor Green

        return $true
    }

    # Create work queue for agent
    Write-Host ""
    Write-Host "🔄 Creating work queue for agent..." -ForegroundColor Cyan

    $queue = New-WorkQueue `
        -Layer $Layer `
        -LayerName $config.Name `
        -Tests $config.Tests `
        -FailureFiles $testResult.FailureFiles `
        -Tasks $config.Tasks

    $queueFile = "work-queue.json"
    $queue | ConvertTo-Json -Depth 10 | Out-File $queueFile -Encoding UTF8
    Write-Host "  ✅ Queue created: $queueFile" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Tasks to implement:" -ForegroundColor Yellow
    foreach ($task in $config.Tasks) {
        Write-Host "    - $($task.id): $($task.feature)" -ForegroundColor White
    }
    Write-Host ""

    # Wait for agent to complete
    Write-Host "⏳ Waiting for agent to implement..." -ForegroundColor Cyan
    Write-Host "   (Checking every $WaitIntervalSeconds seconds, max $MaxWaitCycles cycles)" -ForegroundColor Gray
    Write-Host ""

    $waitCycle = 0
    while ($waitCycle -lt $MaxWaitCycles) {
        $waitCycle++

        # Check if work queue still exists and status
        if (Test-Path $queueFile) {
            $currentQueue = Get-Content $queueFile -Raw | ConvertFrom-Json

            if ($currentQueue.status -eq "COMPLETE") {
                Write-Host ""
                Write-Host "✅ Agent completed implementation!" -ForegroundColor Green
                Write-Host "   Completed at: $($currentQueue.completed_at)" -ForegroundColor Green

                # Verify tests pass
                Write-Host ""
                Write-Host "🔍 Verifying implementation..." -ForegroundColor Cyan
                $verifyResult = Test-Layer -Layer $Layer

                if ($verifyResult.AllPassed) {
                    Write-Host ""
                    Write-Host "✅ All tests passing! Layer $Layer is complete!" -ForegroundColor Green

                    # Clean up queue
                    Remove-Item $queueFile -Force -ErrorAction SilentlyContinue

                    return $true
                } else {
                    Write-Host ""
                    Write-Host "⚠️ Tests still failing - agent may need another iteration" -ForegroundColor Yellow
                    Write-Host "   Resetting queue for another agent cycle..." -ForegroundColor Yellow
                    $currentQueue.status = "WAITING_FOR_AGENT"
                    $currentQueue | ConvertTo-Json -Depth 10 | Out-File $queueFile -Encoding UTF8
                }
            } elseif ($currentQueue.status -eq "IN_PROGRESS") {
                Write-Host "  [Cycle $waitCycle] Agent is working... (status: $($currentQueue.agent_progress))" -ForegroundColor Cyan
            } else {
                Write-Host "  [Cycle $waitCycle] Waiting for agent (current status: $($currentQueue.status))..." -ForegroundColor Gray
            }
        }

        Start-Sleep -Seconds $WaitIntervalSeconds
    }

    Write-Host ""
    Write-Host "⏱️ Timeout - agent did not complete within 2 hours" -ForegroundColor Yellow
    Write-Host "   Work queue still available at: $queueFile" -ForegroundColor Yellow
    Write-Host "   Agent can resume by running: npm run yolo:agent" -ForegroundColor Yellow

    return $false
}

# Main execution
$complete = Invoke-AgentCoordinator -Layer $TargetLayer

Write-Host ""
if ($complete) {
    Write-Host "🚀 Ready for next layer!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "⏸️ Waiting for agent to complete work..." -ForegroundColor Yellow
    exit 1
}
