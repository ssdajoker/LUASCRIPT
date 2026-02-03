/**
 * Analyze available bundle formats for each package
 * to maximize node extraction
 */
const fs = require('fs');
const path = require('path');

const packagesPath = path.join(__dirname, '../../node_modules');

const packages = {
  lodash: 'lodash',
  express: 'express',
  vue: 'vue',
  react: 'react'
};

for (const [name, pkg] of Object.entries(packages)) {
  const pkgPath = path.join(packagesPath, pkg);
  if (!fs.existsSync(pkgPath)) {
    console.log(`❌ ${name}: NOT FOUND`);
    continue;
  }

  console.log(`\n📦 ${name}:`);
  
  try {
    // List main distribution files
    const distDir = path.join(pkgPath, 'dist');
    const libDir = path.join(pkgPath, 'lib');
    const cjsDir = path.join(pkgPath, 'cjs');
    const esmDir = path.join(pkgPath, 'esm');
    
    for (const dir of [distDir, libDir, cjsDir, esmDir]) {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir).filter(f => f.endsWith('.js')).slice(0, 10);
        const dirName = path.basename(dir);
        console.log(`   ${dirName}: ${files.length} .js files`);
        if (files.length <= 5) {
          files.forEach(f => console.log(`     - ${f}`));
        } else {
          files.slice(0, 3).forEach(f => console.log(`     - ${f}`));
          console.log(`     ... and ${files.length - 3} more`);
        }
      }
    }
    
    // Check for main entry point
    const pkgJson = path.join(pkgPath, 'package.json');
    if (fs.existsSync(pkgJson)) {
      const pj = JSON.parse(fs.readFileSync(pkgJson, 'utf-8'));
      if (pj.main) console.log(`   main: ${pj.main}`);
      if (pj.module) console.log(`   module: ${pj.module}`);
      if (pj.exports) console.log(`   exports: ${typeof pj.exports === 'string' ? pj.exports : Object.keys(pj.exports).join(', ')}`);
    }
    
  } catch (e) {
    console.log(`   ⚠️ Error: ${e.message}`);
  }
}

console.log('\n✅ Analysis complete');
