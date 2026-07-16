const {PHPParser} = require('./src/parsers/php_parser');
const {DartParser} = require('./src/parsers/dart_parser');

console.log('=== PHP Ternary Test ===');
const phpTest = '$x ? "yes" : "no"';
const phpParser = new PHPParser(phpTest);
try {
  const ast = phpParser.parse();
  console.log('✓ Parsed OK');
  console.log('Stats:', phpParser.getMemoryStats());
} catch(e) {
  console.log('✗ Error:', e.message);
}

console.log('\n=== Dart Ternary Test ===');
const dartTest = 'x ? "yes" : "no"';
const dartParser = new DartParser(dartTest);
try {
  const ast = dartParser.parse();
  console.log('✓ Parsed OK');
  console.log('Stats:', dartParser.getMemoryStats());
} catch(e) {
  console.log('✗ Error:', e.message);
}

console.log('\n=== PHP Null Coalesce Test ===');
const phpNullCoal = '$x ?? "default"';
const phpParser2 = new PHPParser(phpNullCoal);
try {
  const ast = phpParser2.parse();
  console.log('✓ Parsed OK');
  console.log('Stats:', phpParser2.getMemoryStats());
} catch(e) {
  console.log('✗ Error:', e.message);
}

console.log('\n=== Dart Null Coalesce Test ===');
const dartNullCoal = 'x ?? "default"';
const dartParser2 = new DartParser(dartNullCoal);
try {
  const ast = dartParser2.parse();
  console.log('✓ Parsed OK');
  console.log('Stats:', dartParser2.getMemoryStats());
} catch(e) {
  console.log('✗ Error:', e.message);
}
