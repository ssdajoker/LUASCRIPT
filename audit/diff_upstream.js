#!/usr/bin/env node
/**
 * Compare local ./audit artifacts against ../luascript_upstream/audit_upstream
 * Emits:
 *  - audit/diff_upstream.json
 *  - audit/diff_upstream_report.md
 * Schema (json): { entity_type, id, status: added|removed|changed, pointers: { local, upstream } }
 */
const fs = require('fs');
const path = require('path');

const LOCAL_AUDIT = path.resolve(__dirname);
const ROOT = path.resolve(__dirname, '..');
const UPSTREAM_ROOT = path.resolve(ROOT, '..', 'luascript_upstream');
const UPSTREAM_AUDIT = path.join(UPSTREAM_ROOT, 'audit_upstream');

function readJSON(p) { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; } }
function safeRead(p) { try { return fs.readFileSync(p, 'utf8'); } catch { return ''; } }

function uniq(arr) { return Array.from(new Set(arr)); }

function main() {
  // Preconditions
  if (!fs.existsSync(UPSTREAM_AUDIT)) {
    console.error(`Missing upstream audit directory: ${UPSTREAM_AUDIT}`);
    process.exit(1);
  }

  // Load key artifacts
  const localImpl = readJSON(path.join(LOCAL_AUDIT, 'implementation_map.json')) || { items: [], summary: {} };
  const upImpl = readJSON(path.join(UPSTREAM_AUDIT, 'implementation_map.json')) || { items: [], summary: {} };

  const localDocs = csvIndex(path.join(LOCAL_AUDIT, 'docs_index.csv'));
  const upDocs = csvIndex(path.join(UPSTREAM_AUDIT, 'docs_index.csv'));

  const localADR = csvIndex(path.join(LOCAL_AUDIT, 'adr_index.csv'));
  const upADR = csvIndex(path.join(UPSTREAM_AUDIT, 'adr_index.csv'));

  const localFiles = readInventory(path.join(LOCAL_AUDIT, 'files_all.txt'));
  const upFiles = readInventory(path.join(UPSTREAM_AUDIT, 'files_all.txt'));

  const diffs = [];

  // 1) New Ideas / ADRs / Plans
  const localIdeaIds = new Set((localImpl.items||[]).map(i => i.id));
  const upIdeaIds = new Set((upImpl.items||[]).map(i => i.id));
  // ideas by source_path+summary (id may not match across repos)
  const localIdeaKey = new Set((localImpl.items||[]).map(i => keyIdea(i)));
  const upIdeaKey = new Set((upImpl.items||[]).map(i => keyIdea(i)));

  for (const k of upIdeaKey) if (!localIdeaKey.has(k)) {
    const it = (upImpl.items||[]).find(i => keyIdea(i) === k);
    diffs.push({ entity_type: 'idea', id: it?.id || k, status: 'added', pointers: { local: null, upstream: it?.source_path || null } });
  }
  for (const k of localIdeaKey) if (!upIdeaKey.has(k)) {
    const it = (localImpl.items||[]).find(i => keyIdea(i) === k);
    diffs.push({ entity_type: 'idea', id: it?.id || k, status: 'removed', pointers: { local: it?.source_path || null, upstream: null } });
  }

  // 2) ADRs added/removed
  diffCSVEntities('adr', localADR, upADR, diffs);

  // 3) Docs/plans (from docs_index)
  diffCSVEntities('doc', localDocs, upDocs, diffs);

  // 4) Files/modules present upstream vs local
  for (const f of upFiles) if (!localFiles.has(f)) {
    diffs.push({ entity_type: 'file', id: f, status: 'added', pointers: { local: null, upstream: f } });
  }
  for (const f of localFiles) if (!upFiles.has(f)) {
    diffs.push({ entity_type: 'file', id: f, status: 'removed', pointers: { local: f, upstream: null } });
  }

  // 5) Changed ideas: same key but different status/links length
  const localByKey = indexBy((localImpl.items||[]), keyIdea);
  const upByKey = indexBy((upImpl.items||[]), keyIdea);
  for (const k of uniq([...
    new Set([ ...Object.keys(localByKey), ...Object.keys(upByKey) ])
  ])) {
    const l = localByKey[k];
    const u = upByKey[k];
    if (l && u) {
      const lSig = `${l.status}|${(l.links||[]).length}`;
      const uSig = `${u.status}|${(u.links||[]).length}`;
      if (lSig !== uSig) {
        diffs.push({ entity_type: 'idea', id: l.id || u.id || k, status: 'changed', pointers: { local: l.source_path, upstream: u.source_path } });
      }
    }
  }

  // Write JSON
  const outJSON = path.join(LOCAL_AUDIT, 'diff_upstream.json');
  fs.writeFileSync(outJSON, JSON.stringify(diffs, null, 2));

  // Write Markdown report
  const lines = ['# Upstream Diff Report', '', `Compared local: ${LOCAL_AUDIT}`, `Against upstream: ${UPSTREAM_AUDIT}`, ''];
  const groups = groupBy(diffs, d => `${d.entity_type}:${d.status}`);
  for (const key of Object.keys(groups).sort()) {
    const [etype, status] = key.split(':');
    lines.push(`## ${etype.toUpperCase()} — ${status.toUpperCase()}`,'');
    for (const d of groups[key]) {
      const ptr = [];
      if (d.pointers?.local) ptr.push(`local: ${d.pointers.local}`);
      if (d.pointers?.upstream) ptr.push(`upstream: ${d.pointers.upstream}`);
      lines.push(`- ${d.id}${ptr.length?` (${ptr.join(' | ')})`:''}`);
    }
    lines.push('');
  }
  fs.writeFileSync(path.join(LOCAL_AUDIT, 'diff_upstream_report.md'), lines.join('\n'));
  console.log(`Wrote ${outJSON} and diff_upstream_report.md`);
}

function readInventory(p) {
  const raw = safeRead(p);
  const set = new Set();
  raw.split(/\r?\n/).map(l=>l.trim()).filter(Boolean).forEach(l => set.add(l));
  return set;
}

function csvIndex(p) {
  const raw = safeRead(p);
  if (!raw) return [];
  const lines = raw.split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  const header = lines[0].split(',').map(h => h.replace(/^"|"$/g, ''));
  return lines.slice(1).map(line => {
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

function indexBy(arr, keyFn) {
  const m = Object.create(null);
  for (const it of arr) m[keyFn(it)] = it;
  return m;
}

function diffCSVEntities(entityType, localRows, upRows, outArr) {
  // Use path column when present; otherwise fallback to heading text
  const keyOf = (r) => (r.path || r['path'] || r.title || r['title'] || r.heading || r['heading'] || JSON.stringify(r));
  const lset = new Set(localRows.map(keyOf));
  const uset = new Set(upRows.map(keyOf));
  for (const k of uset) if (!lset.has(k)) outArr.push({ entity_type: entityType, id: k, status: 'added', pointers: { local: null, upstream: k } });
  for (const k of lset) if (!uset.has(k)) outArr.push({ entity_type: entityType, id: k, status: 'removed', pointers: { local: k, upstream: null } });
}

function keyIdea(it) {
  return `${it?.source_path || ''}::${String(it?.summary||'').slice(0,60)}`;
}

function groupBy(arr, keyFn) {
  const m = {};
  for (const a of arr) {
    const k = keyFn(a);
    (m[k] ||= []).push(a);
  }
  return m;
}

if (require.main === module) main();
