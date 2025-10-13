const fs = require('fs');
const path = require('path');

function toPOSIX(p) {
  return p.split(path.sep).join('/');
}

function getExt(filePath) {
  const b = path.basename(filePath);
  const m = b.match(/\.([^.]+)$/);
  return m ? m[1].toLowerCase() : '';
}

const codeExts = new Set([
  'js','jsx','ts','tsx','mjs','cjs',
  'py','lua','rb','rs','go','java','kt',
  'c','cc','cpp','cxx','h','hpp','hh','m','mm',
  'swift','scala','cs','php','sh','bash','zsh','ps1',
  'sql','r','jl','pl','clj','groovy'
]);

const testIndicators = [/\btest(s)?\b/i, /\bspec(s)?\b/i, /\.test\./i, /\.spec\./i];
const exampleIndicators = [/examples?\//i, /example\./i, /samples?\//i];
const docsIndicators = [/^docs\//i, /README|GUIDE|MANUAL|OVERVIEW|SPEC|ADR|RFC/i, /\.md$/i, /\.rst$/i, /\.org$/i];
const configExts = new Set(['json','jsonc','yaml','yml','ini','toml','conf','cfg','editorconfig','eslintignore','prettierrc','eslintrc','npmrc','lock']);
const assetExts = new Set(['png','jpg','jpeg','gif','svg','webp','ico','bmp','ttf','otf','woff','woff2','mp3','mp4','wav','mov','pdf','csv']);

function getKindKindLangTags(relPath) {
  const p = toPOSIX(relPath);
  const ext = getExt(p);
  const tags = [];

  if (/^\./.test(path.basename(p))) tags.push('dotfile');
  if (p.includes('/.github/')) tags.push('github');
  if (p.includes('/scripts/')) tags.push('script');
  if (p.includes('/src/')) tags.push('source');
  if (p.includes('/test/') || p.includes('/tests/')) tags.push('test-dir');
  if (p.includes('/examples/')) tags.push('examples-dir');
  if (p.includes('/docs/')) tags.push('docs-dir');

  let kind = 'other';
  let lang = '';

  if (assetExts.has(ext)) {
    kind = 'assets';
  }
  if (configExts.has(ext) || /(^|\/)\.(env|gitignore|gitattributes|luacheckrc|flake8|pylintrc|ruff\.toml)$/i.test(p)) {
    kind = 'config';
  }
  if (docsIndicators.some(r => r.test(p))) {
    kind = 'docs';
  }
  if (exampleIndicators.some(r => r.test(p))) {
    kind = 'examples';
  }
  if (testIndicators.some(r => r.test(p))) {
    kind = 'tests';
  }
  if (codeExts.has(ext) || /\.(lua|ts|tsx|js|jsx|py|go|rs|java|c|cc|cpp|h|hpp|cs|php|sh|bash|ps1)$/i.test(p)) {
    kind = kind === 'tests' ? 'tests' : 'code';
  }

  // language mapping
  const extLang = {
    js: 'JavaScript', jsx: 'JavaScript', mjs: 'JavaScript', cjs: 'JavaScript',
    ts: 'TypeScript', tsx: 'TypeScript',
    py: 'Python', lua: 'Lua', rb: 'Ruby', rs: 'Rust', go: 'Go', java: 'Java', kt: 'Kotlin',
    c: 'C', cc: 'C++', cpp: 'C++', cxx: 'C++', h: 'C/C++ Header', hh: 'C++ Header', hpp: 'C++ Header',
    cs: 'C#', php: 'PHP', sh: 'Shell', bash: 'Shell', ps1: 'PowerShell',
    rst: 'reStructuredText', md: 'Markdown', markdown: 'Markdown', org: 'Org',
    json: 'JSON', yml: 'YAML', yaml: 'YAML', toml: 'TOML', ini: 'INI'
  };
  lang = extLang[ext] || '';

  return { kind, lang, tags };
}

function listFilesFromInventory(invPath) {
  const raw = fs.readFileSync(invPath, 'utf8');
  return raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
}

function safeStat(p) {
  try { return fs.statSync(p); } catch { return null; }
}

module.exports = {
  toPOSIX, getExt, getKindKindLangTags, listFilesFromInventory, safeStat
};
