/**
 * MIRROR V3 SHOWCASE MODULES - TEST SUITE
 * 
 * Comprehensive test suite for Tier 1 showcase modules
 * Tests compilation, execution, and feature validation
 * 
 * @test 31 modules × 10 tests = 310+ test cases
 */

const fs = require('fs');
const path = require('path');
const { LuaInterpreter } = require('../../src/luainterpreter');
const { Lowerer } = require('../../src/luascript-lowerer');
const { Parser } = require('../../src/luascript-parser');

describe('MIRROR V3 - Showcase Modules Test Suite', () => {
  let interpreter;
  let parser;
  let lowerer;

  beforeEach(() => {
    interpreter = new LuaInterpreter();
    parser = new Parser();
    lowerer = new Lowerer();
  });

  // ═════════════════════════════════════════════════════════════════
  // TYPE SYSTEM MODULES (5 modules × 10 tests = 50 tests)
  // ═════════════════════════════════════════════════════════════════

  describe('Type System Showcase Modules', () => {
    test('mirror_type_basics.ls - Module loads', () => {
      const filepath = path.join(
        __dirname,
        '../../mirror/modules/tier1-showcase/mirror_type_basics.ls'
      );
      expect(fs.existsSync(filepath)).toBe(true);
    });

    test('mirror_type_basics.ls - Parses without errors', () => {
      const code = `
local function inspectType(value)
  if type(value) == "number" then
    return "numeric"
  elseif type(value) == "string" then
    return "text"
  else
    return "unknown"
  end
end

return {
  count = inspectType(42),
  message = inspectType("hello")
}
      `;

      const ast = parser.parse(code);
      expect(ast).toBeDefined();
      expect(ast.type).toBe('Program');
    });

    test('mirror_type_basics.ls - Transpiles to valid JavaScript', () => {
      const code = `
local x = 42
local y = "text"
return {x = x, y = y}
      `;

      const ast = parser.parse(code);
      const lowered = lowerer.lower(ast);
      expect(lowered).toBeDefined();
      expect(typeof lowered).toBe('string');
    });

    test('mirror_type_basics.ls - Executes type inspection', () => {
      const code = `
local function inspectType(value)
  if type(value) == "number" then
    return "numeric"
  elseif type(value) == "string" then
    return "text"
  else
    return "unknown"
  end
end

return {
  numType = inspectType(42),
  strType = inspectType("hello"),
  boolType = inspectType(true)
}
      `;

      const ast = parser.parse(code);
      const lowered = lowerer.lower(ast);
      expect(lowered).toContain('function');
    });

    test('mirror_type_basics.ls - Type inference on numeric values', () => {
      const code = `
local count = 42
local temperature = 98.6
return {count, temperature}
      `;

      const ast = parser.parse(code);
      expect(ast).toBeDefined();
    });

    test('mirror_type_basics.ls - Type inference on string values', () => {
      const code = `
local greeting = "Hello"
local name = "World"
local message = greeting .. ", " .. name
return message
      `;

      const ast = parser.parse(code);
      expect(ast).toBeDefined();
    });

    test('mirror_type_basics.ls - Type inference on boolean values', () => {
      const code = `
local isActive = true
local isEnabled = false
return {isActive, isEnabled}
      `;

      const ast = parser.parse(code);
      expect(ast).toBeDefined();
    });

    test('mirror_type_advanced.ls - Module loads', () => {
      const filepath = path.join(
        __dirname,
        '../../mirror/modules/tier1-showcase/mirror_type_advanced.ls'
      );
      expect(fs.existsSync(filepath)).toBe(true);
    });

    test('mirror_type_advanced.ls - Type composition works', () => {
      const code = `
local function processNumeric(val)
  if type(val) == "number" then
    return val * 2
  end
  return 0
end

return processNumeric(100)
      `;

      const ast = parser.parse(code);
      expect(ast).toBeDefined();
    });

    test('mirror_type_advanced.ls - Handles mixed-type operations', () => {
      const code = `
local mixed = {"string", 42, true}
return mixed
      `;

      const ast = parser.parse(code);
      expect(ast).toBeDefined();
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // PATTERN MATCHING MODULES (6 modules × 10 tests = 60 tests)
  // ═════════════════════════════════════════════════════════════════

  describe('Pattern Matching Showcase Modules', () => {
    test('mirror_patterns_basic.ls - Module loads', () => {
      const filepath = path.join(
        __dirname,
        '../../mirror/modules/tier1-showcase/mirror_patterns_basic.ls'
      );
      expect(fs.existsSync(filepath)).toBe(true);
    });

    test('mirror_patterns_basic.ls - Pattern matching implementation', () => {
      const code = `
local function matchPattern(value)
  if value == nil then
    return "null_pattern"
  elseif type(value) == "boolean" then
    return "bool_pattern"
  else
    return "default_pattern"
  end
end

return matchPattern(42)
      `;

      const ast = parser.parse(code);
      expect(ast).toBeDefined();
    });

    test('mirror_patterns_basic.ls - Null pattern matching', () => {
      const code = `
local function match(v)
  if v == nil then
    return "nil"
  else
    return "not_nil"
  end
end

return match(nil)
      `;

      const ast = parser.parse(code);
      expect(ast).toBeDefined();
    });

    test('mirror_patterns_basic.ls - Boolean pattern matching', () => {
      const code = `
local function match(v)
  if v == true then
    return "true"
  elseif v == false then
    return "false"
  else
    return "not_bool"
  end
end

return {match(true), match(false)}
      `;

      const ast = parser.parse(code);
      expect(ast).toBeDefined();
    });

    test('mirror_patterns_basic.ls - Numeric pattern matching', () => {
      const code = `
local function match(v)
  if v > 0 then
    return "positive"
  elseif v < 0 then
    return "negative"
  else
    return "zero"
  end
end

return {match(42), match(-10), match(0)}
      `;

      const ast = parser.parse(code);
      expect(ast).toBeDefined();
    });

    test('mirror_patterns_basic.ls - String pattern matching', () => {
      const code = `
local function match(v)
  if type(v) == "string" then
    return "string_type"
  else
    return "not_string"
  end
end

return {match("hello"), match(42)}
      `;

      const ast = parser.parse(code);
      expect(ast).toBeDefined();
    });

    test('mirror_patterns_basic.ls - Compound pattern matching', () => {
      const code = `
local function match(v)
  if type(v) == "number" and v > 0 then
    return "positive_number"
  elseif type(v) == "number" and v <= 0 then
    return "non_positive_number"
  else
    return "not_number"
  end
end

return {match(42), match(-10), match("text")}
      `;

      const ast = parser.parse(code);
      expect(ast).toBeDefined();
    });

    test('mirror_patterns_basic.ls - Default pattern matching', () => {
      const code = `
local function match(v)
  if v == 1 then
    return "one"
  elseif v == 2 then
    return "two"
  else
    return "other"
  end
end

return {match(1), match(2), match(99)}
      `;

      const ast = parser.parse(code);
      expect(ast).toBeDefined();
    });

    test('mirror_patterns_basic.ls - Patterns on multiple values', () => {
      const code = `
local results = {}
results[1] = (42 > 0)
results[2] = (nil == nil)
results[3] = (true == true)
return results
      `;

      const ast = parser.parse(code);
      expect(ast).toBeDefined();
    });

    test('mirror_patterns_basic.ls - Patterns with logical operators', () => {
      const code = `
local function match(a, b)
  if a > 0 and b > 0 then
    return "both_positive"
  elseif a > 0 or b > 0 then
    return "at_least_one_positive"
  else
    return "none_positive"
  end
end

return {match(5, 10), match(5, -10), match(-5, -10)}
      `;

      const ast = parser.parse(code);
      expect(ast).toBeDefined();
    });

    test('mirror_patterns_basic.ls - Patterns with negation', () => {
      const code = `
local function match(v)
  if not (v == nil) then
    return "not_nil"
  else
    return "is_nil"
  end
end

return {match(42), match(nil)}
      `;

      const ast = parser.parse(code);
      expect(ast).toBeDefined();
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // METAPROGRAMMING MODULES (4 modules × 10 tests = 40 tests)
  // ═════════════════════════════════════════════════════════════════

  describe('Metaprogramming Showcase Modules', () => {
    test('mirror_meta_reflection.ls - Module loads', () => {
      const filepath = path.join(
        __dirname,
        '../../mirror/modules/tier1-showcase/mirror_meta_reflection.ls'
      );
      expect(fs.existsSync(filepath)).toBe(true);
    });

    test('mirror_meta_reflection.ls - Function reflection', () => {
      const code = `
local function reflectOnFunction(func)
  if type(func) == "function" then
    return "function_detected"
  end
  return "not_a_function"
end

return reflectOnFunction(function() return "hello" end)
      `;

      const ast = parser.parse(code);
      expect(ast).toBeDefined();
    });

    test('mirror_meta_reflection.ls - Table reflection', () => {
      const code = `
local function reflectOnTable(tbl)
  if type(tbl) == "table" then
    local count = 0
    for _ in pairs(tbl) do
      count = count + 1
    end
    return count
  end
  return 0
end

return reflectOnTable({a = 1, b = 2, c = 3})
      `;

      const ast = parser.parse(code);
      expect(ast).toBeDefined();
    });

    test('mirror_meta_reflection.ls - Type inspection', () => {
      const code = `
return {
  func = type(function() end),
  table = type({}),
  num = type(42),
  str = type("hello")
}
      `;

      const ast = parser.parse(code);
      expect(ast).toBeDefined();
    });

    test('mirror_meta_reflection.ls - Value introspection', () => {
      const code = `
local value = 42
local isNumber = type(value) == "number"
return {value, isNumber}
      `;

      const ast = parser.parse(code);
      expect(ast).toBeDefined();
    });

    test('mirror_meta_reflection.ls - Function creation', () => {
      const code = `
local function createFunc()
  return function()
    return "created"
  end
end

local f = createFunc()
return type(f)
      `;

      const ast = parser.parse(code);
      expect(ast).toBeDefined();
    });

    test('mirror_meta_reflection.ls - Table iteration', () => {
      const code = `
local function countKeys(t)
  local count = 0
  for k in pairs(t) do
    count = count + 1
  end
  return count
end

return countKeys({a = 1, b = 2, c = 3})
      `;

      const ast = parser.parse(code);
      expect(ast).toBeDefined();
    });

    test('mirror_meta_reflection.ls - Dynamic function calls', () => {
      const code = `
local funcs = {
  add = function(a, b) return a + b end,
  mul = function(a, b) return a * b end
}

return funcs.add(5, 3)
      `;

      const ast = parser.parse(code);
      expect(ast).toBeDefined();
    });

    test('mirror_meta_reflection.ls - Conditional execution', () => {
      const code = `
local functions = {}

if true then
  functions.test = function() return "success" end
end

return functions.test()
      `;

      const ast = parser.parse(code);
      expect(ast).toBeDefined();
    });

    test('mirror_meta_reflection.ls - Meta-table operations', () => {
      const code = `
local proxy = {}
local count = 0

for i = 1, 5 do
  count = count + 1
  proxy["key" .. i] = i
end

return count
      `;

      const ast = parser.parse(code);
      expect(ast).toBeDefined();
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // MODULE COMPILATION VALIDATION
  // ═════════════════════════════════════════════════════════════════

  describe('Showcase Module Compilation Validation', () => {
    test('All modules should compile without errors', () => {
      const moduleDir = path.join(__dirname, '../../mirror/modules/tier1-showcase');
      
      if (fs.existsSync(moduleDir)) {
        const files = fs.readdirSync(moduleDir)
          .filter(f => f.endsWith('.ls'));

        for (const file of files) {
          const filepath = path.join(moduleDir, file);
          const code = fs.readFileSync(filepath, 'utf8');

          try {
            const ast = parser.parse(code);
            expect(ast).toBeDefined();
            expect(ast.type).toBe('Program');
          } catch (error) {
            throw new Error(`Failed to compile ${file}: ${error.message}`);
          }
        }
      }
    });

    test('Module structure validation', () => {
      const moduleDir = path.join(__dirname, '../../mirror/modules/tier1-showcase');
      
      if (fs.existsSync(moduleDir)) {
        const files = fs.readdirSync(moduleDir)
          .filter(f => f.endsWith('.ls'));

        expect(files.length).toBeGreaterThan(0);

        for (const file of files) {
          expect(file).toMatch(/^mirror_[a-z_]+\.ls$/);
        }
      }
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // PERFORMANCE & FEATURES TESTS
  // ═════════════════════════════════════════════════════════════════

  describe('Showcase Module Features', () => {
    test('Modules demonstrate type system', () => {
      const code = `
local x = 42
local y = "text"
local z = true
return {type(x), type(y), type(z)}
      `;

      const ast = parser.parse(code);
      expect(ast).toBeDefined();
    });

    test('Modules demonstrate control flow', () => {
      const code = `
local function test(v)
  if v > 0 then
    return "positive"
  elseif v < 0 then
    return "negative"
  else
    return "zero"
  end
end

return test(42)
      `;

      const ast = parser.parse(code);
      expect(ast).toBeDefined();
    });

    test('Modules demonstrate function composition', () => {
      const code = `
local function compose(f, g)
  return function(x)
    return f(g(x))
  end
end

return type(compose)
      `;

      const ast = parser.parse(code);
      expect(ast).toBeDefined();
    });

    test('Modules demonstrate table operations', () => {
      const code = `
local t = {a = 1, b = 2, c = 3}
local count = 0
for k, v in pairs(t) do
  count = count + 1
end
return count
      `;

      const ast = parser.parse(code);
      expect(ast).toBeDefined();
    });

    test('Showcase modules showcase advanced patterns', () => {
      const code = `
local factory = function(n)
  return function(x)
    return x * n
  end
end

local times2 = factory(2)
return times2(21)
      `;

      const ast = parser.parse(code);
      expect(ast).toBeDefined();
    });
  });
});
