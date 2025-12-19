// Quick test runner - runs harness without stdin
const { execSync } = require('child_process');

console.log('Running harness tests...\n');

try {
  const output = execSync('node tests/ir/harness.test.js', {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 30000
  });
  console.log(output);
  console.log('\n✅ Harness tests completed successfully');
} catch (err) {
  console.error('❌ Harness tests failed:');
  console.error(err.stdout || err.message);
  process.exit(1);
}
