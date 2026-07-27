const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const manifestPath = path.join(repoRoot, 'tests', 'gss_gaussian_dogfood_manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const reportDir = path.join(repoRoot, 'artifacts', 'gss');
const reportPath = path.join(reportDir, 'gss-dogfood-report.json');
const exportPath = path.join(os.tmpdir(), `luascript-gss-agent-${process.pid}.csv`);

function runLuaProbe() {
  const probe = path.join(repoRoot, 'tests', 'gss_gaussian_dogfood.lua');
  const result = spawnSync('luajit', [probe], {
    cwd: repoRoot,
    encoding: 'utf8',
    env: {...process.env, GSS_DOGFOOD_EXPORT: exportPath},
    windowsHide: true
  });
  return {
    command: `luajit ${path.relative(repoRoot, probe).replaceAll('\\', '/')}`,
    exitCode: result.status,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    parser: (result.stdout || '').match(/GSS_DOGFOOD_PARSER ([^\r\n]+)/)?.[1] || 'unknown',
    core: (result.stdout || '').includes('GSS_DOGFOOD_CORE pass'),
    agent: (result.stdout || '').includes('GSS_DOGFOOD_AGENT pass'),
    pass: (result.stdout || '').includes('GSS_DOGFOOD_PASS'),
    exportCreated: fs.existsSync(exportPath)
  };
}

function browserStaticSmoke() {
  const htmlPath = path.join(repoRoot, 'ide', 'gaussian-blobs-demo.html');
  const html = fs.readFileSync(htmlPath, 'utf8');
  const contractPath = path.join(repoRoot, 'ide', 'gss-capability-contract.json');
  const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
  const required = [
    'Canvas renderer: Live',
    'WASM/WebGPU: Planned, not active',
    'Ray tracing: Unimplemented',
    "renderer: 'canvas-prototype'",
    "gssRuntime: 'separate-lua-prototype'",
    'gss-capability-contract-v1'
  ];
  const missing = required.filter((entry) => !html.includes(entry));
  return {
    path: path.relative(repoRoot, htmlPath).replaceAll('\\', '/'),
    status: missing.length === 0 ? 'pass' : 'fail',
    missing,
    contract: contract.version
  };
}

const lua = runLuaProbe();
const browser = browserStaticSmoke();
const report = {
  version: manifest.version,
  generatedBy: 'scripts/gss_gaussian_dogfood.js',
  overall: lua.pass && browser.status === 'pass' ? 'pass' : 'fail',
  capabilities: manifest.capabilities,
  agentContract: manifest.agent_contract,
  lua,
  browser
};

fs.mkdirSync(reportDir, {recursive: true});
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
try { fs.unlinkSync(exportPath); } catch {}

console.log(`Gaussian dogfood report: ${path.relative(repoRoot, reportPath)}`);
console.log(`LuaJIT core: ${lua.core ? 'PASS' : 'FAIL'}; AGSS agent: ${lua.agent ? 'PASS' : 'FAIL'}; parser: ${lua.parser}`);
console.log(`Browser capability labels: ${browser.status.toUpperCase()}`);
console.log(`Overall: ${report.overall.toUpperCase()}`);
if (lua.stderr) console.error(lua.stderr.trim());
process.exitCode = report.overall === 'pass' ? 0 : 1;
