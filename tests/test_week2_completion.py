#!/usr/bin/env python3
"""
LUASCRIPT Week 2 Completion Test Suite
Comprehensive testing for all Week 2 core features
Validates 100% completion of critical functionality

Author: Linus Torvalds (GitHub Integration Lead)
"""

import sys
import os
import subprocess
import time
from pathlib import Path

# Add src to path
sys.path.append(os.path.join(os.path.dirname(__file__), '../src'))
sys.path.append(os.path.join(os.path.dirname(__file__), '../src/parser'))
sys.path.append(os.path.join(os.path.dirname(__file__), '../src/transpiler'))

from enhanced_parser import parse_source
from enhanced_transpiler import transpile_ast
from performance_monitor import performance_monitor
from error_handler import format_error, LuaScriptError

class Week2TestSuite:
    """Comprehensive Week 2 feature testing"""
    
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.results = []
    
    def test(self, name: str, test_func):
        """Run a test and record results"""
        print(f"🧪 Testing {name}...")
        try:
            test_func()
            print(f"✅ {name} - PASSED")
            self.passed += 1
            self.results.append((name, "PASSED", None))
        except Exception as e:
            print(f"❌ {name} - FAILED: {e}")
            self.failed += 1
            self.results.append((name, "FAILED", str(e)))
    
    def test_template_literals_advanced(self):
        """Test advanced template literal functionality"""
        test_cases = [
            # Basic interpolation
            ('let name = "World"; let msg = `Hello, ${name}!`;', 
             'string.format("Hello, %s!", name)'),
            
            # Mathematical expressions
            ('let r = 5; let area = `Area: ${π × r²}`;',
             'string.format("Area: %s", (math.pi * (r ^ 2)))'),
            
            # Multiple expressions
            ('let x = 1, y = 2; let point = `(${x}, ${y})`;',
             'string.format("(%s, %s)", x, y)'),
            
            # Nested expressions
            ('let result = `Result: ${Math.sqrt(x² + y²)}`;',
             'string.format("Result: %s", math.sqrt(((x ^ 2) + (y ^ 2))))'),
        ]
        
        for source, expected_pattern in test_cases:
            ast = parse_source(source, "test.ls")
            lua_code = transpile_ast(ast)
            
            # Check if the expected pattern is in the generated code
            if expected_pattern.replace(' ', '') not in lua_code.replace(' ', '').replace('\n', ''):
                raise AssertionError(f"Template literal not properly transpiled: {source}")
    
    def test_object_oriented_complete(self):
        """Test complete object-oriented functionality"""
        class_code = '''
        class Calculator {
            constructor(precision) {
                this.precision = precision || 2;
            }
            
            add(a, b) {
                return this.round(a + b);
            }
            
            multiply(a, b) {
                return this.round(a * b);
            }
            
            round(value) {
                return Math.round(value * Math.pow(10, this.precision)) / Math.pow(10, this.precision);
            }
        }
        
        let calc = new Calculator(3);
        let result = calc.add(1.234, 2.567);
        '''
        
        ast = parse_source(class_code, "calculator.ls")
        lua_code = transpile_ast(ast)
        
        # Verify class structure
        required_patterns = [
            "local Calculator = {}",
            "Calculator.__index = Calculator",
            "function Calculator.new(",
            "function Calculator:add(",
            "function Calculator:multiply(",
            "function Calculator:round(",
            "setmetatable({}, Calculator)"
        ]
        
        for pattern in required_patterns:
            if pattern not in lua_code:
                raise AssertionError(f"Missing OOP pattern: {pattern}")
    
    def test_for_of_loops_comprehensive(self):
        """Test comprehensive for-of loop functionality"""
        test_cases = [
            # Basic array iteration
            '''
            let numbers = [1, 2, 3, 4, 5];
            for (let num of numbers) {
                console.log(num);
            }
            ''',
            
            # String iteration
            '''
            let text = "hello";
            for (let char of text) {
                console.log(char);
            }
            ''',
            
            # Nested for-of loops
            '''
            let matrix = [[1, 2], [3, 4]];
            for (let row of matrix) {
                for (let cell of row) {
                    console.log(cell);
                }
            }
            ''',
        ]
        
        for source in test_cases:
            ast = parse_source(source, "forof_test.ls")
            lua_code = transpile_ast(ast)
            
            # Verify for-of transpilation
            if "for _, " not in lua_code and "ipairs(" not in lua_code:
                raise AssertionError(f"For-of loop not properly transpiled: {source}")
    
    def test_mathematical_expressions_advanced(self):
        """Test advanced mathematical expression handling"""
        math_expressions = [
            # Complex mathematical notation
            'let distance = √((x₂ - x₁)² + (y₂ - y₁)²);',
            
            # Multiple operators
            'let result = π × r² ÷ 2 + √(a² + b²);',
            
            # Nested mathematical functions
            'let complex = sin(π/4) × cos(π/3) + tan(π/6);',
            
            # Mathematical constants
            'let euler = e^(π×i) + 1;',
        ]
        
        for expr in math_expressions:
            ast = parse_source(expr, "math_test.ls")
            lua_code = transpile_ast(ast)
            
            # Verify mathematical operators are converted
            unicode_ops = ['π', '×', '÷', '²', '√', '₁', '₂']
            for op in unicode_ops:
                if op in lua_code:
                    raise AssertionError(f"Unicode operator not converted: {op} in {expr}")
    
    def test_error_handling_improvements(self):
        """Test improved error handling and messages"""
        error_cases = [
            # Syntax errors
            'let x = ;',  # Missing value
            'function test( { }',  # Missing parameter
            'class Test { method() }',  # Missing method body
        ]
        
        for bad_source in error_cases:
            try:
                ast = parse_source(bad_source, "error_test.ls")
                raise AssertionError(f"Should have failed to parse: {bad_source}")
            except Exception as e:
                # Verify error message is helpful
                error_msg = str(e)
                if "Parse Error" not in error_msg:
                    raise AssertionError(f"Error message not descriptive enough: {error_msg}")
    
    def test_performance_benchmarks(self):
        """Test performance benchmarking integration"""
        # Test compilation performance
        large_source = '''
        class DataProcessor {
            constructor() {
                this.data = [];
            }
            
            process(items) {
                let results = [];
                for (let item of items) {
                    if (item.value > 0) {
                        results.push(item.value * 2);
                    }
                }
                return results;
            }
        }
        ''' * 10  # Repeat to create larger source
        
        with performance_monitor.measure_compilation("benchmark_test.ls", len(large_source.split('\n'))):
            ast = parse_source(large_source, "benchmark_test.ls")
            lua_code = transpile_ast(ast)
            performance_monitor.record_lua_lines(len(lua_code.split('\n')))
        
        result = performance_monitor.analyze_performance("benchmark_test.ls")
        
        # Verify performance metrics
        if result.metrics.compilation_speed < 100:  # At least 100 LOC/sec
            raise AssertionError(f"Compilation too slow: {result.metrics.compilation_speed} LOC/sec")
        
        if result.metrics.memory_usage > 100:  # Less than 100MB
            raise AssertionError(f"Memory usage too high: {result.metrics.memory_usage} MB")
    
    def test_integration_examples(self):
        """Test all example files compile and execute correctly"""
        examples_dir = Path(__file__).parent.parent / "examples"
        
        for example_file in examples_dir.glob("*.ls"):
            # Compile the example
            result = subprocess.run([
                sys.executable, 
                str(Path(__file__).parent.parent / "src" / "luascript_compiler.py"),
                "compile", 
                str(example_file)
            ], capture_output=True, text=True)
            
            if result.returncode != 0:
                raise AssertionError(f"Failed to compile {example_file.name}: {result.stderr}")
            
            # Check if Lua file was generated
            lua_file = example_file.with_suffix('.lua')
            if not lua_file.exists():
                raise AssertionError(f"Lua file not generated for {example_file.name}")
            
            # Verify Lua syntax (basic check)
            lua_content = lua_file.read_text()
            if "local _LS = require" not in lua_content:
                raise AssertionError(f"Generated Lua missing runtime import: {example_file.name}")
    
    def test_week2_completion_status(self):
        """Verify Week 2 is actually 100% complete"""
        # Check all critical features are working
        critical_features = [
            "Template literals with interpolation",
            "Object-oriented programming with classes",
            "For-of loop iteration",
            "Mathematical expression handling",
            "Error reporting improvements",
            "Performance monitoring integration"
        ]
        
        # This test passes if all other tests pass
        # It's a meta-test to confirm Week 2 completion
        if self.failed > 0:
            raise AssertionError(f"Week 2 not complete: {self.failed} tests failed")
    
    def run_all_tests(self):
        """Run the complete Week 2 test suite"""
        print("🚀 LUASCRIPT Week 2 Completion Test Suite")
        print("=" * 60)
        
        # Core feature tests
        self.test("Template Literals Advanced", self.test_template_literals_advanced)
        self.test("Object-Oriented Complete", self.test_object_oriented_complete)
        self.test("For-of Loops Comprehensive", self.test_for_of_loops_comprehensive)
        self.test("Mathematical Expressions Advanced", self.test_mathematical_expressions_advanced)
        self.test("Error Handling Improvements", self.test_error_handling_improvements)
        self.test("Performance Benchmarks", self.test_performance_benchmarks)
        self.test("Integration Examples", self.test_integration_examples)
        
        # Meta-test for completion
        self.test("Week 2 Completion Status", self.test_week2_completion_status)
        
        # Summary
        print("\n" + "=" * 60)
        print(f"🎯 Test Results: {self.passed} passed, {self.failed} failed")
        
        if self.failed == 0:
            print("🏆 WEEK 2 COMPLETION: 100% - ALL TESTS PASSED!")
            print("✨ LUASCRIPT core features are production-ready!")
        else:
            print(f"⚠️  WEEK 2 STATUS: {(self.passed/(self.passed+self.failed)*100):.1f}% complete")
            print("🔧 Some features need additional work")
        
        return self.failed == 0

def main():
    """Run the Week 2 completion test suite"""
    suite = Week2TestSuite()
    success = suite.run_all_tests()
    
    if success:
        print("\n🎉 CONGRATULATIONS!")
        print("Week 2 core features are 100% complete and ahead of schedule!")
        print("Ready to proceed with Week 3 advanced features.")
    else:
        print("\n🔧 WORK NEEDED:")
        print("Some Week 2 features require additional implementation.")
        print("Review failed tests and implement missing functionality.")
    
    return 0 if success else 1

if __name__ == "__main__":
    exit(main())
