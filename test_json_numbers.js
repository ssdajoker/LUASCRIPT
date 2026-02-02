const {JSONParser} = require('./src/parsers/json_parser');

console.log('Testing JSON number parsing...\n');

try {
  const p1 = new JSONParser('42');
  console.log('Source:', p1.source, 'Type:', typeof p1.source, 'Length:', p1.source.length);
  const ast1 = p1.parse();
  console.log('✓ Integer 42:', JSON.stringify(ast1));
} catch (e) {
  console.log('✗ Integer 42:', e.message);
  console.log('Stack:', e.stack);
}

try {
  const p2 = new JSONParser('3.14');
  const ast2 = p2.parse();
  console.log('✓ Float 3.14:', JSON.stringify(ast2));
} catch (e) {
  console.log('✗ Float 3.14:', e.message);
  console.log('Stack:', e.stack);
}
