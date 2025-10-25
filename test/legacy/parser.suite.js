#!/usr/bin/env node

const { runParserSuite } = require('../test_unified_system');

runParserSuite()
    .then(success => {
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('Parser suite failed:', error);
        process.exit(1);
    });
