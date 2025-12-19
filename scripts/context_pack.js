const fs = require('fs');
const path = require('path');

const DEFAULT_INSTRUCTIONS = 'copilot-instructions.md';
const PRIORITY_MCP_KEYS = [
  'MCP_DOC_INDEX_ENDPOINT',
  'MCP_FLAKE_DB_ENDPOINT',
  'MCP_IR_SCHEMA_ENDPOINT',
];

const GEMINI_INSTRUCTIONS = 'gemini-instructions.md';
const COORDINATION_DOC = 'assistant_coordination.md';

function listMcpKeys() {
  const envKeys = Object.keys(process.env).filter((key) => /^MCP_.*_ENDPOINT$/.test(key));
  const nonPriorityEnvKeys = envKeys.filter((key) => !PRIORITY_MCP_KEYS.includes(key)).sort();
  return [...PRIORITY_MCP_KEYS, ...nonPriorityEnvKeys];
}

function collectMcpEndpoints() {
  const keys = listMcpKeys();
  const entries = keys.map((key) => ({ key, url: (process.env[key] || '').trim() }));
  const endpoints = Object.fromEntries(entries.filter((e) => e.url).map((e) => [e.key, e.url]));
  return {
    keys,
    entries,
    endpoints,
    envString: JSON.stringify(endpoints),
  };
}

function loadInstructions(baseDir = process.cwd(), explicitPath, fallback) {
  const configuredPath = explicitPath || fallback;
  const resolvedPath = path.isAbsolute(configuredPath)
    ? configuredPath
    : path.join(baseDir, configuredPath);

  let content = '';
  let exists = false;

  try {
    content = fs.readFileSync(resolvedPath, 'utf8');
    exists = true;
  } catch (err) {
    content = '';
    exists = false;
  }

  const excerpt = content.slice(0, 2000);
  return {
    path: path.relative(baseDir, resolvedPath),
    exists,
    bytes: Buffer.byteLength(content, 'utf8'),
    excerpt,
  };
}

function loadCopilotInstructions(baseDir, explicitPath) {
  return loadInstructions(baseDir, explicitPath, DEFAULT_INSTRUCTIONS);
}

function loadGeminiInstructions(baseDir, explicitPath) {
  return loadInstructions(baseDir, explicitPath, GEMINI_INSTRUCTIONS);
}

function writeContextArtifacts({ harnessSummary, outDir = path.join(process.cwd(), 'artifacts'), runInfo = {} }) {
  fs.mkdirSync(outDir, { recursive: true });
  const copilotInstructions = loadInstructions(process.cwd(), process.env.COPILOT_INSTRUCTIONS_PATH, DEFAULT_INSTRUCTIONS);
  const geminiInstructions = loadInstructions(process.cwd(), process.env.GEMINI_INSTRUCTIONS_PATH, GEMINI_INSTRUCTIONS);
  const coordination = loadInstructions(process.cwd(), process.env.ASSISTANT_COORD_PATH, COORDINATION_DOC);
  const mcp = collectMcpEndpoints();
  
  // Copilot-oriented bundle (backward compatible with 'instructions' key)
  const payload = { ...harnessSummary, mcp, instructions: copilotInstructions };
  const contextPack = {
    generatedAt: new Date().toISOString(),
    run: runInfo,
    instructions: copilotInstructions,
    geminiInstructions,
    coordination,
    mcp,
    harness: harnessSummary,
  };

  fs.writeFileSync(path.join(outDir, 'harness_results.json'), JSON.stringify(payload, null, 2));
  fs.writeFileSync(path.join(outDir, 'context_pack.json'), JSON.stringify(contextPack, null, 2));

  // Gemini-oriented bundle (same data, instructions key points to gemini)
  const geminiPack = {
    ...contextPack,
    target: 'gemini',
    instructions: geminiInstructions,
    copilotInstructions,
  };
  fs.writeFileSync(path.join(outDir, 'context_pack_gemini.json'), JSON.stringify(geminiPack, null, 2));

  return { payload, contextPack };
}

module.exports = {
  DEFAULT_INSTRUCTIONS,
  GEMINI_INSTRUCTIONS,
  COORDINATION_DOC,
  PRIORITY_MCP_KEYS,
  collectMcpEndpoints,
  loadInstructions,
  loadCopilotInstructions,
  loadGeminiInstructions,
  writeContextArtifacts,
};
