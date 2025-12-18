const fs = require('fs');
const path = require('path');
const { collectMcpEndpoints, loadGeminiInstructions } = require('./context_pack');

function main() {
  const endpoints = collectMcpEndpoints();
  const instructions = loadGeminiInstructions(process.cwd(), process.env.GEMINI_INSTRUCTIONS_PATH);
  const outDir = path.join(process.cwd(), 'artifacts');
  fs.mkdirSync(outDir, { recursive: true });

  const endpointsPath = path.join(outDir, 'gemini_mcp_endpoints.json');
  fs.writeFileSync(endpointsPath, JSON.stringify(endpoints, null, 2));

  const envValue = JSON.stringify(endpoints.endpoints);
  console.log('MCP endpoints captured for Gemini:');
  endpoints.entries.forEach(({ key, url }) => console.log(`- ${key}: ${url || '(not set)'}`));
  console.log(`\nSuggested env export for Gemini: GEMINI_MCP_ENDPOINTS=${envValue}`);
  console.log(`Config written: ${path.relative(process.cwd(), endpointsPath)}`);
  if (!instructions.exists) {
    console.warn('No gemini-instructions.md found; create/update it to enrich context.');
  } else {
    console.log(`Gemini instructions path: ${instructions.path} (${instructions.bytes} bytes)`);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
