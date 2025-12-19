const fs = require('fs');
const path = require('path');

const TEMPLATE_PATH = path.join(__dirname, 'mcp_endpoints.json');
const REQUIRED_FLAG = process.env.MCP_REQUIRED === '1';

function loadTemplateKeys() {
  try {
    const data = JSON.parse(fs.readFileSync(TEMPLATE_PATH, 'utf8'));
    return Object.keys(data);
  } catch (err) {
    return ['MCP_DOC_INDEX_ENDPOINT', 'MCP_FLAKE_DB_ENDPOINT', 'MCP_IR_SCHEMA_ENDPOINT'];
  }
}

function main() {
  const keys = loadTemplateKeys();
  const missing = keys.filter((k) => !(process.env[k] && process.env[k].trim())) ;

  if (!REQUIRED_FLAG) {
    console.log('MCP_REQUIRED != 1; skipping MCP env validation.');
    if (missing.length) {
      console.log(`Would require: ${missing.join(', ')}`);
    }
    return;
  }

  if (missing.length) {
    console.error(`MCP_REQUIRED=1 but missing: ${missing.join(', ')}`);
    process.exit(1);
  }

  console.log(`MCP_REQUIRED=1 and all required keys present: ${keys.join(', ')}`);
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    console.error('MCP env validation failed:', err && err.stack ? err.stack : err);
    process.exit(1);
  }
}
