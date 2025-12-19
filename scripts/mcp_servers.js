const http = require('http');
const { URL } = require('url');

const PORT = parseInt(process.env.MCP_PORT || '8787', 10);

// Work queue: test failures → Gemini tasks
const workQueue = [];
let workIdCounter = 0;

// Assistant activity log for coordination
const assistantLog = [];

// Tiny in-memory data to make the endpoints useful for local dev.
const docs = [
  { id: 'getting-started', title: 'Getting Started', body: 'Install deps, run npm test, check harness.' },
  { id: 'ir-harness', title: 'IR Harness', body: 'Use npm run harness; artifacts/harness_results.json holds timing and determinism.' },
  { id: 'copilot-context', title: 'Copilot Context', body: 'Set MCP_*_ENDPOINT env vars and run npm run copilot:context to refresh context_pack.json.' },
  { id: 'spread-rest', title: 'Spread/Rest Operators', body: 'Spread in arrays uses table.unpack(). Rest params collect {...} in Lua.' },
  { id: 'work-queue', title: 'Work Queue', body: 'Async coordination via /work-queue. Copilot submits failures, Gemini polls and fixes.' },
];

const flakeDb = {
  'tests/ir/harness.test.js': { flakesLast30d: 0, lastSeen: null },
  'tests/parity/run_parity_tests.js': { flakesLast30d: 1, lastSeen: '2025-11-18' },
};

const irSchema = {
  version: 'local-dev-1',
  description: 'Placeholder IR schema for local MCP testing.',
  fields: [
    { name: 'type', type: 'string', required: true },
    { name: 'body', type: 'array', required: true },
  ],
};

function json(res, status, payload) {
  res.writeHead(status, { 
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
  });
  res.end(JSON.stringify(payload, null, 2));
}

function handleDocIndex(u, res) {
  const q = (u.searchParams.get('q') || '').toLowerCase();
  const hits = !q
    ? []
    : docs
        .filter((d) => d.title.toLowerCase().includes(q) || d.body.toLowerCase().includes(q))
        .map((d) => ({ id: d.id, title: d.title, snippet: d.body.slice(0, 120) }));
  json(res, 200, { query: q, count: hits.length, hits });
}

function handleFlakeDb(u, res) {
  const test = u.searchParams.get('test') || '';
  const entry = flakeDb[test] || { flakesLast30d: 0, lastSeen: null };
  json(res, 200, { test, ...entry });
}

function handleIrSchema(_u, res) {
  json(res, 200, irSchema);
}

// Work queue endpoint - Gemini polls for tasks
function handleWorkQueue(u, res) {
  const action = u.searchParams.get('action') || 'list';
  const agent = u.searchParams.get('agent') || 'unknown';
  
  if (action === 'list') {
    const assignee = u.searchParams.get('assignee') || 'gemini';
    const pending = workQueue.filter(w => w.status === 'pending' && w.assignee === assignee);
    json(res, 200, { count: pending.length, tasks: pending });
  } else if (action === 'claim') {
    const id = parseInt(u.searchParams.get('id'), 10);
    const task = workQueue.find(w => w.id === id);
    if (task && task.status === 'pending') {
      task.status = 'in-progress';
      task.claimedAt = new Date().toISOString();
      task.claimedBy = agent;
      assistantLog.push({ ts: task.claimedAt, agent, action: 'claim', taskId: id });
      json(res, 200, { claimed: true, task });
    } else {
      json(res, 404, { claimed: false, error: 'Task not found or already claimed' });
    }
  } else if (action === 'complete') {
    const id = parseInt(u.searchParams.get('id'), 10);
    const result = u.searchParams.get('result') || 'fixed';
    const task = workQueue.find(w => w.id === id);
    if (task) {
      task.status = 'completed';
      task.completedAt = new Date().toISOString();
      task.result = result;
      assistantLog.push({ ts: task.completedAt, agent, action: 'complete', taskId: id, result });
      json(res, 200, { completed: true, task });
    } else {
      json(res, 404, { completed: false, error: 'Task not found' });
    }
  } else {
    json(res, 400, { error: 'Unknown action. Use ?action=list|claim|complete' });
  }
}

// Submit work endpoint - Copilot adds tasks after test failures
function handleSubmitWork(req, res) {
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    try {
      const payload = JSON.parse(body);
      const task = {
        id: ++workIdCounter,
        type: payload.type || 'test-failure',
        priority: payload.priority || 'medium',
        assignee: payload.assignee || 'gemini',
        status: 'pending',
        createdAt: new Date().toISOString(),
        createdBy: payload.createdBy || 'copilot',
        title: payload.title || 'Untitled task',
        description: payload.description || '',
        context: payload.context || {},
        testCase: payload.testCase || null,
        error: payload.error || null,
        artifacts: payload.artifacts || [],
      };
      workQueue.push(task);
      assistantLog.push({ ts: task.createdAt, agent: task.createdBy, action: 'submit', taskId: task.id });
      json(res, 201, { created: true, task });
    } catch (err) {
      json(res, 400, { error: 'Invalid JSON', message: err.message });
    }
  });
}

// Assistant activity log
function handleAssistantLog(u, res) {
  const limit = parseInt(u.searchParams.get('limit') || '50', 10);
  const recent = assistantLog.slice(-limit);
  json(res, 200, { count: recent.length, log: recent });
}

// Sync status - current state of async work
function handleSyncStatus(_u, res) {
  const pending = workQueue.filter(w => w.status === 'pending');
  const inProgress = workQueue.filter(w => w.status === 'in-progress');
  const completed = workQueue.filter(w => w.status === 'completed');
  const now = Date.now();
  const recentWindow = 300000; // 5 minutes
  
  json(res, 200, {
    timestamp: new Date().toISOString(),
    workQueue: {
      pending: pending.length,
      inProgress: inProgress.length,
      completed: completed.length,
      total: workQueue.length,
    },
    recentActivity: assistantLog.slice(-10),
    coordination: {
      copilotActive: assistantLog.filter(a => a.agent === 'copilot' && now - new Date(a.ts) < recentWindow).length > 0,
      geminiActive: assistantLog.filter(a => a.agent === 'gemini' && now - new Date(a.ts) < recentWindow).length > 0,
    },
  });
}

const server = http.createServer((req, res) => {
  const u = new URL(req.url, `http://localhost:${PORT}`);
  const p = u.pathname;
  
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200, { 
      'Access-Control-Allow-Origin': '*', 
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }
  
  // Original endpoints
  if (req.method === 'GET' && p === '/doc-index/search') return handleDocIndex(u, res);
  if (req.method === 'GET' && p === '/flake-db/flakes') return handleFlakeDb(u, res);
  if (req.method === 'GET' && p === '/ir-schema') return handleIrSchema(u, res);
  
  // Gemini-friendly aliases
  if (req.method === 'GET' && p === '/gemini/doc-index/search') return handleDocIndex(u, res);
  if (req.method === 'GET' && p === '/gemini/flake-db/flakes') return handleFlakeDb(u, res);
  if (req.method === 'GET' && p === '/gemini/ir-schema') return handleIrSchema(u, res);
  
  // Work coordination endpoints
  if ((p === '/work-queue' || p === '/gemini/work-queue') && req.method === 'GET') return handleWorkQueue(u, res);
  if (p === '/submit-work' && req.method === 'POST') return handleSubmitWork(req, res);
  if (p === '/assistant-log' && req.method === 'GET') return handleAssistantLog(u, res);
  if (p === '/sync-status' && req.method === 'GET') return handleSyncStatus(u, res);
  
  json(res, 404, { error: 'not found', path: p, available: [
    'GET /doc-index/search?q=term',
    'GET /flake-db/flakes?test=path',
    'GET /ir-schema',
    'GET /work-queue?action=list|claim|complete&id=N',
    'POST /submit-work (JSON body)',
    'GET /assistant-log?limit=N',
    'GET /sync-status'
  ]});
});

server.listen(PORT, () => {
  console.log(`MCP dev server listening on http://localhost:${PORT}`);
  console.log('Doc index:   GET /doc-index/search?q=term');
  console.log('Flake DB:    GET /flake-db/flakes?test=tests/ir/harness.test.js');
  console.log('IR schema:   GET /ir-schema');
  console.log('Work queue:  GET /work-queue?action=list');
  console.log('Submit work: POST /submit-work (JSON)');
  console.log('Sync status: GET /sync-status');
  console.log('Agent log:   GET /assistant-log');
});
