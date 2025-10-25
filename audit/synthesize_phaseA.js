#!/usr/bin/env node
/**
 * Generate an executive summary of Phase‑A (Local Workspace Audit).
 * Reads existing audit artifacts and emits audit/synthesis_phaseA.md.
 */
const fs = require('fs');
const path = require('path');

const AUDIT = path.resolve(__dirname);
const ROOT = path.resolve(__dirname, '..');

function readJSON(p, fallback = null) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch {
    return fallback;
  }
}

function safeRead(p) {
  try { return fs.readFileSync(p, 'utf8'); } catch { return ''; }
}

function countLines(p) {
  const s = safeRead(p).trim();
  if (!s) return 0;
  return s.split(/\r?\n/).filter(Boolean).length;
}

function parseCSV(p) {
  const raw = safeRead(p);
  if (!raw) return [];
  const lines = raw.split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  const header = lines[0].split(',').map(h => h.replace(/^"|"$/g, ''));
  return lines.slice(1).map(line => {
    // very simple CSV split handling quotes
    const cols = [];
    let cur = '';
    let inQ = false;
    for (let i=0;i<line.length;i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQ && line[i+1] === '"') { cur += '"'; i++; }
        else { inQ = !inQ; }
      } else if (ch === ',' && !inQ) { cols.push(cur); cur = ''; }
      else { cur += ch; }
    }
    cols.push(cur);
    const obj = {};
    header.forEach((k, idx) => obj[k] = cols[idx] ?? '');
    return obj;
  });
}

function main() {
  const cloc = readJSON(path.join(AUDIT, 'cloc.json'), {});
  const deps = readJSON(path.join(AUDIT, 'deps.json'), { manifests: [], deps: [] });
  const impl = readJSON(path.join(AUDIT, 'implementation_map.json'), { items: [], summary: { total: 0, implemented: 0, partial: 0, coverage_pct: 0 } });
  const adr = parseCSV(path.join(AUDIT, 'adr_index.csv'));
  const docsIdx = parseCSV(path.join(AUDIT, 'docs_index.csv'));
  const ideationHits = countLines(path.join(AUDIT, 'ideation_hits.txt'));
  const testsReport = safeRead(path.join(AUDIT, 'tests_report.md'));
  const qualityReport = safeRead(path.join(AUDIT, 'quality_report.md'));

  // Repo last commit date
  const lastCommit = getLastCommitDate();

  // SLOC breakdown
  const slocByLang = Object.keys(cloc)
    .filter(k => !['header','SUM'].includes(k))
    .map(k => ({ lang: k, code: cloc[k].code || 0 }))
    .sort((a,b) => b.code - a.code);

  // Build summary markdown
  const md = [];
  md.push('# Phase‑A Synthesis — Local Workspace');
  md.push('');
  md.push('## Snapshot');
  md.push('');
  md.push(`- Last commit date: ${lastCommit || 'unknown'}`);
  const totalFiles = Number(cloc?.SUM?.n_files || 0);
  const totalSLOC = Number(cloc?.SUM?.code || 0);
  md.push(`- Files (tracked): ${totalFiles}`);
  md.push(`- Total SLOC: ${totalSLOC}`);
  md.push('- Top languages:');
  slocByLang.slice(0, 8).forEach(r => md.push(`  - ${r.lang}: ${r.code}`));
  if (!slocByLang.length) md.push('  - N/A');
  md.push('');

  md.push('## Architecture Evidence & Decisions');
  md.push('');
  md.push(`- ADRs indexed: ${adr.length}`);
  const adrPreview = adr.slice(0, 10).map(r => `  - ${r.path || r['path'] || 'unknown'}${r.title ? ` — ${r.title}` : ''}`);
  md.push(...(adrPreview.length ? adrPreview : ['  - _No ADRs detected_']));
  md.push('');

  md.push('## Ideas → Implementation Coverage');
  md.push('');
  md.push(`- Ideation markers: ${ideationHits}`);
  md.push(`- Implementation coverage: ${impl.summary.coverage_pct}% (implemented=${impl.summary.implemented}, partial=${impl.summary.partial}, total=${impl.summary.total})`);
  const dangling = (impl.summary?.dangling || []).slice(0, 10);
  md.push('- Top dangling ideas:');
  md.push(...(dangling.length ? dangling.map(id => `  - ${id}`) : ['  - _None_']));
  md.push('');

  md.push('## Dependencies');
  md.push('');
  md.push(`- Manifests: ${deps.manifests.length}`);
  md.push(`- Declared dependencies: ${deps.deps.length}`);
  md.push(...deps.manifests.slice(0, 10).map(m => `  - ${m}`));
  md.push('');

  md.push('## Quality & Tests (high‑level)');
  md.push('');
  md.push(takeawaysFromQuality(qualityReport));
  md.push('');
  md.push(takeawaysFromTests(testsReport));
  md.push('');

  fs.writeFileSync(path.join(AUDIT, 'synthesis_phaseA.md'), md.join('\n'));
  console.log('synthesis_phaseA.md written');
}

function getLastCommitDate() {
  try {
    const { execSync } = require('child_process');
    return execSync('git log -1 --date=iso --pretty=format:%ad', { cwd: ROOT, encoding: 'utf8' });
  } catch { return null; }
}

function takeawaysFromQuality(md) {
  if (!md) return '- Quality report: unavailable';
  const lintIssues = (md.match(/warning|error|violation|fail/gi) || []).length;
  const semgrepFindings = (md.match(/"check_id"/g) || []).length;
  return `- Quality: ~${lintIssues} lints/errors noted; Semgrep findings: ~${semgrepFindings} (see audit/quality_report.md)`;
}

function takeawaysFromTests(md) {
  if (!md) return '- Tests: no data';
  const fails = (md.match(/FAIL|✖|x\s+failing/gi) || []).length;
  const passes = (md.match(/PASS|✔|✓/gi) || []).length;
  return `- Tests: passes≈${passes}, fails≈${fails} (see audit/tests_report.md)`;
}

if (require.main === module) main();
