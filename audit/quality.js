#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const AUDIT = process.env.AUDIT_DIR ? path.resolve(process.env.AUDIT_DIR) : path.resolve(__dirname);

function main() {
  const lines = ['# Quality Report', ''];
  const addFile = (title, fname) => {
    const p = path.join(AUDIT, fname);
    lines.push(`## ${title}`);
    if (fs.existsSync(p) && fs.statSync(p).size > 0) {
      lines.push('', '```', fs.readFileSync(p, 'utf8').slice(0, 40000), '```', '');
    } else {
      lines.push('', '_No data_', '');
    }
  };
  addFile('ESLint', 'eslint.txt');
  addFile('LuaCheck', 'luacheck.txt');
  addFile('Python Lint', 'python_lint.txt');
  addFile('Semgrep JSON (truncated)', 'semgrep.json');
  fs.writeFileSync(path.join(AUDIT, 'quality_report.md'), lines.join('\n'));
  console.log('quality_report.md written');
}

if (require.main === module) main();
