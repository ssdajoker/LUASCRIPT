#!/usr/bin/env node
/**
 * Patch script to add spread operator support to emitter.js
 * Adds handling for SpreadElement in ArrayExpression
 */

const fs = require('fs');
const path = require('path');

const EMITTER_PATH = path.join(__dirname, '../src/ir/emitter.js');
const BACKUP_PATH = EMITTER_PATH + '.backup';

const OLD_ARRAY_EXPRESSION = `      case "ArrayExpression": {
        const items = (node.elements || []).map((elId) => this.emitExpressionById(elId, context)).join(", ");
        return items.length ? \`{\${items}}\` : \`{}\`;
      }`;

const NEW_ARRAY_EXPRESSION = `      case "ArrayExpression": {
        // Check if this array has spread elements
        if (node.hasSpread && node.spreadElements) {
          // Build array with spreads: use runtime helper or inline table construction
          const parts = [];
          for (const el of node.spreadElements) {
            if (!el) continue;
            if (el.isSpread) {
              const spreadArr = this.emitExpressionById(el.ref, context);
              // Use table.unpack (Lua 5.2+) or unpack (Lua 5.1)
              parts.push(\`table.unpack(\${spreadArr})\`);
            } else {
              parts.push(this.emitExpressionById(el.ref, context));
            }
          }
          
          if (parts.length === 0) return "{}";
          
          // Lua syntax: {1, table.unpack({2, 3}), 4}
          return \`{\${parts.join(", ")}}\`;
        }
        
        // Simple array without spreads
        const items = (node.elements || []).map((elId) => this.emitExpressionById(elId, context)).join(", ");
        return items.length ? \`{\${items}}\` : \`{}\`;
      }`;

function main() {
  console.log('🔧 Patching spread operator support into emitter.js...\n');

  // Read emitter.js
  if (!fs.existsSync(EMITTER_PATH)) {
    console.error(`❌ Error: ${EMITTER_PATH} not found`);
    process.exit(1);
  }

  let content = fs.readFileSync(EMITTER_PATH, 'utf8');

  // Check if already patched
  if (content.includes('node.hasSpread && node.spreadElements')) {
    console.log('✅ Emitter already patched with spread support!');
    console.log('   No changes needed.\n');
    return;
  }

  // Create backup
  fs.writeFileSync(BACKUP_PATH, content);
  console.log(`📦 Backup created: ${path.basename(BACKUP_PATH)}`);

  // Apply patch
  if (!content.includes(OLD_ARRAY_EXPRESSION)) {
    console.error('❌ Error: Could not find expected ArrayExpression case');
    console.error('   The emitter.js structure may have changed.');
    console.error('   Please apply the patch manually.\n');
    process.exit(1);
  }

  content = content.replace(OLD_ARRAY_EXPRESSION, NEW_ARRAY_EXPRESSION);

  // Write patched file
  fs.writeFileSync(EMITTER_PATH, content);
  console.log('✅ Patch applied successfully!\n');

  console.log('📋 Next steps:');
  console.log('   1. npm run harness          # Test basic spread cases');
  console.log('   2. npm run test:parity      # Run full test suite');
  console.log('   3. git diff src/ir/emitter.js  # Review changes\n');
  console.log('💡 To revert: mv src/ir/emitter.js.backup src/ir/emitter.js\n');
}

main();
