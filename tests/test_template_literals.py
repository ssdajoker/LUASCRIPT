#!/usr/bin/env python3
"""
Template Literal Tests - Comprehensive Test Suite
Tests all template literal functionality to ensure proper transpilation
"""

import sys
import os

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from parser.enhanced_parser import EnhancedParser
from transpiler.enhanced_transpiler import EnhancedTranspiler

def test_simple_template():
    """Test simple template literal without expressions"""
    code = '`Hello World`'
    parser = EnhancedParser()
    ast = parser.parse(code)
    transpiler = EnhancedTranspiler()
    result = transpiler.generate(ast)
    print("Test: Simple template")
    print(f"  Input:  {code}")
    print(f"  Output: {result}")
    assert '"Hello World"' in result
    print("  ✅ PASS\n")

def test_simple_interpolation():
    """Test simple variable interpolation"""
    code = '`Hello ${name}!`'
    parser = EnhancedParser()
    ast = parser.parse(code)
    transpiler = EnhancedTranspiler()
    result = transpiler.generate(ast)
    print("Test: Simple interpolation")
    print(f"  Input:  {code}")
    print(f"  Output: {result}")
    assert 'string.format' in result
    assert 'name' in result
    print("  ✅ PASS\n")

def test_mathematical_expression():
    """Test mathematical expression in template"""
    code = '`Circle area: ${π × r²}`'
    parser = EnhancedParser()
    ast = parser.parse(code)
    transpiler = EnhancedTranspiler()
    result = transpiler.generate(ast)
    print("Test: Mathematical expression")
    print(f"  Input:  {code}")
    print(f"  Output: {result}")
    assert 'string.format' in result
    print("  ✅ PASS\n")

def test_multiple_expressions():
    """Test multiple expressions in template"""
    code = '`Point: (${x}, ${y})`'
    parser = EnhancedParser()
    ast = parser.parse(code)
    transpiler = EnhancedTranspiler()
    result = transpiler.generate(ast)
    print("Test: Multiple expressions")
    print(f"  Input:  {code}")
    print(f"  Output: {result}")
    assert 'string.format' in result
    assert 'x' in result
    assert 'y' in result
    print("  ✅ PASS\n")

def test_nested_expressions():
    """Test nested function calls"""
    code = '`Result: ${f(g(x))}`'
    parser = EnhancedParser()
    ast = parser.parse(code)
    transpiler = EnhancedTranspiler()
    result = transpiler.generate(ast)
    print("Test: Nested expressions")
    print(f"  Input:  {code}")
    print(f"  Output: {result}")
    assert 'string.format' in result
    print("  ✅ PASS\n")

def main():
    print("=" * 64)
    print("  TEMPLATE LITERAL TEST SUITE")
    print("  Comprehensive validation of template string transpilation")
    print("=" * 64)
    print()
    
    tests = [
        test_simple_template,
        test_simple_interpolation,
        test_mathematical_expression,
        test_multiple_expressions,
        test_nested_expressions,
    ]
    
    passed = 0
    failed = 0
    
    for test in tests:
        try:
            test()
            passed += 1
        except Exception as e:
            print(f"  ❌ FAIL: {str(e)}\n")
            failed += 1
    
    print("=" * 64)
    print(f"Results: {passed} passed, {failed} failed")
    
    if failed == 0:
        print("ALL TESTS PASSED!")
        return 0
    else:
        print(f"  {failed} test(s) failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())
