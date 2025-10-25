#!/usr/bin/env node

const { runTranspilerSuite } = require('../test_unified_system');

runTranspilerSuite()
    .then(success => {
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('Transpiler suite failed:', error);
        process.exit(1);
    });
