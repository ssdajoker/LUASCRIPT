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

// ========== GitHub Integration ==========

function pollGitHubForWork() {
  log('INFO', 'Polling GitHub for work items...');
  
  try {
    // Use gh cli to query GitHub GraphQL
    const query = `
      query {
        search(query: "label:codex-work state:open", type: ISSUE, first: 10) {
          edges {
            node {
              ... on Issue {
                id
                number
                title
                body
                labels(first: 5) { nodes { name } }
                createdAt
                repository { nameWithOwner }
              }
              ... on PullRequest {
                id
                number
                title
                body
                labels(first: 5) { nodes { name } }
                createdAt
                repository { nameWithOwner }
              }
            }
          }
        }
      }
    `;

    const result = execSync(`gh api graphql -f query='${query}'`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore']
    });

    const data = JSON.parse(result);
    const issues = data.data?.search?.edges || [];

    if (issues.length === 0) {
      log('INFO', 'No pending work items found');
      return null;
    }

    log('INFO', `Found ${issues.length} work item(s)`);

    // Find highest priority (high > medium > low)
    const workItem = issues
      .map(e => ({
        github_id: e.node.id,
        issue_number: e.node.number,
        title: e.node.title,
        body: e.node.body,
        labels: e.node.labels.nodes.map(l => l.name),
        created_at: e.node.createdAt,
        priority: e.node.labels.nodes.some(l => l.name === 'priority:high') ? 'high'
          : e.node.labels.nodes.some(l => l.name === 'priority:medium') ? 'medium'
          : 'low',
        repo: e.node.repository.nameWithOwner
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
    execSync(`git checkout -b ${branchName} 2>/dev/null || git checkout ${branchName}`, {
      stdio: 'ignore'
    });
    log('INFO', `Created/checked out branch: ${branchName}`);
    return branchName;
  } catch (err) {
    log('ERROR', `Failed to create branch: ${err.message}`);
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
  log('INFO', 'Waiting for implementation in VS Code...');
  log('INFO', 'When ready: save files, run tests, and type "done" + Enter');

  // Simple stdin for manual completion signal
  const { createInterface } = require('readline');
  const rl = createInterface({ input: process.stdin, output: process.stdout });

  return new Promise(resolve => {
    rl.question('Ready to validate? (done/cancel): ', answer => {
      rl.close();
      resolve(answer.toLowerCase() === 'done');
    });
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
        return;
      }
    } else {
      // 2. Poll for new work
      const workItem = pollGitHubForWork();
      if (!workItem) {
        log('INFO', 'No work available. Sleeping...');
        return;
      }

      // 3. Claim work
      if (!claimWorkItem(workItem)) {
        log('WARN', 'Failed to claim work item');
        return;
      }

      // 4. Create feature branch
      const branch = createFeatureBranch(workItem);
      if (!branch) {
        return;
      }

      // 5. Update state
      updateState(workItem, branch);

      // 6. Wait for implementation
      const ready = await waitForLocalImplementation();
      if (!ready) {
        log('INFO', 'Work cancelled by user');
        state.status = 'idle';
        saveState();
        return;
      }
    }

    // 7. Validate locally
    const validationResults = validateLocally();
    state.current_work.harness_result = validationResults.harness;
    state.current_work.ir_validation = validationResults.ir_validation;
    state.current_work.parity = validationResults.parity;
    saveState();

    // 8. Push to GitHub (if all pass)
    if (validationResults.all_passed) {
      pushToGitHub(state.current_work, state.current_work.local_branch, validationResults);
    } else {
      log('WARN', 'Skipping push: validation failed');
      recordTelemetry('validation_failed_no_push', { work: state.current_work.issue_number });
    }

    // 9. Complete cycle
    state.status = 'idle';
    state.current_work = null;
    saveState();
    log('INFO', 'Codex cycle complete');
  } catch (err) {
    log('ERROR', `Unexpected error in cycle: ${err.message}`);
    recordTelemetry('cycle_error', { error: err.message });
    handleTimeout();
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
