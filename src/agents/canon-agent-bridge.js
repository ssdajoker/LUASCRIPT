/**
 * Bounded local-agent job and receipt contract.
 *
 * This is deliberately an evidence boundary, not an executor. Transport may
 * be MCP, a local queue, or a direct caller, but promotion requires a receipt
 * with explicit authority and verification data.
 */

const crypto = require('crypto');
const TERMINAL_STATES = new Set(['completed', 'failed', 'cancelled']);

function requireNonEmpty(value, name) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`${name} must be a non-empty string`);
  }
}

function createJob(input = {}) {
  requireNonEmpty(input.capability, 'capability');
  requireNonEmpty(input.authority, 'authority');
  if (!input.budget || !Number.isInteger(input.budget.trials) || input.budget.trials < 1) {
    throw new TypeError('budget.trials must be a positive integer');
  }
  if (!Array.isArray(input.requiredEvidence)) {
    throw new TypeError('requiredEvidence must be an array');
  }

  return {
    schemaVersion: 1,
    jobId: input.jobId || `job-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    capability: input.capability,
    inputs: input.inputs || {},
    budget: {trials: input.budget.trials},
    authority: input.authority,
    mutationPolicy: input.mutationPolicy || 'read-only',
    requiredEvidence: [...input.requiredEvidence],
    state: 'queued',
    actions: [],
    createdAt: new Date().toISOString()
  };
}

function startJob(job) {
  if (!job || job.state !== 'queued') throw new Error('job must be queued');
  return {...job, state: 'running', startedAt: new Date().toISOString()};
}

function recordAction(job, action) {
  if (!job || job.state !== 'running') throw new Error('job must be running');
  requireNonEmpty(action?.kind, 'action.kind');
  if (job.mutationPolicy === 'read-only' && action.kind === 'mutate') {
    throw new Error('read-only job cannot record mutation action');
  }
  return {...job, actions: [...job.actions, {
    kind: action.kind,
    detail: action.detail || null,
    at: action.at || new Date().toISOString()
  }]};
}

function completeJob(job, result = {}) {
  if (!job || job.state !== 'running') throw new Error('job must be running');
  const tests = Array.isArray(result.tests) ? result.tests : [];
  const artifacts = Array.isArray(result.artifacts) ? result.artifacts : [];
  const failures = Array.isArray(result.failures) ? result.failures : [];
  const missingEvidence = job.requiredEvidence.filter((name) => !tests.includes(name) && !artifacts.includes(name));
  const promotionEligible = Boolean(result.promotionEligible) && failures.length === 0 && missingEvidence.length === 0;
  const receiptBody = {
    jobId: job.jobId,
    capability: job.capability,
    actions: job.actions,
    tests,
    artifacts,
    failures,
    missingEvidence,
    promotionEligible
  };
  const receiptId = `receipt-${crypto.createHash('sha256').update(JSON.stringify(receiptBody)).digest('hex').slice(0, 16)}`;

  return {
    receiptVersion: 1,
    receiptId,
    jobId: job.jobId,
    capability: job.capability,
    state: failures.length > 0 ? 'failed' : 'completed',
    authority: job.authority,
    mutationPolicy: job.mutationPolicy,
    actions: job.actions,
    tests,
    artifacts,
    failures,
    missingEvidence,
    budgetConsumed: job.actions.length,
    promotionEligible,
    completedAt: new Date().toISOString()
  };
}

function cancelJob(job, reason = 'cancelled by authority') {
  if (!job || TERMINAL_STATES.has(job.state)) throw new Error('job is already terminal');
  return {
    receiptVersion: 1,
    receiptId: `receipt-${crypto.createHash('sha256').update(`${job.jobId}:cancelled:${reason}`).digest('hex').slice(0, 16)}`,
    jobId: job.jobId,
    capability: job.capability,
    state: 'cancelled',
    authority: job.authority,
    reason,
    promotionEligible: false,
    completedAt: new Date().toISOString()
  };
}

module.exports = {createJob, startJob, recordAction, completeJob, cancelJob};
