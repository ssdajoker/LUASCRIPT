#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const AUDIT = process.env.AUDIT_DIR ? path.resolve(process.env.AUDIT_DIR) : path.resolve(__dirname);

function main() {
  const hitsPath = path.join(AUDIT, 'ideation_hits.txt');
  const classifiedPath = path.join(AUDIT, 'classified_files.json');
  const outPath = path.join(AUDIT, 'implementation_map.json');

  const hitsRaw = fs.existsSync(hitsPath) ? fs.readFileSync(hitsPath,'utf8') : '';
  const classified = fs.existsSync(classifiedPath) ? JSON.parse(fs.readFileSync(classifiedPath,'utf8')) : [];

  const filesByPath = new Map(classified.map(o => [o.path, o]));
  const codeFiles = classified.filter(o => o.kind === 'code').map(o => o.path);
  const testFiles = classified.filter(o => o.kind === 'tests').map(o => o.path);
  const configFiles = classified.filter(o => o.kind === 'config').map(o => o.path);
  const lineRe = /^(.*?):(\d+):(.+)$/;
  const ideas = [];
  let idCounter = 1;
  for (const line of hitsRaw.split(/\r?\n/)) {
    const m = line.match(lineRe);
    if (!m) continue;
    const [_, file, lineNoStr, text] = m;
    const id = `IDEA_${idCounter++}`;
    ideas.push({ id, source_path: file, line: Number(lineNoStr), summary: text.trim() });
  }

  const maps = [];
  const STALE_DAYS = 90;
  const kwMatchers = [
    { re: /transpiler/i, pat: /(^|\/)src\/.*transpiler.*\.js$/i },
    { re: /core\s*transpiler/i, pat: /(^|\/)src\/.*core.*transpiler.*\.js$/i },
    { re: /optimized|optimization/i, pat: /(^|\/)src\/optimized_transpiler\.js$/i },
    { re: /enhanced/i, pat: /(^|\/)src\/enhanced_transpiler\.js$/i },
    { re: /runtime\s*system|runtime/i, pat: /(^|\/)src\/(runtime(_system)?|index|system)\.js$/i },
    { re: /interpreter/i, pat: /(^|\/)src\/phase2_core_interpreter\.js$/i },
    { re: /parser/i, pat: /(^|\/)src\/(parser|phase1_core_parser)\.js$/i },
    { re: /lexer/i, pat: /(^|\/)src\/phase1_core_lexer\.js$/i },
    { re: /ir\b|intermediate|pipeline/i, pat: /(^|\/)src\/ir\//i },
    { re: /wasm|webassembly/i, pat: /(^|\/)src\/wasm_backend\.js$/i },
    { re: /performance/i, pat: /(^|\/)src\/performance_tools\.js$/i },
    { re: /agentic|ide\b/i, pat: /(^|\/)src\/(agentic_ide|ide\/)$/i },
    { re: /phase\s*1\b/i, pat: /(^|\/)src\/phase1_/i },
    { re: /phase\s*2\b/i, pat: /(^|\/)src\/phase2_/i },
    { re: /phase\s*5\b/i, pat: /(^|\/)src\/phase5_/i },
    { re: /phase\s*6\b/i, pat: /(^|\/)src\/phase6_/i },
    { re: /phase\s*9\b/i, pat: /(^|\/)src\/phase9_/i },
    { re: /memory/i, pat: /(^|\/)tests\/test_memory_management\.js$/i },
  ];
  for (const idea of ideas) {
    // Heuristic: if source file is in docs, try to find similarly named code/test files
    const basename = path.basename(idea.source_path).replace(/\.(md|markdown|org|rst)$/i, '');
    // Keyword-based matching
    const linksSet = new Set();
    const text = `${basename} ${idea.summary}`;
    for (const km of kwMatchers) {
      if (km.re.test(text)) {
        for (const f of codeFiles) if (km.pat.test(f)) linksSet.add(f);
        for (const f of testFiles) if (km.pat.test(f)) linksSet.add(f);
        for (const f of configFiles) if (km.pat.test(f)) linksSet.add(f);
      }
    }
    // Token fallback: match simple tokens in paths
    const tokens = text.toLowerCase().split(/[^a-z0-9_]+/).filter(s => s.length >= 4);
    if (linksSet.size < 2 && tokens.length) {
      const candidates = classified.filter(o => (o.kind === 'code' || o.kind === 'tests' || o.kind === 'config'));
      for (const o of candidates) {
        const p = o.path.toLowerCase();
        if (tokens.some(t => p.includes(t))) linksSet.add(o.path);
        if (linksSet.size >= 15) break;
      }
    }
    const related = Array.from(linksSet).slice(0, 15).map(p => filesByPath.get(p) || { path: p, kind: 'code' });
    let status = 'unknown';
    const hasCode = related.some(r => (r.kind || '').includes('code'));
    const hasTest = related.some(r => (r.kind || '').includes('tests'));
    if (hasCode && hasTest) status = 'implemented';
    else if (hasCode || hasTest) status = 'partial';
    // rejected marker
    if (/\b(REJECT|REJECTED|DEPRECATE|DEPRECATED)\b/i.test(idea.summary)) status = 'rejected';
    // stale: no related items and source file old
    if ((status === 'unknown' || status === 'partial') && isStale(idea.source_path, STALE_DAYS)) status = (status === 'partial') ? 'partial' : 'stale';
    const links = related.map(r => r.path);
    maps.push({ id: idea.id, source_path: idea.source_path, summary: idea.summary, status, links });
  }

  // Coverage summary
  const implemented = maps.filter(m => m.status === 'implemented').length;
  const partial = maps.filter(m => m.status === 'partial').length;
  const coverage = ideas.length ? Math.round(((implemented + partial*0.5) / ideas.length) * 100) : 0;
  const dangling = maps.filter(m => m.status === 'unknown').slice(0, 20).map(m => m.id);

  fs.writeFileSync(outPath, JSON.stringify({ items: maps, summary: { total: ideas.length, implemented, partial, coverage_pct: coverage, dangling } }, null, 2));
  console.log(`Implementation map written: ${maps.length} items, coverage ${coverage}%`);
}

if (require.main === module) main();

function isStale(sourcePath, days) {
  try {
    const p = path.resolve(__dirname, '..', sourcePath);
    const st = fs.statSync(p);
    const ageDays = Math.floor((Date.now() - st.mtimeMs) / (1000*60*60*24));
    return ageDays >= days;
  } catch {
    return false;
  }
}
