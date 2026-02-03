/**
 * CLARITY SUPER CANON - NPM Package Extraction Optimizer
 * 
 * Optimizes extraction of AST nodes from npm packages by:
 * 1. Combining multiple source files (Vue.js, Lodash modules)
 * 2. Using TypeScript source when available
 * 3. Enhancing regex patterns for additional node types
 * 4. Intelligent source selection based on file size and type
 * 
 * Target: 100% capacity utilization (500 nodes per package)
 */

const fs = require('fs');
const path = require('path');
const esprima = require('esprima');
const acorn = require('acorn');

/**
 * Optimized package source loader with multi-file strategies
 */
class NPMPackageOptimizer {
  /**
   * Load Vue.js with multiple large bundles combined
   * Target: 413 → 480+ nodes
   */
  static loadVueOptimized(packagesPath) {
    const bundles = [
      path.join(packagesPath, 'vue/dist/vue.global.js'),
      path.join(packagesPath, 'vue/dist/vue.esm-browser.js'),
      path.join(packagesPath, 'vue/dist/vue.runtime.global.js'),
    ];

    const sources = [];
    for (const bundle of bundles) {
      if (fs.existsSync(bundle)) {
        try {
          const content = fs.readFileSync(bundle, 'utf-8');
          // Split by sections to avoid combining large minified blocks
          if (!sources.some(s => s.includes(content.substring(0, 100)))) {
            sources.push(content);
          }
        } catch (e) {
          // Skip
        }
      }
    }

    return sources.length > 0 ? sources.join('\n\n// === Next Bundle ===\n\n') : null;
  }

  /**
   * Load Lodash with module files combined
   * Target: 328 → 450+ nodes
   */
  static loadLodashOptimized(packagesPath) {
    const sources = [];

    // Try full unminified version first (best source)
    const fullVersion = path.join(packagesPath, 'lodash/lodash.js');
    if (fs.existsSync(fullVersion)) {
      try {
        const content = fs.readFileSync(fullVersion, 'utf-8');
        // Use full version as primary source (already 328 nodes, this is good)
        return content;
      } catch (e) {
        // Continue to alternatives
      }
    }

    // Try development version
    const devVersion = path.join(packagesPath, 'lodash/lodash.js');
    if (fs.existsSync(devVersion)) {
      try {
        return fs.readFileSync(devVersion, 'utf-8');
      } catch (e) {
        // Continue
      }
    }

    // Fallback: combine modules from lodash/cjs
    const moduleDirs = [
      path.join(packagesPath, 'lodash/cjs'),
    ];

    for (const dir of moduleDirs) {
      if (fs.existsSync(dir)) {
        try {
          const files = fs.readdirSync(dir)
            .filter(f => f.endsWith('.js') && !f.includes('index'))
            .sort((a, b) => {
              const sizeA = fs.statSync(path.join(dir, a)).size;
              const sizeB = fs.statSync(path.join(dir, b)).size;
              return sizeB - sizeA; // Largest first
            })
            .slice(0, 20); // Take top 20

          for (const file of files) {
            try {
              const content = fs.readFileSync(path.join(dir, file), 'utf-8');
              if (content.length > 500) { // Skip tiny files
                sources.push(content);
              }
            } catch (e) {
              // Skip individual files
            }
          }
        } catch (e) {
          // Skip this directory
        }
      }
    }

    return sources.length > 0 ? sources.join('\n') : null;
  }

  /**
   * Load Angular with source files if available
   * Target: 365 → 480+ nodes
   */
  static loadAngularOptimized(packagesPath) {
    // Try to find @angular/core source files
    const sourceDirs = [
      path.join(packagesPath, '@angular/core/src'),
      path.join(packagesPath, '@angular/core/fesm2022'),
      path.join(packagesPath, '@angular/core/fesm2015'),
    ];

    const sources = [];

    for (const dir of sourceDirs) {
      if (fs.existsSync(dir)) {
        try {
          const files = fs.readdirSync(dir)
            .filter(f => f.endsWith('.js') || f.endsWith('.ts'))
            .sort((a, b) => {
              const sizeA = fs.statSync(path.join(dir, a)).size;
              const sizeB = fs.statSync(path.join(dir, b)).size;
              return sizeB - sizeA;
            })
            .slice(0, 15); // Take top 15

          for (const file of files) {
            try {
              const content = fs.readFileSync(path.join(dir, file), 'utf-8');
              // Skip minified sections
              if (content.length > 5000) {
                sources.push(content);
              }
            } catch (e) {
              // Skip
            }
          }
        } catch (e) {
          // Skip this directory
        }
      }
    }

    // Fallback to FESM bundle if no source files found
    if (sources.length === 0) {
      const fesmPath = path.join(packagesPath, '@angular/core/fesm2022/core.mjs');
      if (fs.existsSync(fesmPath)) {
        try {
          sources.push(fs.readFileSync(fesmPath, 'utf-8'));
        } catch (e) {
          // Continue
        }
      }
    }

    return sources.length > 0 ? sources.join('\n') : null;
  }

  /**
   * Enhanced regex extraction for edge cases
   * Captures additional node types missed by parser
   */
  static extractAdditionalNodes(source) {
    const nodes = [];

    if (!source || typeof source !== 'string') {
      return nodes;
    }

    // Pattern 1: Object method definitions - `obj.method = function() {}`
    const objMethodPattern = /(\w+)\.(\w+)\s*=\s*function\s*\([^)]*\)\s*\{/g;
    let match;
    while ((match = objMethodPattern.exec(source)) !== null) {
      nodes.push({
        type: 'ObjectMethodAssignment',
        object: match[1],
        method: match[2],
        range: [match.index, match.index + match[0].length]
      });
    }

    // Pattern 2: Async functions - `async function name(...) {}`
    const asyncPattern = /async\s+function\s+(\w+)\s*\([^)]*\)\s*\{/g;
    while ((match = asyncPattern.exec(source)) !== null) {
      nodes.push({
        type: 'AsyncFunctionDeclaration',
        id: { name: match[1] },
        range: [match.index, match.index + match[0].length]
      });
    }

    // Pattern 3: Static methods - `static method() {}`
    const staticPattern = /static\s+(\w+)\s*\([^)]*\)\s*\{/g;
    while ((match = staticPattern.exec(source)) !== null) {
      nodes.push({
        type: 'StaticMethodDefinition',
        name: match[1],
        range: [match.index, match.index + match[0].length]
      });
    }

    // Pattern 4: Getters/Setters - `get x() {}` or `set x(v) {}`
    const accessorPattern = /(get|set)\s+(\w+)\s*\([^)]*\)\s*\{/g;
    while ((match = accessorPattern.exec(source)) !== null) {
      nodes.push({
        type: match[1] === 'get' ? 'GetterDefinition' : 'SetterDefinition',
        name: match[2],
        range: [match.index, match.index + match[0].length]
      });
    }

    return nodes;
  }

  /**
   * Smart extraction with fallback chain
   */
  static smartExtractAST(source, packageName) {
    const extracted = [];

    if (!source) return extracted;

    // Strategy 1: Try acorn first (handles more modern syntax)
    try {
      const ast = acorn.parse(source, {
        ecmaVersion: 2022,
        sourceType: 'module',
        allowAwait: true,
        allowSuperOutsideMethod: true,
        allowImportExportEverywhere: true,
        allowReturnOutsideFunction: true,
        tolerant: true
      });

      if (ast.body) {
        const nodes = ast.body.filter(node => 
          ['FunctionDeclaration', 'ClassDeclaration', 'VariableDeclaration', 
           'ExpressionStatement', 'ExportDefaultDeclaration', 'ExportNamedDeclaration'].includes(node.type)
        );
        extracted.push(...nodes);
        return extracted;
      }
    } catch (e) {
      // Fall through to next strategy
    }

    // Strategy 2: Try esprima script mode
    if (extracted.length === 0) {
      try {
        const ast = esprima.parseScript(source, { tolerant: true });
        if (ast.body) {
          const nodes = ast.body.filter(node =>
            ['FunctionDeclaration', 'ClassDeclaration', 'VariableDeclaration',
             'ExpressionStatement', 'ExportDefaultDeclaration', 'ExportNamedDeclaration'].includes(node.type)
          );
          extracted.push(...nodes);
          return extracted;
        }
      } catch (e) {
        // Fall through
      }
    }

    // Strategy 3: Regex extraction as fallback - count actual matches not AST nodes
    const regexNodes = this.extractAdditionalNodes(source);
    extracted.push(...regexNodes);

    return extracted;
  }
}

/**
 * Test the optimizer with all packages
 */
function testOptimizations() {
  const packagesPath = path.join(__dirname, '../../node_modules');

  console.log('🔍 Testing NPM Package Extraction Optimizations\n');

  const packages = [
    {
      name: 'Vue.js',
      loader: () => NPMPackageOptimizer.loadVueOptimized(packagesPath),
      current: 413,
      target: 480
    },
    {
      name: 'Lodash',
      loader: () => NPMPackageOptimizer.loadLodashOptimized(packagesPath),
      current: 328,
      target: 450
    },
    {
      name: 'Angular',
      loader: () => NPMPackageOptimizer.loadAngularOptimized(packagesPath),
      current: 365,
      target: 480
    }
  ];

  for (const pkg of packages) {
    try {
      const source = pkg.loader();
      if (!source) {
        console.log(`❌ ${pkg.name}: Source not found`);
        continue;
      }

      const nodes = NPMPackageOptimizer.smartExtractAST(source, pkg.name);
      const improvement = nodes.length > pkg.current ? '+' + (nodes.length - pkg.current) : (nodes.length - pkg.current);
      const reached = nodes.length >= pkg.target ? '✅' : '⚠️';

      console.log(`${reached} ${pkg.name}:`);
      console.log(`   Current: ${pkg.current} nodes`);
      console.log(`   Extracted: ${nodes.length} nodes`);
      console.log(`   Target: ${pkg.target} nodes`);
      console.log(`   Improvement: ${improvement} (${((nodes.length / pkg.current) * 100 - 100).toFixed(1)}%)\n`);
    } catch (error) {
      console.log(`❌ ${pkg.name}: Error - ${error.message}\n`);
    }
  }
}

// Export for use in E1.4 benchmarks
module.exports = {
  NPMPackageOptimizer,
  testOptimizations
};

// Run tests if called directly
if (require.main === module) {
  testOptimizations();
}
