#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const AUDIT = process.env.AUDIT_DIR ? path.resolve(process.env.AUDIT_DIR) : path.resolve(__dirname);

function readJSON(p) { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; } }

function main() {
  const manifests = [];
  const deps = [];
  const report = [];

  // package.json
  const pkgPath = path.join(ROOT, 'package.json');
  if (fs.existsSync(pkgPath)) {
    manifests.push('package.json');
    const pkg = readJSON(pkgPath) || {};
    const topLicense = pkg.license || pkg.licence || '';
    const addFrom = (obj, section) => {
      if (!obj) return;
      for (const [name, ver] of Object.entries(obj)) {
        deps.push({ manager: 'npm', manifest: 'package.json', section, name, version: String(ver), license: topLicense });
      }
    };
    addFrom(pkg.dependencies, 'dependencies');
    addFrom(pkg.devDependencies, 'devDependencies');
    report.push(`- package.json: ${Object.keys(pkg.dependencies||{}).length} deps, ${Object.keys(pkg.devDependencies||{}).length} devDeps, license: ${topLicense || 'N/A'}`);
  }

  // Python: requirements.txt, pyproject.toml
  const reqPath = path.join(ROOT, 'requirements.txt');
  if (fs.existsSync(reqPath)) {
    manifests.push('requirements.txt');
    const lines = fs.readFileSync(reqPath,'utf8').split(/\r?\n/).filter(Boolean);
    for (const line of lines) {
      const m = line.match(/^([^=<>\s#]+)\s*([=<>!~].+)?/);
      if (!m) continue;
      deps.push({ manager: 'pip', manifest: 'requirements.txt', section: 'default', name: m[1], version: (m[2]||'').trim() });
    }
    report.push(`- requirements.txt: ${lines.length} entries`);
  }

  const pyproject = path.join(ROOT, 'pyproject.toml');
  if (fs.existsSync(pyproject)) {
    manifests.push('pyproject.toml');
    report.push('- pyproject.toml present');
  }

  // Others
  const others = ['go.mod','Cargo.toml','package-lock.json','pnpm-lock.yaml','yarn.lock','composer.json','Gemfile','Gemfile.lock'];
  for (const f of others) if (fs.existsSync(path.join(ROOT,f))) { manifests.push(f); }

  fs.writeFileSync(path.join(AUDIT,'deps.json'), JSON.stringify({ manifests, deps }, null, 2));
  const md = [
    '# Dependency Report',
    '',
    '## Manifests',
    '',
    ...manifests.map(m => `- ${m}`),
    '',
    '## Top-level Dependencies',
    '',
    ...deps.map(d => `- [${d.manager}] ${d.name} ${d.version} (${d.section})${d.license ? ` — license: ${d.license}` : ''}`)
  ].join('\n');
  fs.writeFileSync(path.join(AUDIT,'deps_report.md'), md + '\n');
  console.log('Dependency report generated.');
}

if (require.main === module) main();
