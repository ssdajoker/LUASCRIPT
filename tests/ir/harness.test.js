const assert = require('assert');
const http = require('http');
const https = require('https');
const { URL } = require('url');
const { parseAndLower } = require('../../src/ir/pipeline');
const { emitLuaFromIR } = require('../../src/ir/emitter');
const { validateIR } = require('../../src/ir/validator');
const { writeContextArtifacts } = require('../../scripts/context_pack');

const results = [];

const DOC_ENDPOINT = process.env.MCP_DOC_INDEX_ENDPOINT || '';
const REQUEST_TIMEOUT_MS = 2000;

function fetchDocHints(query) {
  if (!DOC_ENDPOINT) return null;
  try {
    const url = new URL(DOC_ENDPOINT);
    if (!url.searchParams.has('q')) {
      url.searchParams.set('q', query.slice(0, 120));
    }
    const client = url.protocol === 'https:' ? https : http;
    return new Promise((resolve) => {
      const req = client.get(url, (res) => {
        req.setTimeout(REQUEST_TIMEOUT_MS);
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          try {
            const body = Buffer.concat(chunks).toString('utf8');
            const json = JSON.parse(body);
            resolve({ ok: res.statusCode, body: json });
          } catch (err) {
            resolve({ ok: res.statusCode, error: err && err.message ? err.message : String(err) });
          }
        });
        res.on('error', (err) => {
          resolve({ ok: 0, error: err && err.message ? err.message : String(err) });
        });
      });
      req.on('timeout', () => {
        req.destroy();
        resolve({ ok: 0, error: 'timeout' });
      });
      req.on('error', (err) => resolve({ ok: 0, error: err && err.message ? err.message : String(err) }));
    });
  } catch (err) {
    return null;
  }
}

function runCase(name, source, expectations) {
  const started = process.hrtime.bigint();

  const ir1 = parseAndLower(source);
  const validation = validateIR(ir1);
  assert.strictEqual(validation.ok, true, `${name} validation failed: ${JSON.stringify(validation)}`);
  const lua1 = emitLuaFromIR(ir1);
  expectations({ lua: lua1, ir: ir1 });

  const ir2 = parseAndLower(source);
  const lua2 = emitLuaFromIR(ir2);
  assert.strictEqual(lua1, lua2, `${name} determinism mismatch between runs`);

  const durationMs = Number(process.hrtime.bigint() - started) / 1_000_000;
  results.push({ name, durationMs, bytes: lua1.length });
  assert.ok(durationMs < 2000, `${name} exceeded 2000ms budget (${durationMs.toFixed(2)}ms)`);

  return lua1;
}

function writeArtifacts(summary) {
  try {
    const runInfo = {
      gitSha: process.env.GITHUB_SHA || null,
      runId: process.env.GITHUB_RUN_ID || null,
      runUrl: process.env.GITHUB_RUN_ID && process.env.GITHUB_REPOSITORY
        ? `https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
        : null,
    };
    writeContextArtifacts({ harnessSummary: summary, runInfo });
  } catch (err) {
    console.warn('Failed to write harness artifacts:', err && err.stack ? err.stack : err);
  }
}

async function main() {
  let currentCase = null;
  try {
    currentCase = 'optional chaining + nullish coalesce';
    runCase(currentCase, 'const r = (obj?.value ?? 1) | 4;', ({ lua }) => {
      assert.ok(lua.includes('function(__o)'), 'optional guard missing');
      assert.ok(lua.includes('__o ~= nil'), 'optional chain guard condition missing');
      assert.ok(lua.includes('__v == nil then return 1 else return __v'), 'nullish coalesce fallback missing');
      assert.ok(lua.includes('| 4'), 'bitwise OR missing');
    });

    currentCase = 'nullish assignment';
    runCase(currentCase, 'x ??= y;', ({ lua }) => {
      assert.ok(lua.includes('local __val = x'), 'nullish assignment temp missing');
      assert.ok(lua.includes('__val == nil then __val = y'), 'nullish assignment guard missing');
      assert.ok(lua.includes('x = __val'), 'nullish assignment writeback missing');
    });

    currentCase = 'for-of emission';
    runCase(currentCase, 'function sum(items) { let total = 0; for (const v of items) { total += v; } return total; }', ({ lua }) => {
      assert.ok(lua.includes('for __k, v in pairs(items)'), 'for-of should use pairs iterator');
      assert.ok(lua.includes('total = total + v'), 'accumulation missing');
      assert.ok(lua.includes('return total'), 'return total missing');
    });

    currentCase = 'for-of array literal';
    runCase(currentCase, 'function sum(arr) { let s = 0; for (const n of [1,2,3]) { s += n; } return s + arr[0]; }', ({ lua }) => {
      assert.ok(lua.includes('for __k, n in pairs({1, 2, 3})'), 'for-of array literal should desugar to pairs over table');
      assert.ok(lua.includes('s = s + n'), 'accumulation missing in literal loop');
      assert.ok(lua.includes('return s + arr[0]'), 'return expression missing');
    });

    currentCase = 'template literal basic';
    runCase(currentCase, 'function greet(name) { const msg = `hi ${name}!`; return msg; }', ({ lua }) => {
      assert.ok(lua.includes('local msg'), 'template literal binding missing');
      assert.ok(lua.includes('string.format("hi %s!", name)'), 'template literal interpolation missing');
      assert.ok(lua.includes('return msg'), 'template literal return missing');
    });

    currentCase = 'array destructuring';
    runCase(currentCase, 'function pick(foo) { const [a, , c] = foo; return a + c; }', ({ lua }) => {
      assert.ok(lua.includes('local __ds1 = foo'), 'array destruct temp missing');
      assert.ok(lua.includes('__ds1[0]'), 'first element access missing');
      assert.ok(lua.includes('__ds1[1]'), 'third element access missing');
      assert.ok(lua.match(/return a \+ c/), 'return expression missing');
    });

    /*
    currentCase = 'spread in array literal';
    runCase(currentCase, 'const arr = [1, ...[2, 3], 4];', ({ lua }) => {
    assert.ok(lua.includes('local arr'), 'spread binding missing');
    assert.ok(lua.includes('{1'), 'array literal start missing');
  });

    currentCase = 'rest in function params';
    runCase(currentCase, 'function gather(a, ...rest) { return rest.length; }', ({ lua }) => {
    assert.ok(lua.includes('function gather'), 'function name missing');
    assert.ok(lua.includes('rest'), 'rest param missing');
  });
*/

    currentCase = 'arrow function expression body';
    runCase(currentCase, 'const double = x => x * 2;', ({ lua }) => {
      assert.ok(lua.includes('local double'), 'arrow binding missing');
      assert.ok(lua.includes('function('), 'arrow function missing');
      assert.ok(lua.includes('return'), 'implicit return missing');
    });

    currentCase = 'arrow function block body';
    runCase(currentCase, 'const add = (a, b) => { const sum = a + b; return sum; };', ({ lua }) => {
      assert.ok(lua.includes('local add'), 'arrow binding missing');
      assert.ok(lua.includes('local sum'), 'block body variable missing');
      assert.ok(lua.includes('return sum'), 'explicit return missing');
    });

    /*
    currentCase = 'object property shorthand';
    runCase(currentCase, 'const x = 1; const obj = { x, y: 2 };', ({ lua }) => {
    assert.ok(lua.includes('local x'), 'shorthand source var missing');
    assert.ok(lua.includes('local obj'), 'object binding missing');
    assert.ok(lua.includes('x = x'), 'shorthand expansion missing');
  });
*/

    currentCase = 'computed property names';
    runCase(currentCase, 'const key = "a"; const obj = { [key]: 1 };', ({ lua }) => {
      assert.ok(lua.includes('local key'), 'computed key var missing');
      assert.ok(lua.includes('local obj'), 'object binding missing');
    });

    /*
    currentCase = 'class with methods';
    runCase(currentCase, 'class Counter { inc() { this.n++; } }', ({ lua }) => {
    assert.ok(lua.includes('Counter'), 'class name missing');
    assert.ok(lua.includes('inc'), 'method name missing');
    assert.ok(lua.includes('self'), 'method self reference missing');
  });
*/

    currentCase = 'try-catch block';
    runCase(currentCase, 'function safe() { try { throw new Error("x"); } catch (e) { return e; } }', ({ lua }) => {
      assert.ok(lua.includes('pcall'), 'protected call missing');
      assert.ok(lua.includes('function safe'), 'function declaration missing');
    });

    currentCase = 'switch statement';
    runCase(currentCase, 'function test(x) { switch(x) { case 1: return "one"; default: return "other"; } }', ({ lua }) => {
      assert.ok(lua.includes('if'), 'switch condition missing');
      assert.ok(lua.includes('return'), 'case return missing');
    });

    const slowest = results.slice().sort((a, b) => b.durationMs - a.durationMs)[0];
    writeArtifacts({ summary: { cases: results.length, slowest }, cases: results });
    console.log('harness tests passed');
  } catch (err) {
    console.error('harness tests failed');
    console.error(err && err.stack ? err.stack : err);
    const hint = await fetchDocHints(`${currentCase} ${err && err.message ? err.message : ''}`);
    writeArtifacts({ error: err && err.message ? err.message : 'harness failed', cases: results, docHint: hint });
    process.exit(1);
  }
}

main();
