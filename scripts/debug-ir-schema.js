#!/usr/bin/env node

/**
 * 🔍 INTELLIGENT IR SCHEMA DEBUGGER
 * Deep dive validation debugging with root cause analysis
 * 
 * This tool goes beyond just "validation failed" - it finds EXACTLY
 * which node and field caused the failure, and why.
 * 
 * Usage: node scripts/debug-ir-schema.js [testname]
 */

const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');

const SCHEMA_PATH = path.join(__dirname, '..', 'src', 'ir', 'canonical_ir.schema.json');
const IR_DIR = path.join(__dirname, '..', 'artifacts', 'ir');
const OUTPUT_DIR = path.join(__dirname, '..', 'artifacts');

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║  🔍 INTELLIGENT IR SCHEMA DEBUGGER                          ║');
console.log('║  Finding root causes, not just symptoms                     ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// Load schema
let schema;
try {
    schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8'));
    console.log('✅ Schema loaded:', SCHEMA_PATH);
} catch (error) {
    console.error('❌ Failed to load schema:', error.message);
    process.exit(1);
}

// Setup validator
const ajv = new Ajv({ allErrors: true, verbose: true, strict: false });
const validate = ajv.compile(schema);

console.log('✅ Validator compiled\n');

// Find test cases
const testName = process.argv[2] || null;
let irFiles;

if (testName) {
    irFiles = [path.join(IR_DIR, `${testName}.ir.json`)].filter(fs.existsSync);
    if (irFiles.length === 0) {
        console.error(`❌ Test not found: ${testName}`);
        process.exit(1);
    }
} else {
    if (!fs.existsSync(IR_DIR)) {
        console.error('❌ IR directory not found:', IR_DIR);
        console.log('💡 Run "npm run harness" first to generate IR files');
        process.exit(1);
    }
    
    irFiles = fs.readdirSync(IR_DIR)
        .filter(f => f.endsWith('.ir.json'))
        .map(f => path.join(IR_DIR, f));
}

console.log(`🔍 Analyzing ${irFiles.length} IR file(s)...\n`);

// ═══════════════════════════════════════════════════════════════
// STEP 1: Find problematic IR files
// ═══════════════════════════════════════════════════════════════

const failures = [];

for (const irFile of irFiles) {
    const testName = path.basename(irFile, '.ir.json');
    let ir;
    
    try {
        ir = JSON.parse(fs.readFileSync(irFile, 'utf8'));
    } catch (error) {
        console.error(`❌ ${testName}: Invalid JSON - ${error.message}`);
        continue;
    }
    
    const valid = validate(ir);
    
    if (!valid) {
        console.error(`❌ ${testName}: Schema validation failed`);
        failures.push({ testName, irFile, ir, errors: validate.errors });
        
        // Show first few errors
        const preview = validate.errors.slice(0, 3);
        preview.forEach(err => {
            console.log(`   ${err.instancePath || '/'}: ${err.message}`);
        });
        
        if (validate.errors.length > 3) {
            console.log(`   ... and ${validate.errors.length - 3} more errors`);
        }
    } else {
        console.log(`✅ ${testName}`);
    }
}

console.log(`\n📊 Results: ${failures.length} failures out of ${irFiles.length} files\n`);

if (failures.length === 0) {
    console.log('🎉 ALL IR FILES VALID!');
    process.exit(0);
}

// ═══════════════════════════════════════════════════════════════
// STEP 2: Deep dive into first failure
// ═══════════════════════════════════════════════════════════════

console.log('═══════════════════════════════════════════════════════════════');
console.log(' DEEP DIVE: ' + failures[0].testName);
console.log('═══════════════════════════════════════════════════════════════\n');

const failure = failures[0];
const { ir, errors } = failure;

// Group errors by path
const errorsByPath = {};
errors.forEach(err => {
    const path = err.instancePath || '/';
    if (!errorsByPath[path]) {
        errorsByPath[path] = [];
    }
    errorsByPath[path].push(err);
});

console.log('📋 Error Summary:');
Object.keys(errorsByPath).forEach(path => {
    console.log(`\n  Path: ${path}`);
    errorsByPath[path].forEach(err => {
        console.log(`    - ${err.message}`);
        if (err.params) {
            console.log(`      Params:`, JSON.stringify(err.params, null, 2).split('\n').map(l => '      ' + l).join('\n'));
        }
    });
});

// ═══════════════════════════════════════════════════════════════
// STEP 3: Find problematic nodes
// ═══════════════════════════════════════════════════════════════

console.log('\n═══════════════════════════════════════════════════════════════');
console.log(' PROBLEMATIC NODES');
console.log('═══════════════════════════════════════════════════════════════\n');

const problematicNodes = [];

errors.forEach(err => {
    // Extract node ID from path like "/nodes/node_1TT/expression"
    const match = err.instancePath?.match(/\/nodes\/([^/]+)/);
    if (match) {
        const nodeId = match[1];
        const node = ir.nodes[nodeId];
        
        if (node && !problematicNodes.find(n => n.id === nodeId)) {
            problematicNodes.push({ id: nodeId, node });
        }
    }
});

if (problematicNodes.length === 0) {
    console.log('⚠️ No specific node identified in errors');
} else {
    problematicNodes.forEach(({ id, node }) => {
        console.log(`\n🔴 Node: ${id}`);
        console.log(`   Type: ${node.type}`);
        console.log(`   Full structure:`);
        console.log(JSON.stringify(node, null, 2).split('\n').map(l => '   ' + l).join('\n'));
    });
}

// ═══════════════════════════════════════════════════════════════
// STEP 4: Check for NodeRef violations
// ═══════════════════════════════════════════════════════════════

console.log('\n═══════════════════════════════════════════════════════════════');
console.log(' NODEREF VALIDATION');
console.log('═══════════════════════════════════════════════════════════════\n');

const nodeRefPattern = /^[^_]+_[T01]+$/;
const nodeRefFields = ['expression', 'left', 'right', 'argument', 'callee', 'object', 'property', 'test', 'consequent', 'alternate', 'init', 'body'];

console.log('Checking fields that should be NodeRef or null...\n');

let violationsFound = false;

Object.keys(ir.nodes).forEach(nodeId => {
    const node = ir.nodes[nodeId];
    
    nodeRefFields.forEach(field => {
        if (field in node) {
            const value = node[field];
            
            // Should be string (matching pattern), null, or not present
            if (value !== null && typeof value !== 'string') {
                console.error(`❌ ${nodeId}.${field}: ${typeof value} (expected string or null)`);
                console.log(`   Value: ${JSON.stringify(value)}`);
                violationsFound = true;
            } else if (typeof value === 'string' && !nodeRefPattern.test(value)) {
                console.error(`❌ ${nodeId}.${field}: Invalid NodeRef format "${value}"`);
                console.log(`   Must match pattern: ^[^_]+_[T01]+$`);
                violationsFound = true;
            }
        }
    });
});

if (!violationsFound) {
    console.log('✅ All NodeRef fields are valid');
}

// ═══════════════════════════════════════════════════════════════
// STEP 5: ROOT CAUSE ANALYSIS
// ═══════════════════════════════════════════════════════════════

console.log('\n═══════════════════════════════════════════════════════════════');
console.log(' 🎯 ROOT CAUSE ANALYSIS');
console.log('═══════════════════════════════════════════════════════════════\n');

const rootCauses = [];

errors.forEach(err => {
    if (err.message.includes('must be string') && err.instancePath?.includes('expression')) {
        rootCauses.push({
            issue: 'Boolean value in NodeRef field',
            field: 'expression',
            explanation: 'The "expression" field is expected to be a NodeRef (string) or null, but contains a boolean value.',
            likelyLocation: 'src/ir/nodes.js - Check FunctionDecl, ArrowFunctionExpression classes',
            fixStrategy: 'Change field name from "expression" to "isExpression" to avoid conflict with schema NodeRef expectations'
        });
    }
    
    if (err.keyword === 'additionalProperties') {
        rootCauses.push({
            issue: 'Unexpected field in node',
            field: err.params?.additionalProperty,
            explanation: 'Node contains a field not defined in the schema',
            likelyLocation: 'src/ir/nodes.js - Check node toJSON() methods',
            fixStrategy: 'Remove the field or add it to schema definition'
        });
    }
});

if (rootCauses.length === 0) {
    console.log('⚠️ Unable to identify specific root cause');
    console.log('💡 Manual investigation required - review error details above');
} else {
    rootCauses.forEach((cause, i) => {
        console.log(`\n🔍 ROOT CAUSE ${i + 1}:`);
        console.log(`   Issue: ${cause.issue}`);
        console.log(`   Field: ${cause.field}`);
        console.log(`   Explanation: ${cause.explanation}`);
        console.log(`   Likely Location: ${cause.likelyLocation}`);
        console.log(`   Fix Strategy: ${cause.fixStrategy}`);
    });
}

// ═══════════════════════════════════════════════════════════════
// STEP 6: Write detailed artifacts
// ═══════════════════════════════════════════════════════════════

console.log('\n═══════════════════════════════════════════════════════════════');
console.log(' 💾 WRITING ARTIFACTS');
console.log('═══════════════════════════════════════════════════════════════\n');

// Full failure details
const fullReport = {
    timestamp: new Date().toISOString(),
    testCase: failure.testName,
    summary: {
        totalErrors: errors.length,
        problematicNodes: problematicNodes.length,
        rootCauses: rootCauses.length
    },
    errors: errors,
    problematicNodes: problematicNodes.map(n => ({ id: n.id, node: n.node })),
    rootCauses: rootCauses,
    fullIR: ir
};

const fullPath = path.join(OUTPUT_DIR, 'debug-ir-full.json');
fs.writeFileSync(fullPath, JSON.stringify(fullReport, null, 2));
console.log('✅ Full report:', fullPath);

// Summary for quick reference
const summary = {
    testCase: failure.testName,
    errorCount: errors.length,
    topErrors: errors.slice(0, 5).map(e => ({
        path: e.instancePath,
        message: e.message
    })),
    rootCauses: rootCauses
};

const summaryPath = path.join(OUTPUT_DIR, 'debug-ir-summary.json');
fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
console.log('✅ Summary:', summaryPath);

// ═══════════════════════════════════════════════════════════════
// FINAL STATUS
// ═══════════════════════════════════════════════════════════════

console.log('\n═══════════════════════════════════════════════════════════════');
console.log(' 📊 DEBUGGING COMPLETE');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log(`Failures: ${failures.length}`);
console.log(`Errors analyzed: ${errors.length}`);
console.log(`Root causes identified: ${rootCauses.length}`);

if (rootCauses.length > 0) {
    console.log('\n✨ ROOT CAUSE IDENTIFIED');
    console.log('Review the fix strategies above and apply the suggested changes.\n');
    process.exit(1);
} else {
    console.log('\n⚠️ MANUAL INVESTIGATION NEEDED');
    console.log('Review artifacts/debug-ir-full.json for detailed error information.\n');
    process.exit(1);
}
