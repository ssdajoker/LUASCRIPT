#!/usr/bin/env node

const { runRuntimeSuite } = require('../test_unified_system');

runRuntimeSuite()
    .then(success => {
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('Runtime suite failed:', error);
        process.exit(1);
    });
