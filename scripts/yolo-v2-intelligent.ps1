# 🧠 YOLO MODE v2.0 - INTELLIGENT DEBUGGING INTEGRATED
# No more fake fixes - only real AI-powered debugging and solutions
# Clarity Cannon integration for autonomous problem-solving

param(
    [int]$MaxCycles = 100,
    [int]$CycleTimeoutMinutes = 120,
    [bool]$EnableAIFixes = $true,
    [bool]$EnableParallel = $false,
    [string]$Mode = "Intelligent"  # Intelligent, Safe, Nuclear
)

$ErrorActionPreference = "Continue"
$RepoRoot = (Get-Location).Path
$CycleCount = 0
$RealFixesApplied = 0
$StartTime = Get-Date

function Write-YOLO {
    param([string]$Message, [string]$Color = "Cyan")
    $timestamp = (Get-Date).ToString('HH:mm:ss')
    Write-Host "[$timestamp] 🧠 $Message" -ForegroundColor $Color
}

function Write-Section {
    param([string]$Title)
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Magenta
    Write-Host " $Title" -ForegroundColor Magenta
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Magenta
    Write-Host ""
}

# ═════════════════════════════════════════════════════════════════
# INTELLIGENT DEBUGGING FUNCTIONS
# ═════════════════════════════════════════════════════════════════

function Invoke-IntelligentIRDebug {
    Write-YOLO "🔍 Running Intelligent IR Debugger..." -Color "Yellow"

    try {
        $output = & node scripts/debug-ir-schema.js 2>&1
        $exitCode = $LASTEXITCODE

        if ($exitCode -eq 0) {
            Write-YOLO "   ✅ IR validation passed after debugging" -Color "Green"
            return @{ Success = $true; Fixed = $true }
        } else {
            # Check if debugger provided actionable insights
            $hasRootCause = $output | Select-String "ROOT CAUSE IDENTIFIED"
            $hasFix = $output | Select-String "FIX STRATEGY"

            if ($hasRootCause -and $hasFix) {
                Write-YOLO "   📋 Root cause identified - review artifacts/debug-ir-*.json" -Color "Cyan"

                # Extract key insights
                $insights = $output | Select-String -Pattern "(LIKELY LOCATION|FIX STRATEGY)" -Context 0,3
                Write-Host ""
                Write-Host "   💡 KEY INSIGHTS:" -ForegroundColor Yellow
                $insights | ForEach-Object { Write-Host "      $_" -ForegroundColor Gray }

                return @{ Success = $false; Fixed = $false; HasInsights = $true; Output = $output }
            } else {
                Write-YOLO "   ⚠️ IR debugger couldn't identify root cause" -Color "Yellow"
                return @{ Success = $false; Fixed = $false; HasInsights = $false }
            }
        }
    } catch {
        Write-YOLO "   ❌ IR debugger failed: $($_.Exception.Message)" -Color "Red"
        return @{ Success = $false; Fixed = $false }
    }
}

function Invoke-IntelligentAutoFix {
    param([string]$Gate, [string]$ErrorOutput)

    Write-YOLO "🤖 Running AI-powered analysis for $Gate..." -Color "Yellow"

    # Check if we have Copilot CLI
    $hasCopilot = $false
    try {
        & gh copilot --help 2>&1 | Out-Null
        $hasCopilot = $true
        Write-YOLO "   Using: GitHub Copilot CLI (gh copilot)" -Color "Cyan"
    } catch {
        try {
            & copilot --version 2>&1 | Out-Null
            $hasCopilot = $true
            Write-YOLO "   Using: Copilot CLI" -Color "Cyan"
        } catch {
            Write-YOLO "   ⚠️ No Copilot CLI found - skipping AI analysis" -Color "Yellow"
            return @{ Success = $false; HasSuggestion = $false }
        }
    }

    if (-not $hasCopilot) {
        return @{ Success = $false; HasSuggestion = $false }
    }

    # Run intelligent-autofix.js if it exists
    if (Test-Path "scripts/intelligent-autofix.js") {
        try {
            $output = & node scripts/intelligent-autofix.js 2>&1
            $exitCode = $LASTEXITCODE

            # Check if suggestions were written
            if (Test-Path "artifacts/ai-fix-suggestions.md") {
                Write-YOLO "   📝 AI suggestions saved to artifacts/ai-fix-suggestions.md" -Color "Green"

                # Show snippet
                $content = Get-Content "artifacts/ai-fix-suggestions.md" -Raw
                $preview = $content.Substring(0, [Math]::Min(500, $content.Length))
                Write-Host ""
                Write-Host "   PREVIEW:" -ForegroundColor Cyan
                Write-Host "   $preview..." -ForegroundColor Gray
                Write-Host ""

                return @{ Success = $true; HasSuggestion = $true; SuggestionsFile = "artifacts/ai-fix-suggestions.md" }
            }
        } catch {
            Write-YOLO "   ⚠️ Autofix tool error: $($_.Exception.Message)" -Color "Yellow"
        }
    }

    return @{ Success = $false; HasSuggestion = $false }
}

function Test-ForRealChanges {
    $status = & git status --porcelain 2>&1

    # Filter out artifact-only changes
    $realChanges = $status | Where-Object {
        $_ -notmatch "artifacts/" -and
        $_ -notmatch "coverage/" -and
        $_ -notmatch "\.json$" -and
        $_ -notmatch "reports/"
    }

    return ($realChanges.Count -gt 0)
}

# ═════════════════════════════════════════════════════════════════
# QUALITY GATES (Same as before but with better diagnostics)
# ═════════════════════════════════════════════════════════════════

function Test-Gate {
    param([string]$Name, [string]$Command, [int]$Timeout = 60)

    Write-YOLO "Testing: $Name" -Color "Yellow"

    $job = Start-Job -ScriptBlock {
        param($cmd)
        & npm run $cmd 2>&1
    } -ArgumentList $Command

    $completed = Wait-Job -Job $job -Timeout $Timeout

    if ($completed) {
        $output = Receive-Job -Job $job
        $exitCode = $job.State -eq 'Completed' ? 0 : 1
        Remove-Job -Job $job -Force

        if ($exitCode -eq 0) {
            Write-Host "  ✅ $Name" -ForegroundColor Green
            return @{ Passed = $true; Output = $output }
        } else {
            Write-Host "  ❌ $Name" -ForegroundColor Red

            # Show last few lines of error
            $errorLines = @($output) | Select-Object -Last 5
            $errorLines | ForEach-Object { Write-Host "     $_" -ForegroundColor Yellow }

            return @{ Passed = $false; Output = $output; Error = ($errorLines -join "`n") }
        }
    } else {
        Remove-Job -Job $job -Force
        Write-Host "  ⏱️ $Name (timeout after ${Timeout}s)" -ForegroundColor Yellow
        return @{ Passed = $false; Output = "Timeout"; Timeout = $true }
    }
}

# ═════════════════════════════════════════════════════════════════
# INTELLIGENT FIX CYCLE
# ═════════════════════════════════════════════════════════════════

function Invoke-IntelligentFixCycle {
    $script:CycleCount++
    $cycleStart = Get-Date

    Write-Section "CYCLE $($script:CycleCount) / $MaxCycles - Intelligent Debugging Mode"

    # Run all gates
    $results = @{}
    $results.harness = Test-Gate "Harness" "harness" 30
    $results.irValidation = Test-Gate "IR Validation" "ir:validate:all" 30
    $results.parity = Test-Gate "Parity" "test:parity" 45
    $results.determinism = Test-Gate "Determinism" "test:determinism" 30

    # Count passes/failures
    $passed = ($results.Values | Where-Object { $_.Passed }).Count
    $failed = ($results.Values | Where-Object { -not $_.Passed }).Count

    Write-Host ""
    Write-Host "RESULTS: ✅ $passed passed | ❌ $failed failed" -ForegroundColor Cyan
    Write-Host ""

    # All passed = SUCCESS!
    if ($failed -eq 0) {
        Write-YOLO "🎉 ALL GATES PASSED! MISSION ACCOMPLISHED!" -Color "Green"
        return @{ Success = $true; AllPassed = $true }
    }

    # Intelligent debugging phase
    if ($EnableAIFixes) {
        Write-Section "INTELLIGENT DEBUGGING PHASE"

        $fixesAttempted = $false
        $fixesSucceeded = $false

        # Check each failure and apply intelligent debugging
        foreach ($gate in $results.Keys) {
            if (-not $results[$gate].Passed) {
                Write-YOLO "Analyzing failure: $gate" -Color "Magenta"

                # Special handling for IR validation
                if ($gate -eq "irValidation") {
                    $debugResult = Invoke-IntelligentIRDebug

                    if ($debugResult.Fixed) {
                        Write-YOLO "   ✨ IR issue auto-fixed by intelligent debugger!" -Color "Green"
                        $fixesSucceeded = $true
                        $script:RealFixesApplied++
                    } elseif ($debugResult.HasInsights) {
                        Write-YOLO "   📋 Manual fix needed - insights provided" -Color "Yellow"
                        Write-Host ""
                        Write-Host "   ⏸️  PAUSING: Review artifacts/debug-ir-full.json" -ForegroundColor Yellow
                        Write-Host "   Then apply suggested fix and re-run" -ForegroundColor Yellow
                        return @{ Success = $false; NeedsManualFix = $true; Gate = $gate }
                    }

                    $fixesAttempted = $true
                }
                # For other gates, use AI autofix
                else {
                    $aiResult = Invoke-IntelligentAutoFix -Gate $gate -ErrorOutput $results[$gate].Error

                    if ($aiResult.HasSuggestion) {
                        Write-YOLO "   📋 AI suggestions available" -Color "Yellow"
                        Write-Host ""
                        Write-Host "   ⏸️  PAUSING: Review $($aiResult.SuggestionsFile)" -ForegroundColor Yellow
                        Write-Host "   Then apply suggested fixes and re-run" -ForegroundColor Yellow
                        return @{ Success = $false; NeedsManualFix = $true; Gate = $gate }
                    }

                    $fixesAttempted = $true
                }
            }
        }

        # If we attempted fixes, check if anything actually changed
        if ($fixesAttempted) {
            $hasRealChanges = Test-ForRealChanges

            if ($hasRealChanges) {
                Write-YOLO "🔍 Real code changes detected - committing..." -Color "Green"

                & git add -A 2>&1 | Out-Null
                & git commit -m "🧠 YOLO-v2 Cycle $($script:CycleCount): Intelligent fixes applied" 2>&1 | Out-Null

                if ($fixesSucceeded) {
                    Write-YOLO "   ✅ Fixes committed successfully" -Color "Green"
                    $script:RealFixesApplied++
                }
            } else {
                Write-YOLO "   ⚠️ No real code changes - skipping commit" -Color "Yellow"
            }
        }
    }

    # Check if we should continue
    $elapsed = (Get-Date) - $StartTime
    if ($elapsed.TotalMinutes -gt $CycleTimeoutMinutes) {
        Write-YOLO "⏱️ Timeout reached (${CycleTimeoutMinutes} minutes)" -Color "Yellow"
        return @{ Success = $false; Timeout = $true }
    }

    if ($script:CycleCount -ge $MaxCycles) {
        Write-YOLO "🔄 Max cycles reached ($MaxCycles)" -Color "Yellow"
        return @{ Success = $false; MaxCycles = $true }
    }

    # Continue to next cycle
    Start-Sleep -Seconds 5
    return Invoke-IntelligentFixCycle
}

# ═════════════════════════════════════════════════════════════════
# MAIN EXECUTION
# ═════════════════════════════════════════════════════════════════

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   🧠 YOLO v2.0 - INTELLIGENT DEBUGGING MODE                      ║" -ForegroundColor Cyan
Write-Host "║   Real fixes only. AI-powered. Built-in debugging.              ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "Configuration:" -ForegroundColor Cyan
Write-Host "  Max Cycles: $MaxCycles" -ForegroundColor White
Write-Host "  Timeout: $CycleTimeoutMinutes minutes" -ForegroundColor White
Write-Host "  AI Fixes: $(if ($EnableAIFixes) { '✅ Enabled' } else { '❌ Disabled' })" -ForegroundColor White
Write-Host "  Mode: $Mode" -ForegroundColor White
Write-Host ""

if ($EnableAIFixes) {
    Write-YOLO "Checking AI tools availability..." -Color "Cyan"

    # Check for debug tools
    $hasDebugger = Test-Path "scripts/debug-ir-schema.js"
    $hasAutofix = Test-Path "scripts/intelligent-autofix.js"

    Write-Host "  debug-ir-schema.js: $(if ($hasDebugger) { '✅' } else { '❌ Missing' })" -ForegroundColor $(if ($hasDebugger) { 'Green' } else { 'Red' })
    Write-Host "  intelligent-autofix.js: $(if ($hasAutofix) { '✅' } else { '❌ Missing' })" -ForegroundColor $(if ($hasAutofix) { 'Green' } else { 'Red' })

    if (-not $hasDebugger -or -not $hasAutofix) {
        Write-YOLO "⚠️ Warning: Some debugging tools missing - reduced functionality" -Color "Yellow"
    }
    Write-Host ""
}

try {
    $result = Invoke-IntelligentFixCycle

    Write-Section "YOLO v2.0 SESSION COMPLETE"

    Write-Host "  Cycles Run: $($script:CycleCount)" -ForegroundColor Cyan
    Write-Host "  Real Fixes Applied: $($script:RealFixesApplied)" -ForegroundColor Cyan
    Write-Host "  Total Time: $((Get-Date) - $StartTime)" -ForegroundColor Cyan

    if ($result.AllPassed) {
        Write-Host "  Final Status: ✅ ALL GATES PASSING" -ForegroundColor Green
        exit 0
    } elseif ($result.NeedsManualFix) {
        Write-Host "  Final Status: ⏸️  PAUSED - Manual fix needed for $($result.Gate)" -ForegroundColor Yellow
        exit 2
    } else {
        Write-Host "  Final Status: ⚠️  INCOMPLETE" -ForegroundColor Yellow
        exit 1
    }

} catch {
    Write-YOLO "💥 FATAL ERROR: $($_.Exception.Message)" -Color "Red"
    Write-Host $_.ScriptStackTrace -ForegroundColor Red
    exit 1
}
