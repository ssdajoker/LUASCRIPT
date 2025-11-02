#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const AUDIT = process.env.AUDIT_DIR ? path.resolve(process.env.AUDIT_DIR) : path.resolve(__dirname);
const ROOT = path.resolve(__dirname, '..');

function main() {
  const clocPath = path.join(AUDIT, 'cloc.json');
  const implPath = path.join(AUDIT, 'implementation_map.json');
  const ideation = path.join(AUDIT, 'ideation_hits.txt');

  const cloc = readJSON(clocPath) || {};
  const impl = readJSON(implPath) || { items: [], summary: { coverage_pct: 0, dangling: [] } };
  const lastCommit = getLastCommitDate();
  const activeModules = getActiveModules();
  const staleIdeas = getStaleIdeas(impl, 90); // days
  const deprecations = getCandidateDeprecations();
  const techDebt = collectTechDebt();

  const slocByLang = Object.keys(cloc)
    .filter(k => !['header','SUM'].includes(k))
    .map(k => ({ lang: k, code: cloc[k].code || 0 }))
    .sort((a,b) => b.code - a.code)
    .slice(0, 20);

  const topDangling = impl.summary?.dangling || [];
  const ideasCount = (fs.existsSync(ideation) ? fs.readFileSync(ideation,'utf8').trim().split(/\n/).filter(Boolean).length : 0);

  const md = [];
  md.push('# Local Summary');
  md.push('');
  md.push('## Repo Snapshot');
  md.push('');
  md.push(`- Last commit date: ${lastCommit || 'unknown'}`);
  md.push('- SLOC by language:');
  for (const r of slocByLang) md.push(`  - ${r.lang}: ${r.code}`);
  md.push('');
  md.push('- Active modules (recent commits, top 10):');
  for (const m of activeModules.slice(0,10)) md.push(`  - ${m.path} (${m.count} commits last 30d)`);
  if (!activeModules.length) md.push('  - _No recent activity detected_');
  md.push('');
  md.push('## Ideas Coverage');
  md.push('');
  md.push(`- Total idea markers: ${ideasCount}`);
  md.push(`- Implementation coverage: ${impl.summary?.coverage_pct ?? 0}%`);
  md.push('');
  md.push('## Top 20 dangling ideas');
  md.push('');
  for (const id of topDangling.slice(0,20)) md.push(`- ${id}`);
  if (!topDangling.length) md.push('_None_');
  md.push('');
  md.push('## Top 20 unimplemented or stale ideas');
  md.push('');
  if (staleIdeas.length) {
    for (const s of staleIdeas.slice(0,20)) md.push(`- ${s.id} (${s.days}d): ${s.source_path}`);
  } else {
    md.push('_None_');
  }
  md.push('');
  md.push('## Candidate deprecations');
  md.push('');
  if (deprecations.length) {
    for (const d of deprecations) md.push(`- ${d}`);
  } else {
    md.push('- None detected (heuristic).');
  }
  md.push('');
  md.push('## Key tech debt (from linters/tests)');
  md.push('');
  if (techDebt.length) {
    for (const t of techDebt.slice(0,20)) md.push(`- ${t}`);
  } else {
    md.push('- No issues captured; ensure linters are installed to enrich.');
  }
  md.push('');
  md.push('## Suggested next 10 tasks');
  md.push('');
  for (let i=1;i<=10;i++) md.push(`- [ ] Assign-Owner: Task ${i}`);
  md.push('');

  fs.writeFileSync(path.join(AUDIT, 'local_summary.md'), md.join('\n'));
  console.log('local_summary.md written');
}

function readJSON(p) { try { return JSON.parse(fs.readFileSync(p,'utf8')); } catch { return null; } }

function getLastCommitDate() {
  try {
    const { execSync } = require('child_process');
    return execSync('git log -1 --date=iso --pretty=format:%ad', { encoding: 'utf8' });
  } catch { return null; }
}

function getActiveModules() {
  try {
    const { execSync } = require('child_process');
    const out = execSync("git log --since='30 days ago' --name-only --pretty=format: -- . | grep -v '^$' | sort | uniq -c | sort -nr | head -n 100", { cwd: ROOT, encoding: 'utf8' });
    return out.split(/\n/).filter(Boolean).map(line => {
      const m = line.trim().match(/^(\d+)\s+(.*)$/);
      return m ? { count: Number(m[1]), path: m[2] } : null;
    }).filter(Boolean);
  } catch { return []; }
}

function getStaleIdeas(impl, thresholdDays) {
  const items = impl.items || [];
  const result = [];
  for (const it of items) {
    const mtime = getFileMtime(it.source_path);
    if (it.status === 'unknown' || it.status === 'partial') {
      if (mtime && daysSince(mtime) >= thresholdDays) {
        result.push({ id: it.id, source_path: it.source_path, days: daysSince(mtime) });
      }
    }
  }
  result.sort((a,b)=> b.days - a.days);
  return result;
}

function getFileMtime(relPath) {
  try {
    const p = path.join(ROOT, relPath);
    const st = fs.statSync(p);
    return st.mtime;
  } catch { return null; }
}

function daysSince(date) {
  const d = (date instanceof Date) ? date : new Date(date);
  return Math.floor((Date.now() - d.getTime()) / (1000*60*60*24));
}

function getCandidateDeprecations() {
  // Heuristics: orphaned examples/docs without matching code references
  const out = [];
  try {
    const classified = readJSON(path.join(AUDIT, 'classified_files.json')) || [];
    const codePaths = new Set(classified.filter(o=>o.kind==='code' || o.kind==='tests').map(o=>o.path));
    for (const f of classified) {
      if (f.kind === 'examples' || f.kind === 'docs') {
        const base = path.basename(f.path).replace(/\.(md|markdown|org|rst)$/i, '');
        const related = Array.from(codePaths).some(p=>p.includes(base));
        if (!related) out.push(`${f.path} (no related code found)`);
      }
    }
  } catch {}
  return out.slice(0, 20);
}

function collectTechDebt() {
  const debt = [];
  const q = safeRead(path.join(AUDIT, 'quality_report.md'));
  const t = safeRead(path.join(AUDIT, 'tests_output.txt'));
  // Extract a few indicative lines
  if (q) {
    const lines = q.split(/\n/).filter(l=>/error|warn|violation|fail/i.test(l)).slice(0,20);
    lines.forEach(l=>debt.push(l.trim()));
  }
  if (t) {
    const lines = t.split(/\n/).filter(l=>/FAIL|Error|Timeout|flaky/i.test(l)).slice(0,20);
    lines.forEach(l=>debt.push(l.trim()));
  }
  return debt;
}

function safeRead(p) { try { return fs.readFileSync(p,'utf8'); } catch { return ''; } }

if (require.main === module) main();
