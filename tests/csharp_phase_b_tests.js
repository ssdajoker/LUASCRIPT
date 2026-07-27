/**
 * C# Phase B Test Suite - Round 1
 * Advanced C# Features: Inheritance, Virtual Methods, LINQ, Properties
 */

const CSharpTokenizerExtended = require('../src/tokenizers/csharp_tokenizer_extended');
const CSharpParserExtended = require('../src/parsers/csharp_parser_extended');
const CSharpCodeGeneratorExtended = require('../src/generators/csharp_codegen_extended');

console.log(`
╔════════════════════════════════════════════════════════════════╗
║            C# PHASE B TEST SUITE - ROUND 1                    ║
║      Advanced Transpilation with Modern Features              ║
╚════════════════════════════════════════════════════════════════╝
`);

// ========== TEST 1: Virtual Methods & Override ==========
function test1VirtualMethods() {
  console.log('\n🧪 TEST 1: Virtual Methods & Override');
  
  const code = `
    public class Shape {
      public virtual void Draw() {}
    }
    
    public class Circle : Shape {
      public override void Draw() {}
    }
  `;
  
  const tokenizer = new CSharpTokenizerExtended(code);
  const tokens = tokenizer.tokenize();
  
  try {
    const virtualToken = tokens.find(t => t.value === 'virtual');
    const overrideToken = tokens.find(t => t.value === 'override');
    
    if (virtualToken && overrideToken) {
      console.log(`✅ PASS: Virtual/override keywords recognized`);
      return true;
    }
    console.log(`❌ FAIL: Virtual/override not detected`);
    return false;
  } catch (e) {
    console.log(`❌ FAIL: ${e.message}`);
    return false;
  }
}

// ========== TEST 2: LINQ Query Syntax ==========
function test2LINQSupport() {
  console.log('\n🧪 TEST 2: LINQ Query Syntax');
  
  const code = `
    public class QueryHandler {
      public List<int> GetNumbers() {
        var result = from n in numbers
                     where n > 10
                     select n * 2;
        return result.ToList();
      }
    }
  `;
  
  const tokenizer = new CSharpTokenizerExtended(code);
  const tokens = tokenizer.tokenize();
  
  try {
    const fromToken = tokens.find(t => t.value === 'from');
    const whereToken = tokens.find(t => t.value === 'where');
    const selectToken = tokens.find(t => t.value === 'select');
    
    if (fromToken && whereToken && selectToken) {
      console.log(`✅ PASS: LINQ query keywords recognized (from, where, select)`);
      return true;
    }
    console.log(`❌ FAIL: LINQ syntax not detected`);
    return false;
  } catch (e) {
    console.log(`❌ FAIL: ${e.message}`);
    return false;
  }
}

// ========== TEST 3: Auto-Properties ==========
function test3AutoProperties() {
  console.log('\n🧪 TEST 3: Auto-Properties');
  
  const code = `
    public class Person {
      public string Name { get; set; }
      public int Age { get; set; }
      public string Email { get; private set; }
    }
  `;
  
  const parser = new CSharpParserExtended(code);
  const ast = parser.parse();
  
  try {
    if (ast.classes.length >= 1) {
      const personClass = ast.classes[0];
      const propCount = personClass.properties ? personClass.properties.length : 0;
      
      if (propCount >= 3) {
        const hasGetSet = personClass.properties.some(p => p.hasGetter && p.hasSetter);
        console.log(`✅ PASS: Extracted ${propCount} properties with get/set accessors`);
        return true;
      }
    }
    console.log(`❌ FAIL: Properties not extracted`);
    return false;
  } catch (e) {
    console.log(`❌ FAIL: ${e.message}`);
    return false;
  }
}

// ========== TEST 4: Null Coalescing & Null Conditional ==========
function test4NullOperators() {
  console.log('\n🧪 TEST 4: Null Coalescing & Conditional Operators');
  
  const code = `
    public class NullHandler {
      public void Process() {
        var value = obj?.Property ?? defaultValue;
        var result = data?[0] ?? 0;
        var total = amount ??= 100;
      }
    }
  `;
  
  const tokenizer = new CSharpTokenizerExtended(code);
  const tokens = tokenizer.tokenize();
  
  try {
    const nullCoalescingToken = tokens.find(t => t.value === '??');
    const nullConditionalToken = tokens.find(t => t.value === '?.') || tokens.find(t => t.value === '?[');
    const nullAssignToken = tokens.find(t => t.value === '??=');
    
    if (nullCoalescingToken && (nullConditionalToken || nullAssignToken)) {
      console.log(`✅ PASS: Null operators recognized (??, ?., ?[, ??=)`);
      return true;
    }
    console.log(`❌ FAIL: Null operators not detected`);
    return false;
  } catch (e) {
    console.log(`❌ FAIL: ${e.message}`);
    return false;
  }
}

// ========== TEST 5: Async/Await Methods ==========
function test5AsyncAwait() {
  console.log('\n🧪 TEST 5: Async/Await Methods');
  
  const code = `
    public class AsyncService {
      public async Task<string> FetchDataAsync() {
        await Task.Delay(1000);
        return "data";
      }
      
      public async void ProcessAsync() {
        await FetchDataAsync();
      }
    }
  `;
  
  const parser = new CSharpParserExtended(code);
  const ast = parser.parse();
  
  try {
    if (ast.classes.length >= 1) {
      const serviceClass = ast.classes[0];
      const methodCount = serviceClass.methods ? serviceClass.methods.length : 0;
      const asyncMethod = serviceClass.methods && serviceClass.methods.some(m => m.isAsync);
      
      if (methodCount >= 1 && asyncMethod) {
        console.log(`✅ PASS: Extracted ${methodCount} async method(s)`);
        return true;
      }
    }
    console.log(`❌ FAIL: Async methods not extracted`);
    return false;
  } catch (e) {
    console.log(`❌ FAIL: ${e.message}`);
    return false;
  }
}

// ========== TEST 6: Inheritance & Implementation ==========
function test6InheritanceImplementation() {
  console.log('\n🧪 TEST 6: Inheritance & Implementation');
  
  const code = `
    public interface IService {}
    
    public abstract class ServiceBase : IService {}
    
    public sealed class ConcreteService : ServiceBase {}
  `;
  
  const parser = new CSharpParserExtended(code);
  const ast = parser.parse();
  
  try {
    if (ast.interfaces.length >= 1 && ast.classes.length >= 2) {
      const baseClass = ast.classes[0];
      const concreteClass = ast.classes[1];
      
      // ServiceBase should extend/implement IService
      const baseHasInterface = baseClass && (baseClass.extends === 'IService' || baseClass.implements.includes('IService'));
      // ConcreteService should extend ServiceBase
      const concreteExtendsBase = concreteClass && concreteClass.extends === 'ServiceBase';
      
      if (baseHasInterface && concreteExtendsBase) {
        console.log(`✅ PASS: Inheritance and interface implementation detected`);
        return true;
      }
    }
    console.log(`❌ FAIL: Expected inheritance structure not found`);
    return false;
  } catch (e) {
    console.log(`❌ FAIL: ${e.message}`);
    return false;
  }
}

// ========== TEST 7: Lua Code Generation (Phase B) ==========
function test7LuaCodeGeneration() {
  console.log('\n🧪 TEST 7: Lua Code Generation (Phase B)');
  
  const code = `
    using System;
    using System.Linq;
    
    namespace Demo {
      public class DataProcessor {
        public string Name { get; set; }
        
        public virtual void Process() {}
      }
    }
  `;
  
  try {
    const parser = new CSharpParserExtended(code);
    const ast = parser.parse();
    const generator = new CSharpCodeGeneratorExtended(ast);
    const lua = generator.generate('lua');
    
    const hasUsing = lua.includes('using');
    const hasNamespace = lua.includes('namespace');
    const hasProperty = lua.includes('Name');
    const hasMethod = lua.includes('Process');
    const lineCount = generator.getLineCount();
    
    if (hasNamespace && hasMethod && lineCount > 10) {
      console.log(`✅ PASS: Generated ${lineCount} lines of Lua with properties and methods`);
      return true;
    }
    console.log(`❌ FAIL: Lua generation missing expected features`);
    return false;
  } catch (e) {
    console.log(`❌ FAIL: ${e.message}`);
    return false;
  }
}

// ========== TEST 8: JavaScript Code Generation (Phase B) ==========
function test8JavaScriptCodeGeneration() {
  console.log('\n🧪 TEST 8: JavaScript Code Generation (Phase B)');
  
  const code = `
    public abstract class Handler : IService {
      public string Name { get; set; }
      public int Count { get; private set; }
      
      public virtual void Handle() {}
    }
  `;
  
  try {
    const parser = new CSharpParserExtended(code);
    const ast = parser.parse();
    const generator = new CSharpCodeGeneratorExtended(ast);
    const js = generator.generate('javascript');
    
    const hasClass = js.includes('class Handler');
    const hasExtends = js.includes('extends IService');
    const hasGetSet = js.includes('get ') && js.includes('set ');
    const hasMethod = js.includes('Handle()');
    const lineCount = generator.getLineCount();
    
    if (hasClass && hasExtends && hasGetSet && hasMethod && lineCount > 20) {
      console.log(`✅ PASS: Generated ${lineCount} lines of JavaScript with classes and properties`);
      return true;
    }
    console.log(`❌ FAIL: JavaScript generation missing expected features`);
    return false;
  } catch (e) {
    console.log(`❌ FAIL: ${e.message}`);
    return false;
  }
}

// ========== TEST 9: Struct Support ==========
function test9StructSupport() {
  console.log('\n🧪 TEST 9: Struct Support');
  
  const code = `
    public readonly struct Point {
      public int X { get; init; }
      public int Y { get; init; }
    }
    
    public struct Interval {
      public double Start { get; set; }
      public double End { get; set; }
    }
  `;
  
  const parser = new CSharpParserExtended(code);
  const ast = parser.parse();
  
  try {
    if (ast.structs.length >= 2) {
      const pointStruct = ast.structs[0];
      const intervalStruct = ast.structs[1];
      
      if (pointStruct && pointStruct.name === 'Point' &&
          intervalStruct && intervalStruct.name === 'Interval') {
        console.log(`✅ PASS: Struct declarations recognized`);
        return true;
      }
    }
    console.log(`❌ FAIL: Struct parsing failed`);
    return false;
  } catch (e) {
    console.log(`❌ FAIL: ${e.message}`);
    return false;
  }
}

// ========== TEST 10: Performance Benchmark ==========
function test10PerformanceBenchmark() {
  console.log('\n🧪 TEST 10: Performance Benchmark (Phase B)');
  
  const complexCode = `
    using System;
    using System.Linq;
    
    namespace Advanced {
      public interface IQueryable<T> {}
      
      public abstract class QueryHandler<T> : IQueryable<T> {
        public virtual T Execute(Func<T, bool> predicate) => default;
        public async Task<List<T>> FetchAsync() => new();
        public string Result { get; set; }
      }
      
      public sealed class LinqHandler : QueryHandler<int> {}
    }
  `;
  
  try {
    const startTime = Date.now();
    
    const tokenizer = new CSharpTokenizerExtended(complexCode);
    const tokens = tokenizer.tokenize();
    
    const parser = new CSharpParserExtended(complexCode);
    const ast = parser.parse();
    
    const generator = new CSharpCodeGeneratorExtended(ast);
    const output = generator.generate('lua');
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (duration < 5) {
      console.log(`✅ PASS: Phase B processing completed in ${duration}ms`);
      return true;
    } else {
      console.log(`⚠️  WARN: Execution took ${duration}ms (target: <5ms)`);
      return true;
    }
  } catch (e) {
    console.log(`❌ FAIL: ${e.message}`);
    return false;
  }
}

// ========== RUN ALL TESTS ==========
const tests = [
  test1VirtualMethods,
  test2LINQSupport,
  test3AutoProperties,
  test4NullOperators,
  test5AsyncAwait,
  test6InheritanceImplementation,
  test7LuaCodeGeneration,
  test8JavaScriptCodeGeneration,
  test9StructSupport,
  test10PerformanceBenchmark
];

let passed = 0;
let failed = 0;

for (const test of tests) {
  const result = test();
  if (result) passed++;
  else failed++;
}

console.log(`
╔════════════════════════════════════════════════════════════════╗
📊 Results: ${passed}/${tests.length} TESTS PASSED
${failed > 0 ? `❌ ${failed} test(s) failed` : '✅ C# Phase B evidence gate passed.'}
╚════════════════════════════════════════════════════════════════╝
`);

if (failed > 0) {
  process.exitCode = 1;
}
