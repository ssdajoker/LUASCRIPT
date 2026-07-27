/**
 * Parser Performance Profiling Tool
 * Measures parse time, tokenization time, and identifies bottlenecks
 */

const { PHPParser } = require('../src/parsers/php_parser');
const { DartParser } = require('../src/parsers/dart_parser');
const { RubyParser } = require('../src/parsers/ruby_parser');
const { PythonParser } = require('../src/parsers/python_parser');

console.log('\n' + '═'.repeat(90));
console.log('  PARSER PERFORMANCE PROFILING ANALYSIS'.padStart(70));
console.log('═'.repeat(90) + '\n');

// Test code of varying sizes
const testCases = {
  small: {
    PHP: '$x = 10;',
    Dart: 'var x = 10;',
    Ruby: 'x = 10',
    Python: 'x = 10'
  },
  medium: {
    PHP: `
      $items = [1, 2, 3];
      foreach ($items as $item) {
        echo $item;
      }
    `,
    Dart: `
      var items = [1, 2, 3];
      for (var item in items) {
        print(item);
      }
    `,
    Ruby: `
      items = [1, 2, 3]
      items.each do |item|
        puts item
      end
    `,
    Python: `
items = [1, 2, 3]
for item in items:
    print(item)
    `
  },
  large: {
    PHP: `
      class User {
        private $id;
        private $name;
        
        public function __construct($id, $name) {
          $this->id = $id;
          $this->name = $name;
        }
        
        public function getId() {
          return $this->id;
        }
        
        public function getName() {
          return $this->name;
        }
      }
      
      $user = new User(1, "John");
      echo $user->getId();
    `,
    Dart: `
      class User {
        final int id;
        final String name;
        
        User(this.id, this.name);
        
        int getId() => id;
        String getName() => name;
      }
      
      var user = User(1, "John");
      print(user.getId());
    `,
    Ruby: `
      class User
        attr_accessor :id, :name
        
        def initialize(id, name)
          @id = id
          @name = name
        end
        
        def get_id
          @id
        end
        
        def get_name
          @name
        end
      end
      
      user = User.new(1, "John")
      puts user.get_id
    `,
    Python: `
class User:
    def __init__(self, id, name):
        self.id = id
        self.name = name
    
    def get_id(self):
        return self.id
    
    def get_name(self):
        return self.name

user = User(1, "John")
print(user.get_id())
    `
  }
};

const parserConfigs = [
  { name: 'PHP', Class: PHPParser },
  { name: 'Dart', Class: DartParser },
  { name: 'Ruby', Class: RubyParser },
  { name: 'Python', Class: PythonParser }
];

for (const size of ['small', 'medium', 'large']) {
  console.log(`\n${'█'.repeat(90)}`);
  console.log(`  ${size.toUpperCase()} CODE SIZE TESTS`);
  console.log(`${'█'.repeat(90)}\n`);
  
  for (const parserDef of parserConfigs) {
    const code = testCases[size][parserDef.name];
    if (!code) {
      console.log(`⚠️ ${parserDef.name}: No test case for ${size} size`);
      continue;
    }
    
    console.log(`\n${parserDef.name} Parser:`);
    console.log(`  Code size: ${code.length} characters, ${code.split('\n').length} lines`);
    
    // Warmup
    for (let i = 0; i < 3; i++) {
      try {
        new parserDef.Class(code).parse();
      } catch (e) {}
    }
    
    // Measure
    const times = [];
    const iterations = 100;
    
    for (let i = 0; i < iterations; i++) {
      const start = process.hrtime.bigint();
      try {
        new parserDef.Class(code).parse();
      } catch (e) {}
      const end = process.hrtime.bigint();
      times.push(Number((end - start) / BigInt(1000)) / 1000); // Convert to ms
    }
    
    const min = Math.min(...times);
    const max = Math.max(...times);
    const avg = times.reduce((a, b) => a + b) / times.length;
    const median = times.sort((a, b) => a - b)[Math.floor(iterations / 2)];
    
    console.log(`  Performance (${iterations} iterations):`);
    console.log(`    Min:    ${min.toFixed(3)}ms`);
    console.log(`    Max:    ${max.toFixed(3)}ms`);
    console.log(`    Avg:    ${avg.toFixed(3)}ms`);
    console.log(`    Median: ${median.toFixed(3)}ms`);
    
    // Performance rating
    let rating = '⚠️ SLOW';
    if (avg < 0.5) rating = '✅ FAST';
    else if (avg < 2) rating = '✓ ACCEPTABLE';
    console.log(`  ${rating}`);
  }
}

console.log('\n' + '═'.repeat(90) + '\n');
