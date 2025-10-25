#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const AUDIT = process.env.AUDIT_DIR ? path.resolve(process.env.AUDIT_DIR) : path.resolve(__dirname);

function runRG() {
  const cmd = "rg -n --hidden --glob '!{node_modules,.git,.venv,dist,build}' '(TODO|FIXME|NOTE|IDEA|PLAN|RFC|ADR|DECISION)' || true";
  try {
    const out = execSync(cmd, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    const content = out && out.trim().length > 0 ? out : 'No ideation markers found.';
    fs.writeFileSync(path.join(AUDIT, 'ideation_hits.txt'), content + '\n');
  } catch (e) {
    // If rg missing or fails, write a note to keep the file non-empty
    fs.writeFileSync(path.join(AUDIT, 'ideation_hits.txt'), 'Ideation scan not available in this environment.\n');
  }
}

function indexADRs() {
  const adrDirs = ['docs/adr', 'adr'];
  const rows = ['path,title,date,status,decision'];
  for (const rel of adrDirs) {
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs)) continue;
    const entries = fs.readdirSync(abs, { withFileTypes: true });
    for (const ent of entries) {
      if (!ent.isFile()) continue;
      const p = path.join(abs, ent.name);
      const raw = fs.readFileSync(p, 'utf8');
      const title = (raw.match(/^#\s+(.+)/m) || [,''])[1].trim();
      const date = (raw.match(/^date:\s*(.+)/mi) || [,''])[1].trim();
      const status = (raw.match(/^status:\s*(.+)/mi) || [,''])[1].trim();
      const decision = (raw.match(/^decision:\s*(.+)/mi) || [,''])[1].trim();
      rows.push([csvq(path.posix.join(rel, ent.name)), csvq(title), csvq(date), csvq(status), csvq(decision)].join(','));
    }
  }
  fs.writeFileSync(path.join(AUDIT, 'adr_index.csv'), rows.join('\n') + '\n');
}

function heuristicDocScan() {
  // If ideation_hits has no real hits, scan common files for headings and bullet markers
  const targetFiles = [
    'README.md','README_PHASE_1D.md','AUDIT_PLAN.md','AUDIT_PROTOCOL.md','PHASE_PLAN.md','PHASE5_6_PLAN.md','PROJECT_STATUS.md','TODO.md','TODO_GSS_AGSS.md',
    'GSS_AGSS_IMPLEMENTATION_SUMMARY.md','IMPLEMENTATION_SUMMARY.md','QUALITY_GATES_ENFORCEMENT.md','DESIGN_GSS.md','docs/canonical_ir_spec.md'
  ];
  const outLines = [];
  for (const rel of targetFiles) {
    const p = path.join(ROOT, rel);
    if (!fs.existsSync(p)) continue;
    const raw = fs.readFileSync(p,'utf8');
    const lines = raw.split(/\r?\n/);
    for (let i=0;i<lines.length;i++) {
      const l = lines[i];
      if (/^(#|##|###)\s+/.test(l) || /\b(TODO|FIXME|NOTE|IDEA|PLAN|RFC|ADR|DECISION)\b/.test(l)) {
        const text = l.replace(/^#+\s*/, '').trim();
        outLines.push(`${rel}:${i+1}:${text}`);
      }
      // bullets indicating planned work
      if (/^\s*[-*]\s+/.test(l) && /\b(plan|todo|tbd|next|decision|adr)\b/i.test(l)) {
        outLines.push(`${rel}:${i+1}:${l.trim()}`);
      }
    }
  }
  if (outLines.length) {
    // Append to ideation_hits.txt (do not overwrite ripgrep results)
    fs.appendFileSync(path.join(AUDIT, 'ideation_hits.txt'), outLines.join('\n') + '\n');
  }
}

function csvq(s) { return '"' + String(s||'').replace(/"/g,'""') + '"'; }

function main() {
  runRG();
  heuristicDocScan();
  indexADRs();
  console.log('Ideation and ADR indexing complete.');
}

if (require.main === module) main();
