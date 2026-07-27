/**
 * Codex Work Consumer
 * 
 * Polls GitHub for work items (Issues/PRs with codex-work label),
 * claims tasks, implements fixes locally, and pushes to GitHub.
 * 
 * State persisted in .codex/state.json for crash recovery.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const YAML = require('yaml');

const CONFIG_PATH = '.codex/config.yaml';
const STATE_PATH = '.codex/state.json';
const LOG_PATH = '.codex/codex.log';

let config = {};
let state = { last_work_id: null, status: 'idle', current_work: null };

// ========== Initialization ==========

function loadConfig() {
  try {
    const content = fs.readFileSync(CONFIG_PATH, 'utf8');
    config = YAML.parse(content);
    log('INFO', 'Config loaded from .codex/config.yaml');
  } catch (err) {
    log('ERROR', `Failed to load config: ${err.message}`);
    config = getDefaultConfig();
  }
}

function getDefaultConfig() {
  return {
    codex_mode: 'enabled',
    local: { max_retries: 3, timeout_ms: 30000 },
    github: { poll_interval_ms: 5000, poll_timeout_ms: 60000 },
    artifacts: { directory: 'artifacts' },
    logging: { level: 'INFO', telemetry_enabled: true },
    coordination: { max_concurrent_tasks: 1 }
  };
}

function loadState() {
  try {
    if (fs.existsSync(STATE_PATH)) {
      const content = fs.readFileSync(STATE_PATH, 'utf8');
      state = JSON.parse(content);
      log('INFO', `State loaded: status=${state.status}, last_work=${state.last_work_id}`);
    }
  } catch (err) {
    log('WARN', `Could not load state: ${err.message}, starting fresh`);
    state = { last_work_id: null, status: 'idle', current_work: null };
  }
}

function saveState() {
  try {
    fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
  } catch (err) {
    log('ERROR', `Failed to save state: ${err.message}`);
  }
}

function log(level, message) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${level}: ${message}`;
  console.log(logEntry);

  if (config.logging?.telemetry_enabled) {
    try {
      fs.appendFileSync(LOG_PATH, logEntry + '\n');
    } catch (err) {
      // Silently fail if can't log
    }
  }
}

function logNuclearFailure(stage, error) {
  const explosion = `

╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║   ██████╗ ██████╗ ██████╗ ███████╗██╗  ██╗    ███████╗ █████╗ ██╗██╗     ║
║  ██╔════╝██╔═══██╗██╔══██╗██╔════╝╚██╗██╔╝    ██╔════╝██╔══██╗██║██║     ║
║  ██║     ██║   ██║██║  ██║█████╗   ╚███╔╝     █████╗  ███████║██║██║     ║
║  ██║     ██║   ██║██║  ██║██╔══╝   ██╔██╗     ██╔══╝  ██╔══██║██║██║     ║
║  ╚██████╗╚██████╔╝██████╔╝███████╗██╔╝ ██╗    ██║     ██║  ██║██║███████╗║
║   ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝    ╚═╝     ╚═╝  ╚═╝╚═╝╚══════╝║
║                                                                           ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║                        ⚠️  CRITICAL FAILURE  ⚠️                            ║
║                                                                           ║
║                                ☢️ ☢️ ☢️                                     ║
║                           ███████████████                                 ║
║                        ████░░░░░░░░░░░░░████                             ║
║                      ███░░░░░░░░░░░░░░░░░░░███                           ║
║                    ███░░░░████████████░░░░░░░███                         ║
║                   ██░░░░██████████████████░░░░░██                        ║
║                  ██░░░████████████████████████░░░██                      ║
║                 ██░░░████████████████████████████░░░██                   ║
║                ██░░░████████████████████████████████░░░██                ║
║                █░░░████████████████████████████████████░░░█              ║
║               ██░░░████████████████████████████████████░░░██             ║
║               █░░░████████████████████████████████████████░░█            ║
║               █░░░████████████████████████████████████████░░█            ║
║               █░░░████████████████████████████████████████░░█            ║
║               ██░░░████████████████████████████████████░░░██             ║
║                █░░░░████████████████████████████████░░░░░█               ║
║                ██░░░░████████████████████████████░░░░░░██                ║
║                 ██░░░░░████████████████████░░░░░░░██                     ║
║                  ███░░░░░░████████░░░░░░░░░███                           ║
║                    ███░░░░░░░░░░░░░░░░███                                ║
║                       ████░░░░░░░████                                    ║
║                          ██████████                                      ║
║                                                                           ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  FAILURE STAGE: ${stage.padEnd(56)} ║
║                                                                           ║
║  ERROR DETAILS:                                                          ║`;

  console.error(explosion);
  
  // Split error message into lines and pad them
  const errorLines = error.toString().split('\n').slice(0, 10);
  errorLines.forEach(line => {
    const paddedLine = '║  ' + line.substring(0, 73).padEnd(75) + '║';
    console.error(paddedLine);
  });
  
  const footer = `║                                                                           ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  ⚠️  IMMEDIATE ACTION REQUIRED  ⚠️                                        ║
║                                                                           ║
║  1. Check the error details above                                        ║
║  2. Review .codex/codex.log for full context                             ║
║  3. Fix the issue and restart Codex manually                             ║
║  4. DO NOT auto-restart - manual intervention required                   ║
║                                                                           ║
║                        ☢️  CODEX HALTED  ☢️                                ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝

`;
  
  console.error(footer);
  
  // Also log to file
  try {
    fs.appendFileSync(LOG_PATH, explosion + '\n');
    errorLines.forEach(line => {
      fs.appendFileSync(LOG_PATH, '║  ' + line + '\n');
    });
    fs.appendFileSync(LOG_PATH, footer + '\n');
  } catch (err) {
    // Ignore log write errors
  }
}

// ========== GitHub Integration ==========

function pollGitHubForWork() {
  log('INFO', 'Polling GitHub for work items...');
  
  try {
    // Use gh cli REST API instead of GraphQL for better Windows compatibility
    const result = execSync('gh issue list --label "codex-work" --state open --json number,title,body,labels,createdAt --limit 10', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });

    const issues = JSON.parse(result);

    if (issues.length === 0) {
      log('INFO', 'No pending work items found');
      return null;
    }

    log('INFO', `Found ${issues.length} work item(s)`);

    // Find highest priority (high > medium > low)
    const workItem = issues
      .map(issue => ({
        github_id: issue.number.toString(),
        issue_number: issue.number,
        title: issue.title,
        body: issue.body || '',
        labels: issue.labels.map(l => l.name),
        created_at: issue.createdAt,
        priority: issue.labels.some(l => l.name === 'priority:high') ? 'high'
          : issue.labels.some(l => l.name === 'priority:medium') ? 'medium'
          : 'low',
        repo: 'ssdajoker/LUASCRIPT'
      }))
      .sort((a, b) => {
        const priority_map = { high: 3, medium: 2, low: 1 };
        return priority_map[b.priority] - priority_map[a.priority];
      })[0];

    if (workItem) {
      log('INFO', `Selected task #${workItem.issue_number} (${workItem.priority}): ${workItem.title}`);
      return workItem;
    }
  } catch (err) {
    log('ERROR', `Failed to poll GitHub: ${err.message}`);
    recordTelemetry('github_poll_error', { error: err.message });
  }

  return null;
}

function claimWorkItem(workItem) {
  log('INFO', `Claiming work item #${workItem.issue_number}...`);

  try {
    // Add 'claimed-by-codex' label
    execSync(`gh issue edit ${workItem.issue_number} --add-label "claimed-by-codex"`, {
      stdio: 'ignore'
    });

    // Post comment
    const comment = `🤖 **Codex claimed this task** at ${new Date().toISOString()}

Starting implementation...

\`\`\`
- Branch: codex/fix-${workItem.issue_number}
- Status: in-progress
\`\`\``;

    execSync(`gh issue comment ${workItem.issue_number} --body "${comment.replace(/"/g, '\\"')}"`, {
      stdio: 'ignore'
    });

    log('INFO', `Claimed #${workItem.issue_number}`);
    return true;
  } catch (err) {
    log('ERROR', `Failed to claim work item: ${err.message}`);
    return false;
  }
}

// ========== Local Implementation ==========

function createFeatureBranch(workItem) {
  const branchName = `codex/fix-${workItem.issue_number}`;
  
  try {
    // Check if branch exists
    try {
      execSync(`git rev-parse --verify ${branchName}`, { stdio: 'ignore' });
      // Branch exists, check it out
      execSync(`git checkout ${branchName}`, { stdio: 'ignore' });
      log('INFO', `Checked out existing branch: ${branchName}`);
    } catch {
      // Branch doesn't exist, create it
      execSync(`git checkout -b ${branchName}`, { stdio: 'ignore' });
      log('INFO', `Created new branch: ${branchName}`);
    }
    return branchName;
  } catch (err) {
    log('ERROR', `Failed to create/checkout branch: ${err.message}`);
    recordTelemetry('branch_creation_error', { error: err.message });
    return null;
  }
}

function updateState(workItem, branch) {
  state.status = 'in_progress';
  state.last_work_id = `work_github_${workItem.issue_number}`;
  state.current_work = {
    id: state.last_work_id,
    issue_number: workItem.issue_number,
    title: workItem.title,
    body: workItem.body,
    local_branch: branch,
    claimed_at: new Date().toISOString(),
    implementation_started: false,
    harness_result: null,
    ir_validation: null,
    ready_to_merge: false
  };
  saveState();
  log('INFO', `State updated for #${workItem.issue_number}`);
}

function waitForLocalImplementation() {
  const SIGNAL_FILE = '.codex/signal.txt';
  const CHECK_INTERVAL = 1000; // Check every 1 second
  
  // Clear any existing signal
  if (fs.existsSync(SIGNAL_FILE)) {
    fs.unlinkSync(SIGNAL_FILE);
  }
  
  log('INFO', '⏳ Waiting for implementation in VS Code...');
  log('INFO', '');
  log('INFO', '╔════════════════════════════════════════════════════════════════╗');
  log('INFO', '║                   CODEX AWAITING SIGNAL                        ║');
  log('INFO', '╠════════════════════════════════════════════════════════════════╣');
  log('INFO', '║  When ready to validate:                                       ║');
  log('INFO', '║                                                                ║');
  log('INFO', '║  Option 1: Run this command:                                   ║');
  log('INFO', '║    echo done > .codex/signal.txt                               ║');
  log('INFO', '║                                                                ║');
  log('INFO', '║  Option 2: Run this command:                                   ║');
  log('INFO', '║    npm run codex:done                                          ║');
  log('INFO', '║                                                                ║');
  log('INFO', '║  To cancel:                                                    ║');
  log('INFO', '║    echo cancel > .codex/signal.txt                             ║');
  log('INFO', '║    npm run codex:cancel                                        ║');
  log('INFO', '╚════════════════════════════════════════════════════════════════╝');
  log('INFO', '');

  return new Promise(resolve => {
    const checkSignal = () => {
      if (fs.existsSync(SIGNAL_FILE)) {
        try {
          const signal = fs.readFileSync(SIGNAL_FILE, 'utf8').trim().toLowerCase();
          fs.unlinkSync(SIGNAL_FILE); // Clean up signal file
          
          if (signal === 'done') {
            log('INFO', '✅ Implementation complete signal received');
            resolve(true);
          } else if (signal === 'cancel') {
            log('INFO', '❌ Work cancelled by user');
            resolve(false);
          } else {
            log('WARN', `Unknown signal: ${signal}`);
            setTimeout(checkSignal, CHECK_INTERVAL);
          }
        } catch (err) {
          log('ERROR', `Failed to read signal file: ${err.message}`);
          setTimeout(checkSignal, CHECK_INTERVAL);
        }
      } else {
        setTimeout(checkSignal, CHECK_INTERVAL);
      }
    };
    
    checkSignal();
  });
}

// ========== Validation ==========

function validateLocally() {
  log('INFO', 'Running local validation (harness, IR, parity)...');

  const results = {
    harness: null,
    ir_validation: null,
    parity: null,
    all_passed: false
  };

  try {
    // Run harness
    log('INFO', 'Running npm run harness...');
    try {
      execSync('npm run harness', { stdio: 'pipe', timeout: 60000 });
      results.harness = 'PASS';
      log('INFO', '✅ Harness passed');
    } catch (err) {
      results.harness = 'FAIL';
      log('WARN', `❌ Harness failed: ${err.message.split('\n')[0]}`);
      recordTelemetry('harness_failure', { error: err.message.substring(0, 200) });
    }

    // Run IR validation
    log('INFO', 'Running npm run ir:validate:all...');
    try {
      execSync('npm run ir:validate:all', { stdio: 'pipe', timeout: 30000 });
      results.ir_validation = 'PASS';
      log('INFO', '✅ IR validation passed');
    } catch (err) {
      results.ir_validation = 'FAIL';
      log('WARN', `❌ IR validation failed`);
      recordTelemetry('ir_validation_failure', { error: err.message.substring(0, 200) });
    }

    // Run parity
    log('INFO', 'Running npm run test:parity...');
    try {
      execSync('npm run test:parity', { stdio: 'pipe', timeout: 60000 });
      results.parity = 'PASS';
      log('INFO', '✅ Parity tests passed');
    } catch (err) {
      results.parity = 'FAIL';
      log('WARN', `❌ Parity tests failed`);
      recordTelemetry('parity_failure', { error: err.message.substring(0, 200) });
    }

    results.all_passed = results.harness === 'PASS' 
      && results.ir_validation === 'PASS' 
      && results.parity === 'PASS';

    if (results.all_passed) {
      log('INFO', '✅ All validations PASSED');
    } else {
      log('WARN', '⚠️ Some validations failed');
    }
  } catch (err) {
    log('ERROR', `Validation failed with exception: ${err.message}`);
    recordTelemetry('validation_exception', { error: err.message });
  }

  return results;
}

// ========== Push & Trigger ==========

function pushToGitHub(workItem, branch, validationResults) {
  if (!validationResults.all_passed) {
    log('WARN', 'Not pushing: validation failed');
    return false;
  }

  log('INFO', `Pushing ${branch} to GitHub...`);

  try {
    execSync(`git add -A`, { stdio: 'ignore' });
    execSync(`git commit -m "fix(#${workItem.issue_number}): ${workItem.title}"`, {
      stdio: 'ignore'
    });
    execSync(`git push origin ${branch}`, { stdio: 'pipe', timeout: 30000 });
    log('INFO', `✅ Pushed to origin/${branch}`);

    // Update state
    state.current_work.pushed_at = new Date().toISOString();
    state.current_work.ready_to_merge = true;
    saveState();

    // Post success comment to GitHub
    const successComment = `✅ **Codex implementation complete**

- Branch: \`${branch}\`
- Harness: ${validationResults.harness}
- IR Validation: ${validationResults.ir_validation}
- Parity: ${validationResults.parity}
- Status: ✅ Ready for review (Gemini agent)

GitHub Actions will now validate the push. Once tests pass, Gemini review agent will approve and merge.`;

    execSync(`gh issue comment ${workItem.issue_number} --body "${successComment.replace(/"/g, '\\"')}"`, {
      stdio: 'ignore'
    });

    recordTelemetry('successful_push', { work_item: workItem.issue_number });
    return true;
  } catch (err) {
    log('ERROR', `Failed to push: ${err.message}`);
    recordTelemetry('push_failure', { error: err.message.substring(0, 200) });

    // Post failure comment
    const failureComment = `❌ **Codex push failed**

Error: ${err.message.substring(0, 100)}

Escalating to Gemini GitHub agent for review.`;

    try {
      execSync(`gh issue comment ${workItem.issue_number} --body "${failureComment.replace(/"/g, '\\"')}"`, {
        stdio: 'ignore'
      });
    } catch (e) {
      // Silently fail
    }

    return false;
  }
}

function recordTelemetry(event, data) {
  if (!config.logging?.telemetry_enabled) return;

  const telemetry = {
    timestamp: new Date().toISOString(),
    event,
    data,
    agent: 'codex'
  };

  try {
    const telemetryFile = '.codex/telemetry.jsonl';
    fs.appendFileSync(telemetryFile, JSON.stringify(telemetry) + '\n');
  } catch (err) {
    // Silently fail
  }
}

// ========== Error Recovery ==========

function handleTimeout() {
  log('ERROR', 'Codex operation timed out!');
  recordTelemetry('timeout', { state: state.current_work });

  if (config.codex?.fallback_to_copilot) {
    log('INFO', 'Fallback enabled: Copilot will continue locally');
    postEscalationToGitHub('timeout', state.current_work);
  } else {
    log('WARN', 'Fallback disabled: Manual intervention required');
  }
}

function postEscalationToGitHub(reason, work) {
  if (!work?.issue_number) return;

  const escalationMessage = `⚠️ **Codex escalation: ${reason}**

Work item: ${work.title}
Branch: ${work.local_branch}
Last state: ${JSON.stringify(work, null, 2)}

**Fallback**: Gemini GitHub agent or Copilot will take over.`;

  try {
    execSync(`gh issue comment ${work.issue_number} --body "${escalationMessage.replace(/"/g, '\\"')}"`, {
      stdio: 'ignore'
    });
  } catch (err) {
    log('WARN', `Could not post escalation to GitHub: ${err.message}`);
  }
}

// ========== Main Loop ==========

async function runCycle() {
  loadConfig();
  loadState();

  try {
    // 1. Check if already working on something
    if (state.status === 'in_progress' && state.current_work) {
      log('INFO', `Resuming work on #${state.current_work.issue_number}...`);
      const ready = await waitForLocalImplementation();
      if (!ready) {
        log('INFO', 'Work cancelled by user');
        state.status = 'idle';
        state.current_work = null;
        saveState();
        return;
      }
    } else {
      // 2. Poll for new work
      const workItem = pollGitHubForWork();
      if (!workItem) {
        log('INFO', 'No work available. Sleeping...');
        return;
      }

      // 3. Claim and set up work
      claimWorkItem(workItem);
      const branch = createFeatureBranch(workItem);
      if (!branch) {
        logNuclearFailure('BRANCH CREATION', new Error('Failed to create feature branch'));
        state.status = 'idle';
        saveState();
        return;
      }
      updateStateForNewWork(workItem, branch);

      // 4. Wait for implementation
      const ready = await waitForLocalImplementation();
      if (!ready) {
        log('INFO', 'Work cancelled by user');
        state.status = 'idle';
        state.current_work = null;
        saveState();
        return;
      }
    }

    // 5. Validate locally
    const validationResults = validateLocally();
    if (!validationResults.all_passed) {
      logNuclearFailure('VALIDATION', new Error('Local validation failed: ' + JSON.stringify(validationResults, null, 2)));
      state.status = 'idle';
      state.current_work = null;
      saveState();
      return;
    }

    // 6. Push to GitHub
    pushToGitHub();
    log('INFO', '✅ Codex cycle complete. PR created successfully!');

    // Reset state
    state.status = 'idle';
    state.current_work = null;
    saveState();

  } catch (err) {
    logNuclearFailure('RUNTIME ERROR', err);
    log('ERROR', `Codex cycle failed: ${err.message}`);
    state.status = 'idle';
    state.current_work = null;
    saveState();
  }
}
// ========== Execution ==========

if (require.main === module) {
  const oneShot = process.env.CODEX_ONE_SHOT === '1';
  
  if (oneShot) {
    log('INFO', 'Running in one-shot mode');
    runCycle().catch(err => {
      log('ERROR', `Fatal error: ${err.message}`);
      process.exit(1);
    });
  } else {
    log('INFO', 'Running in continuous polling mode');
    const interval = config.local?.timeout_ms || 5000;
    setInterval(() => {
      runCycle().catch(err => {
        log('ERROR', `Cycle error: ${err.message}`);
      });
    }, interval);
  }
}

module.exports = { runCycle, loadConfig, loadState, pollGitHubForWork };
