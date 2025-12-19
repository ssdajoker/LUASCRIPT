const fs = require('fs');
const path = require('path');
const { writeContextArtifacts } = require('./context_pack');

function loadExistingHarnessSummary() {
  const artifactsPath = path.join(process.cwd(), 'artifacts', 'harness_results.json');
  try {
    const parsed = JSON.parse(fs.readFileSync(artifactsPath, 'utf8'));
    return parsed.harness || parsed; // tolerate either shape
  } catch (err) {
    return { summary: { cases: 0, slowest: null }, cases: [] };
  }
}

function main() {
  const harnessSummary = loadExistingHarnessSummary();
  const runInfo = { mode: 'local-sync' };
  const { payload, contextPack } = writeContextArtifacts({ harnessSummary, runInfo });
  console.log('Wrote artifacts/harness_results.json with MCP + instructions overlay.');
  console.log('Wrote artifacts/context_pack.json for Copilot ingestion.');
  if (contextPack && contextPack.mcp && Object.keys(contextPack.mcp.endpoints || {}).length === 0) {
    console.warn('No MCP endpoints found in environment (MCP_*_ENDPOINT). Set them before syncing.');
  }
}

if (require.main === module) {
  main();
}
