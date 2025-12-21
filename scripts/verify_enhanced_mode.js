/**
 * Enhanced Mode Verification Script
 * Conditionally runs enhanced pipeline tests when LUASCRIPT_USE_ENHANCED_IR=1
 * Exit codes:
 *   0 - Success (enhanced tests passed or skipped)
 *   1 - Failure (enhanced tests failed)
 */

const { spawn } = require('child_process');
const path = require('path');

const isEnhancedMode = process.env.LUASCRIPT_USE_ENHANCED_IR === '1';

if (!isEnhancedMode) {
    console.log('⏭️  Enhanced IR mode disabled (set LUASCRIPT_USE_ENHANCED_IR=1 to enable)');
    process.exit(0);
}

console.log('🚀 Running enhanced pipeline verification...\n');

const testScript = path.resolve(__dirname, '../tests/parity/run_phase3.js');

const child = spawn('node', [testScript], {
    stdio: 'inherit',
    env: { ...process.env, LUASCRIPT_USE_ENHANCED_IR: '1' }
});

child.on('close', (code) => {
    if (code === 0) {
        console.log('\n✅ Enhanced pipeline verification passed');
    } else {
        console.error('\n❌ Enhanced pipeline verification failed');
    }
    process.exit(code);
});

child.on('error', (err) => {
    console.error('❌ Failed to run enhanced pipeline tests:', err.message);
    process.exit(1);
});
