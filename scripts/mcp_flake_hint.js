const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const http = require('http');
const https = require('https');
const { URL } = require('url');

const FLAKE_ENDPOINT = process.env.MCP_FLAKE_DB_ENDPOINT || '';
const REQUEST_TIMEOUT_MS = 2000;
const ARTIFACTS_DIR = path.join(process.cwd(), 'artifacts');
const OUTPUT_PATH = path.join(ARTIFACTS_DIR, 'test_failures.json');

function ensureArtifactsDir() {
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
}

function probeFlake(testId) {
  if (!FLAKE_ENDPOINT) return null;
  try {
    const url = new URL(FLAKE_ENDPOINT);
    if (!url.searchParams.has('test')) url.searchParams.set('test', testId);
    const client = url.protocol === 'https:' ? https : http;
    return new Promise((resolve) => {
      const req = client.get(url, { timeout: REQUEST_TIMEOUT_MS }, (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          try {
            const body = Buffer.concat(chunks).toString('utf8');
            const json = JSON.parse(body);
            resolve({ status: res.statusCode, body: json });
          } catch (err) {
            resolve({ status: res.statusCode, error: err && err.message ? err.message : String(err) });
          }
        });
      });
      req.on('timeout', () => {
        req.destroy();
        resolve({ status: 'timeout' });
      });
      req.on('error', (err) => resolve({ status: 'error', error: err && err.message ? err.message : String(err) }));
    });
  } catch (err) {
    return null;
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    args.push('node', 'tests/parity/run_parity_tests.js');
  }

  const cmd = args[0];
  const cmdArgs = args.slice(1);
  const run = spawnSync(cmd, cmdArgs, { stdio: 'inherit', shell: process.platform === 'win32' });
  const exitCode = run.status === null ? 1 : run.status;

  if (exitCode === 0) {
    process.exit(0);
  }

  ensureArtifactsDir();

  const testId = cmdArgs.join(' ') || cmd;
  const flake = await probeFlake(testId);
  const payload = { failed: true, command: [cmd].concat(cmdArgs), flake }; // advisory

  try {
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(payload, null, 2));
    console.warn(`Recorded flake hint at ${OUTPUT_PATH}`);
  } catch (err) {
    console.warn('Could not write flake hint artifact:', err && err.message ? err.message : err);
  }

  process.exit(exitCode);
}

if (require.main === module) {
  main().catch((err) => {
    console.error('mcp flake helper failed:', err && err.stack ? err.stack : err);
    process.exit(1);
  });
}
