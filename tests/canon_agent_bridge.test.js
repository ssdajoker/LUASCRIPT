const assert = require('assert');
const bridge = require('../src/agents/canon-agent-bridge');

function run() {
  let job = bridge.createJob({
    jobId: 'gss-bridge-test',
    capability: 'gss-kernel-pipeline',
    inputs: {fixture: 'gaussian'},
    budget: {trials: 3},
    authority: 'local-agent:gss-dogfood',
    mutationPolicy: 'read-only',
    requiredEvidence: ['gss-dogfood-report']
  });
  assert.strictEqual(job.state, 'queued');
  job = bridge.startJob(job);
  job = bridge.recordAction(job, {kind: 'run-test', detail: 'luajit gaussian probe'});
  const receipt = bridge.completeJob(job, {
    tests: ['gss-dogfood-report'],
    artifacts: [],
    failures: [],
    promotionEligible: true
  });
  assert.strictEqual(receipt.state, 'completed');
  assert.strictEqual(receipt.promotionEligible, true);
  assert.strictEqual(receipt.actions.length, 1);
  assert.strictEqual(receipt.receiptVersion, 1);
  assert.match(receipt.receiptId, /^receipt-[0-9a-f]{16}$/);
  assert.strictEqual(receipt.budgetConsumed, 1);

  assert.throws(() => bridge.recordAction(job, {kind: 'mutate'}), /read-only/);

  job = bridge.startJob(bridge.createJob({
    capability: 'webgpu',
    budget: {trials: 1},
    authority: 'local-agent:negative-test',
    requiredEvidence: ['webgpu-report']
  }));
  const incomplete = bridge.completeJob(job, {promotionEligible: true});
  assert.strictEqual(incomplete.promotionEligible, false);
  assert.deepStrictEqual(incomplete.missingEvidence, ['webgpu-report']);

  const cancelled = bridge.cancelJob(job, 'capability unavailable');
  assert.strictEqual(cancelled.state, 'cancelled');
  assert.strictEqual(cancelled.promotionEligible, false);
  console.log('Canon Agent Bridge tests: 3 passed');
}

run();
