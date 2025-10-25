#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { getKindKindLangTags, listFilesFromInventory, safeStat, toPOSIX } = require('./utils');

const ROOT = path.resolve(__dirname, '..');
const AUDIT = process.env.AUDIT_DIR ? path.resolve(process.env.AUDIT_DIR) : path.resolve(__dirname);

function main() {
  const filesListPath = path.join(AUDIT, 'files_all.txt');
  if (!fs.existsSync(filesListPath)) {
    console.error('Missing audit/files_all.txt. Generate inventories first.');
    process.exit(1);
  }
  const relPaths = listFilesFromInventory(filesListPath);
  const classified = [];
  const docsIndex = [];

  for (const rel of relPaths) {
    if (!rel || rel.startsWith('audit/')) continue; // skip audit outputs
    const abs = path.join(ROOT, rel);
    const st = safeStat(abs);
    const { kind, lang, tags } = getKindKindLangTags(rel);
    const mtime = st ? Math.floor(st.mtimeMs / 1000) : null;
    const size = st ? st.size : null;
    classified.push({ path: toPOSIX(rel), kind, lang, size, mtime, tags });

    // Docs heading extraction
    if (/(\.md|\.markdown|\.org|\.rst)$/i.test(rel)) {
      try {
        const raw = fs.readFileSync(abs, 'utf8');
        const heading = extractHeading(raw);
        const preview = raw.replace(/\s+/g, ' ').slice(0, 120);
        docsIndex.push({ path: toPOSIX(rel), heading, preview });
      } catch {}
    }
  }

  // Write outputs
  fs.writeFileSync(path.join(AUDIT, 'classified_files.json'), JSON.stringify(classified, null, 2));
  const csv = ['path,heading,preview'].concat(
    docsIndex.map(r => [csvq(r.path), csvq(r.heading || ''), csvq(r.preview || '')].join(','))
  ).join('\n');
  fs.writeFileSync(path.join(AUDIT, 'docs_index.csv'), csv + '\n');
  console.log(`Classified ${classified.length} files; docs indexed: ${docsIndex.length}`);
}

function extractHeading(text) {
  // Markdown: first line starting with # or setext style
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < Math.min(lines.length, 100); i++) {
    const l = lines[i].trim();
    if (l.startsWith('#')) return l.replace(/^#+\s*/, '').trim();
    if (i + 1 < lines.length) {
      const next = lines[i + 1].trim();
      if (/^==+$/u.test(next) || /^--+$/u.test(next)) return l;
    }
    // Org-mode heading: * Heading
    if (/^\*+\s+/.test(l)) return l.replace(/^\*+\s+/, '').trim();
    // reStructuredText: top heading style often with ===== underline already covered above
  }
  return '';
}

function csvq(s) {
  const v = String(s ?? '');
  return '"' + v.replace(/"/g, '""') + '"';
}

if (require.main === module) main();
