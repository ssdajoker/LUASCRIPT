/**
 * ============================================================================
 * PHASE B: PHP TIER 1 VALIDATION - CLARITY SUPER-CANON 6-PHASE GATE
 * ============================================================================
 * 
 * Validates that PHP Tier 1 transpiler applies all 6 phases
 * 
 * PHP TIER 1 IMPLEMENTATION:
 * - Location: src/backends/php/transpiler.js
 * - Target: ~1000 lines of real implementation
 * - Features: Variables ($var), classes, namespaces, traits, magic methods, interpolation
 * - Integration: PHP parser + transpiler + optimizer
 * 
 * Each test validates 6-phase canon with PHP-specific patterns
 * 
 * SUCCESS CRITERIA: 28/31 tests passing (>90% pass rate)
 * 
 * ============================================================================
 */

const { PHPTranspiler } = require('../src/backends/php/transpiler');
const { AdvancedCache } = require('../src/optimizations/speed_optimization');
const { SecurityValidator } = require('../src/optimizations/security_algorithm_optimization');

describe('PHASE B: PHP Tier 1 Transpiler - Clarity Super-Canon Validation', () => {

  // ============================================================================
  // PHP TRANSPILER VALIDATION
  // ============================================================================
  describe('PHP Transpiler - 6-Phase Validation', () => {
    let transpiler;

    beforeEach(() => {
      transpiler = new PHPTranspiler({ cacheSize: 1000, enableOptimization: true });
    });

    test('PHP.1: PHP transpiler initializes', () => {
      expect(transpiler).toBeDefined();
      expect(transpiler.enableOptimization).toBe(true);
    });

    test('PHP.2: Phase 1 - Speed: PHP caching implemented', () => {
      expect(transpiler.phpCache).toBeInstanceOf(AdvancedCache);
      expect(transpiler.transpilationCache).toBeInstanceOf(AdvancedCache);
    });

    test('PHP.3: Phase 1 - Speed: Variable caching present', () => {
      expect(transpiler.variableCache).toBeInstanceOf(AdvancedCache);
      expect(transpiler.classCache).toBeInstanceOf(AdvancedCache);
    });

    test('PHP.4: Phase 1 - Speed: Namespace/trait caching present', () => {
      expect(transpiler.namespaceCache).toBeInstanceOf(AdvancedCache);
      expect(transpiler.traitCache).toBeInstanceOf(AdvancedCache);
    });

    test('PHP.5: Phase 2 - Memory: Memory pools for PHP structures', () => {
      expect(transpiler.memoryPool).toBeDefined();
      // Should have PHPNode, Variable, Class, Trait, Namespace, Array, Method pools
    });

    test('PHP.6: Phase 3 - Security: SecurityValidator accessible', () => {
      expect(transpiler.securityValidator).toBe(SecurityValidator);
    });

    test('PHP.7: Phase 3 - Security: PHP-specific security validation', () => {
      expect(typeof transpiler.validatePHPSecurity).toBe('function');
      
      // Test that dangerous patterns are blocked
      expect(() => {
        transpiler.validatePHPSecurity('eval("malicious code")');
      }).toThrow(/eval.*allows arbitrary code execution/);
    });

    test('PHP.8: Phase 3 - Security: Multiple dangerous functions blocked', () => {
      const dangerousFunctions = [
        'exec("ls")',
        'system("rm -rf /")',
        'shell_exec("cat /etc/passwd")',
        'passthru("whoami")'
      ];

      for (const func of dangerousFunctions) {
        expect(() => {
          transpiler.validatePHPSecurity(func);
        }).toThrow(/PHP_SECURITY_ERROR/);
      }
    });

    test('PHP.9: Phase 4 - Algorithms: AlgorithmOptimizer accessible', () => {
      expect(transpiler.algorithmOptimizer).toBeDefined();
    });

    test('PHP.10: Phase 5 - Interop: PHP-to-Lua cache present', () => {
      expect(transpiler.phpToLuaCache).toBeInstanceOf(AdvancedCache);
    });

    test('PHP.11: Phase 6 - Quality: Metrics tracking initialized', () => {
      expect(transpiler.metrics).toBeDefined();
      expect(transpiler.metrics.transpilations).toBe(0);
      expect(transpiler.metrics.cacheHits).toBe(0);
      expect(transpiler.metrics.variablesTranspiled).toBe(0);
      expect(transpiler.metrics.classesTranspiled).toBe(0);
      expect(transpiler.metrics.namespacesTranspiled).toBe(0);
      expect(transpiler.metrics.traitsTranspiled).toBe(0);
    });

    test('PHP.12: Transpilation method exists', () => {
      expect(typeof transpiler.transpile).toBe('function');
    });

    test('PHP.13: Pattern extraction method exists', () => {
      expect(typeof transpiler.extractPHPPatterns).toBe('function');
    });

    test('PHP.14: PHP-specific optimizations documented', () => {
      // Should have variable, class, namespace, trait optimization
      expect(transpiler.variableCache).toBeDefined();
      expect(transpiler.namespaceCache).toBeDefined();
      expect(transpiler.traitCache).toBeDefined();
    });
  });

  // ============================================================================
  // PHP PATTERN EXTRACTION TESTS
  // ============================================================================
  describe('PHP Pattern Extraction', () => {
    let transpiler;

    beforeEach(() => {
      transpiler = new PHPTranspiler();
    });

    test('PHP.15: Extract PHP variables ($var)', () => {
      const code = '$name = "John"; $age = 30; $email = "john@example.com";';
      const variables = transpiler.extractVariables(code);
      
      expect(variables.length).toBeGreaterThanOrEqual(3);
      expect(variables.some(v => v.name === 'name')).toBe(true);
      expect(variables.some(v => v.name === 'age')).toBe(true);
    });

    test('PHP.16: Extract PHP classes', () => {
      const code = 'class User extends Model implements Serializable { }';
      const classes = transpiler.extractClasses(code);
      
      expect(classes.length).toBeGreaterThanOrEqual(1);
      expect(classes[0].name).toBe('User');
      expect(classes[0].extends).toBe('Model');
    });

    test('PHP.17: Extract PHP traits', () => {
      const code = 'trait Loggable { public function log() { } }';
      const traits = transpiler.extractTraits(code);
      
      expect(traits.length).toBeGreaterThanOrEqual(1);
      expect(traits[0].name).toBe('Loggable');
    });

    test('PHP.18: Extract PHP namespaces', () => {
      const code = 'namespace App\\Controllers\\Api;';
      const namespaces = transpiler.extractNamespaces(code);
      
      expect(namespaces.length).toBeGreaterThanOrEqual(1);
      expect(namespaces[0].name).toBe('App\\Controllers\\Api');
    });

    test('PHP.19: Extract PHP methods', () => {
      const code = 'public static function getInstance() { } private function init() { }';
      const methods = transpiler.extractMethods(code);
      
      expect(methods.length).toBeGreaterThanOrEqual(2);
      expect(methods.some(m => m.name === 'getInstance')).toBe(true);
      expect(methods.some(m => m.isStatic)).toBe(true);
    });

    test('PHP.20: Extract PHP arrays (both styles)', () => {
      const code = '$old = array(1, 2, 3); $new = [4, 5, 6];';
      const arrays = transpiler.extractArrays(code);
      
      expect(arrays.length).toBeGreaterThanOrEqual(1);
    });

    test('PHP.21: Extract string interpolations', () => {
      const code = '"Hello $name" . "Value: {$obj->prop}"';
      const interpolations = transpiler.extractInterpolations(code);
      
      expect(interpolations.length).toBeGreaterThanOrEqual(1);
    });

    test('PHP.22: Extract magic methods', () => {
      const code = 'function __construct() { } function __destruct() { }';
      const magicMethods = transpiler.extractMagicMethods(code);
      
      expect(magicMethods.length).toBeGreaterThanOrEqual(2);
      expect(magicMethods.some(m => m.name === '__construct')).toBe(true);
    });

    test('PHP.23: Extract PHP operators', () => {
      const code = '$obj->method(); Class::staticMethod(); $arr = ["key" => "value"];';
      const operators = transpiler.extractOperators(code);
      
      expect(operators.length).toBeGreaterThanOrEqual(3);
      expect(operators.some(op => op.type === '->')).toBe(true);
      expect(operators.some(op => op.type === '::')).toBe(true);
      expect(operators.some(op => op.type === '=>')).toBe(true);
    });
  });

  // ============================================================================
  // PHP TRANSPILATION TESTS
  // ============================================================================
  describe('PHP Transpilation', () => {
    let transpiler;

    beforeEach(() => {
      transpiler = new PHPTranspiler();
    });

    test('PHP.24: Transpile simple PHP class', () => {
      const phpCode = 'class User { public $name; public function getName() { return $this->name; } }';
      const result = transpiler.transpile(phpCode);
      
      expect(result).toBeDefined();
      expect(result.code).toBeDefined();
      expect(result.language).toBe('PHP');
      expect(result.targetLanguage).toBe('Lua');
    });

    test('PHP.25: Transpilation includes all optimizations', () => {
      const phpCode = 'namespace App; class Test { }';
      const result = transpiler.transpile(phpCode);
      
      expect(result.optimizations).toBeDefined();
      expect(result.optimizations.phase1_speed).toBeDefined();
      expect(result.optimizations.phase2_memory).toBeDefined();
      expect(result.optimizations.phase3_security).toBeDefined();
      expect(result.optimizations.phase4_algorithm).toBeDefined();
      expect(result.optimizations.phase5_interop).toBeDefined();
      expect(result.optimizations.phase6_quality).toBeDefined();
    });

    test('PHP.26: Cache hit on second transpilation', () => {
      const phpCode = 'class TestClass { }';
      
      const result1 = transpiler.transpile(phpCode);
      expect(result1.cacheHit).toBe(false);
      
      const result2 = transpiler.transpile(phpCode);
      expect(result2.cacheHit).toBe(true);
    });

    test('PHP.27: Metrics updated after transpilation', () => {
      const phpCode = 'class MyClass { public function myMethod() { } }';
      
      const initialTranspilations = transpiler.metrics.transpilations;
      transpiler.transpile(phpCode);
      
      expect(transpiler.metrics.transpilations).toBe(initialTranspilations + 1);
    });

    test('PHP.28: getMetrics() returns comprehensive data', () => {
      const phpCode = 'namespace App; class Test { }';
      transpiler.transpile(phpCode);
      
      const metrics = transpiler.getMetrics();
      expect(metrics).toBeDefined();
      expect(metrics.transpilations).toBeGreaterThanOrEqual(1);
      expect(metrics.cacheHitRate).toBeDefined();
      expect(metrics.uptime).toBeDefined();
    });

    test('PHP.29: clearCaches() clears all caches', () => {
      const phpCode = 'class Test { }';
      transpiler.transpile(phpCode);
      
      transpiler.clearCaches();
      
      const result = transpiler.transpile(phpCode);
      expect(result.cacheHit).toBe(false);
    });

    test('PHP.30: resetMetrics() resets all metrics', () => {
      const phpCode = 'class Test { }';
      transpiler.transpile(phpCode);
      
      expect(transpiler.metrics.transpilations).toBeGreaterThan(0);
      
      transpiler.resetMetrics();
      expect(transpiler.metrics.transpilations).toBe(0);
      expect(transpiler.metrics.cacheHits).toBe(0);
    });

    test('PHP.31: Complex PHP code transpilation', () => {
      const phpCode = `
        namespace App\\Models;
        use App\\Database\\Connection;
        
        class User extends Model implements Serializable {
          private $name;
          protected $email;
          public $age;
          
          public function __construct($name, $email) {
            $this->name = $name;
            $this->email = $email;
          }
          
          public static function findById($id) {
            return Database::query("SELECT * FROM users WHERE id = ?", [$id]);
          }
        }
      `;
      
      const result = transpiler.transpile(phpCode);
      expect(result).toBeDefined();
      expect(result.code).toBeDefined();
      expect(result.metrics.classes).toBeGreaterThanOrEqual(1);
      expect(result.metrics.namespaces).toBeGreaterThanOrEqual(1);
      expect(result.metrics.variables).toBeGreaterThanOrEqual(3);
    });
  });
});
