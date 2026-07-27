const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(repoRoot, 'tests', 'gss_gaussian_dogfood_manifest.json'), 'utf8'));
const reportPath = path.join(repoRoot, 'artifacts', 'gss', 'gss-dogfood-report.json');
const browserContract = JSON.parse(fs.readFileSync(path.join(repoRoot, 'ide', 'gss-capability-contract.json'), 'utf8'));
const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

function check(condition, message) {
  if (!condition) throw new Error(message);
}

const manifestByName = new Map(manifest.capabilities.map((entry) => [entry.name, entry]));
check(manifest.version === 'gss-dogfood-v1', 'unexpected GSS manifest version');
check(report.version === manifest.version, 'dogfood report version does not match manifest');
check(report.overall === 'pass', 'dogfood report is not passing');
check(report.lua?.core === true && report.lua?.agent === true, 'Lua core/AGSS evidence is missing');
check(report.browser?.status === 'pass', 'browser static evidence is not passing');
check(['planned', 'unimplemented'].includes(manifestByName.get('webgpu')?.status), 'WebGPU status was promoted unexpectedly');
check(manifestByName.get('ray-tracing')?.status === 'unimplemented', 'ray-tracing status must remain unimplemented');
check(browserContract.version === 'gss-browser-contract-v1', 'unexpected browser contract version');
check(browserContract.authoritativeRuntime === '../gss', 'browser contract must point to the Lua reference runtime');
check(browserContract.capabilities.wasm === 'planned', 'browser WASM claim must remain planned');
check(browserContract.capabilities.webgpu === 'planned', 'browser WebGPU claim must remain planned');
check(browserContract.capabilities.rayTracing === 'unimplemented', 'browser ray-tracing claim must remain unimplemented');

console.log('GSS capability check: PASS');
console.log(`  report=${path.relative(repoRoot, reportPath).replaceAll('\\', '/')}`);
console.log(`  parser=${report.lua.parser}`);
console.log('  browser=canvas-prototype');
console.log('  wasm=planned webgpu=planned ray-tracing=unimplemented');
