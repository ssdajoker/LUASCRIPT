const fs = require('fs');
const path = require('path');
const { collectMcpEndpoints, loadCopilotInstructions } = require('./context_pack');

function main() {
  const endpoints = collectMcpEndpoints();
  const instructions = loadCopilotInstructions(process.cwd());
  const outDir = path.join(process.cwd(), 'artifacts');
  fs.mkdirSync(outDir, { recursive: true });

  const endpointsPath = path.join(outDir, 'copilot_mcp_endpoints.json');
  fs.writeFileSync(endpointsPath, JSON.stringify(endpoints, null, 2));

  const envValue = JSON.stringify(endpoints.endpoints);
  console.log('MCP endpoints captured for Copilot:');
  endpoints.entries.forEach(({ key, url }) => console.log(`- ${key}: ${url || '(not set)'}`));
  console.log(`\nSuggested env export for Copilot: COPILOT_MCP_ENDPOINTS=${envValue}`);
  console.log(`Config written: ${path.relative(process.cwd(), endpointsPath)}`);
  if (!instructions.exists) {
    console.warn('No copilot-instructions.md found; create it to enrich context.');
  } else {
    console.log(`Instructions path: ${instructions.path} (${instructions.bytes} bytes)`);
  }
}

if (require.main === module) {
  main();
}
