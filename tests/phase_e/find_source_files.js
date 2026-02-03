/**
 * Find all buildable/source files for Vue and Express
 */
const fs = require('fs');
const path = require('path');

function findJsFiles(dirPath, prefix = '') {
  const files = [];
  try {
    const entries = fs.readdirSync(dirPath);
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        if (!entry.startsWith('.') && entry !== 'node_modules') {
          files.push(...findJsFiles(fullPath, prefix + entry + '/'));
        }
      } else if (entry.endsWith('.js')) {
        const size = stat.size / 1024;
        files.push({ path: prefix + entry, size: size.toFixed(1) });
      }
    }
  } catch (e) {
    // Ignore errors
  }
  return files;
}

const packagesPath = path.join(__dirname, '../../node_modules');

console.log('📦 Vue source files:\n');
const vueFiles = findJsFiles(path.join(packagesPath, 'vue'));
vueFiles.sort((a, b) => b.size - a.size).slice(0, 15).forEach(f => {
  console.log(`  ${f.path.padEnd(50)} ${f.size.padStart(8)}KB`);
});

console.log('\n📦 Express source files:\n');
const expressFiles = findJsFiles(path.join(packagesPath, 'express'));
expressFiles.sort((a, b) => b.size - a.size).slice(0, 15).forEach(f => {
  console.log(`  ${f.path.padEnd(50)} ${f.size.padStart(8)}KB`);
});
