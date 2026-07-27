#!/usr/bin/env pwsh

# 🤖 LUASCRIPT Automation Command Reference
# Quick commands for managing the autonomous pipeline

# ============================================================================
# 📊 DASHBOARD - Check Status
# ============================================================================

function Watch-PRs {
    Write-Host "📊 LUASCRIPT PR Dashboard`n" -ForegroundColor Cyan
    gh pr list --repo ssdajoker/LUASCRIPT --json number,title,isDraft,state | 
        ConvertFrom-Json | 
        Format-Table -Property @{Name='#';Expression={$_.number}}, title, isDraft, state -AutoSize
}

function Watch-Workflows {
    Write-Host "🔄 Recent Workflow Runs`n" -ForegroundColor Cyan
    gh run list --repo ssdajoker/LUASCRIPT --limit 5 --json name,status,conclusion,updatedAt | 
        ConvertFrom-Json | 
        Format-Table -AutoSize
}

function Watch-CurrentPR {
    param([int]$PR = 167)
    Write-Host "📋 PR #$PR Status`n" -ForegroundColor Cyan
    gh pr view $PR --repo ssdajoker/LUASCRIPT
}

# ============================================================================
# 🚀 QUICK ACTIONS - Trigger Workflows
# ============================================================================

function Ready-PR {
    param([int]$PR = 167)
    gh pr ready $PR --repo ssdajoker/LUASCRIPT
    Write-Host "✅ PR #$PR marked ready" -ForegroundColor Green
}

function Label-ForReview {
    param([int]$PR = 167)
    gh pr edit $PR --add-label "ready-for-review" --repo ssdajoker/LUASCRIPT
    Write-Host "✅ Label added to PR #$PR" -ForegroundColor Green
}

function Open-PR {
    param([int]$PR = 167)
    gh pr view $PR --repo ssdajoker/LUASCRIPT --web
    Write-Host "🌐 Opening PR #$PR in browser..." -ForegroundColor Cyan
}

# ============================================================================
# 📝 GIT WORKFLOW - Commit and Push
# ============================================================================

function Commit-Changes {
    param(
        [string]$Message = "feat: implement new features",
        [string]$Branch = "codex/fix-134"
    )
    
    git add -A
    git commit -m $Message
    git push origin $Branch
    
    Write-Host "✅ Changes committed and pushed to $Branch" -ForegroundColor Green
    Write-Host "💡 Next: Run Ready-PR to trigger automation" -ForegroundColor Cyan
}

function Create-Feature-Branch {
    param([string]$Feature)
    
    git checkout main
    git pull origin main
    git checkout -b "feature/$Feature"
    
    Write-Host "✅ Feature branch created: feature/$Feature" -ForegroundColor Green
}

# ============================================================================
# 🔀 WORKTREES - Parallel Development
# ============================================================================

function New-Worktree {
    param(
        [string]$Name,
        [string]$Branch
    )
    
    git worktree add ..\$Name $Branch
    Write-Host "✅ Worktree created: ..\$Name ($Branch)" -ForegroundColor Green
    Write-Host "📂 cd ..\$Name  # to switch to it" -ForegroundColor Cyan
}

function List-Worktrees {
    Write-Host "📂 Available Worktrees`n" -ForegroundColor Cyan
    git worktree list
}

function Remove-Worktree {
    param([string]$Name)
    
    git worktree remove ..\$Name
    Write-Host "✅ Worktree removed: $Name" -ForegroundColor Green
}

# ============================================================================
# 🧪 TESTING - Run Tests Locally
# ============================================================================

function Test-Roadmap {
    npm run test:roadmap
}

function Test-Determinism {
    npm run test:determinism:stress
}

function Test-EdgeCases {
    npm run test:edge:gaps
}

function Test-CI-Gates {
    npm run ci:gates
}

function Test-All {
    Write-Host "🧪 Running all tests..." -ForegroundColor Cyan
    Test-Roadmap
    Test-Determinism
    Test-EdgeCases
    Test-CI-Gates
}

# ============================================================================
# 🔍 DEBUG - Investigate Issues
# ============================================================================

function Check-Workflow-Logs {
    param([int]$RunID)
    
    if (-not $RunID) {
        Write-Host "Getting latest run..." -ForegroundColor Yellow
        $RunID = (gh run list --repo ssdajoker/LUASCRIPT --limit 1 --json number | 
            ConvertFrom-Json | 
            Select-Object -ExpandProperty number)
    }
    
    gh run view $RunID --repo ssdajoker/LUASCRIPT --log
}

function Check-PR-Comments {
    param([int]$PR = 167)
    
    gh pr view $PR --repo ssdajoker/LUASCRIPT --json comments --jq '.comments | .[] | .body'
}

function Check-Status-Checks {
    param([int]$PR = 167)
    
    gh pr view $PR --repo ssdajoker/LUASCRIPT --json statusCheckRollup
}

# ============================================================================
# 📚 HELP
# ============================================================================

function Show-Help {
    Write-Host @"
╔═══════════════════════════════════════════════════════════════╗
║       LUASCRIPT Autonomous Automation Command Reference        ║
╚═══════════════════════════════════════════════════════════════╝

📊 DASHBOARD
────────────
  Watch-PRs ..................... List all PRs
  Watch-Workflows ............... Show recent workflow runs
  Watch-CurrentPR ............... Check specific PR status

🚀 QUICK ACTIONS
────────────────
  Ready-PR [num] ................ Mark PR ready for review
  Label-ForReview [num] ......... Add ready-for-review label
  Open-PR [num] ................. Open PR in browser

📝 GIT WORKFLOW
───────────────
  Commit-Changes [msg] [branch].. Commit and push changes
  Create-Feature-Branch [name] .. Create new feature branch

🔀 WORKTREES (Parallel Development)
─────────────────────────────────
  List-Worktrees ................ Show all worktrees
  New-Worktree [name] [branch] .. Create new worktree
  Remove-Worktree [name] ........ Delete worktree

🧪 TESTING
──────────
  Test-Roadmap .................. Run roadmap tests
  Test-Determinism .............. Run determinism tests
  Test-EdgeCases ................ Run edge-case tests
  Test-CI-Gates ................. Run all CI gates
  Test-All ...................... Run everything

🔍 DEBUG
────────
  Check-Workflow-Logs [id] ...... Show workflow logs
  Check-PR-Comments [num] ....... Show PR comments
  Check-Status-Checks [num] ..... Show status checks

💡 EXAMPLES
──────────
  # Create and test a feature
  Create-Feature-Branch my-feature
  # ... make changes ...
  Commit-Changes "feat: add my-feature" "feature/my-feature"
  Ready-PR
  Label-ForReview
  Open-PR

  # Work on multiple branches
  New-Worktree luascript-main main
  New-Worktree luascript-dev codex/fix-133
  
  # Check automation progress
  Watch-PRs
  Watch-Workflows
  Open-PR 167

"@ -ForegroundColor Cyan
}

# ============================================================================
# QUICK START
# ============================================================================

# Show help on load
Write-Host "✅ Automation commands loaded! Type 'Show-Help' for reference" -ForegroundColor Green

# Export functions
Export-ModuleMember -Function @(
    'Watch-PRs', 'Watch-Workflows', 'Watch-CurrentPR',
    'Ready-PR', 'Label-ForReview', 'Open-PR',
    'Commit-Changes', 'Create-Feature-Branch',
    'New-Worktree', 'List-Worktrees', 'Remove-Worktree',
    'Test-Roadmap', 'Test-Determinism', 'Test-EdgeCases', 'Test-CI-Gates', 'Test-All',
    'Check-Workflow-Logs', 'Check-PR-Comments', 'Check-Status-Checks',
    'Show-Help'
)
