#!/usr/bin/env python3
"""
Direct Template Literal and For-Of Loop Tests
Tests the actual full pipeline
"""

import sys
import os
import subprocess

def run_test(name, code, expected_patterns):
    """Run a test through the full compilation pipeline"""
    print(f"\nTest: {name}")
    print(f"  Code: {code}")
    
    # Write code to temp file
    test_file = "temp_test.ls"
    output_file = "temp_test.lua"
    with open(test_file, 'w', encoding='utf-8') as f:
        f.write(code)
    
    try:
        # Run compiler
        result = subprocess.run(
            ["python", "src/luascript_compiler.py", "compile", test_file],
            capture_output=True,
            text=True,
            timeout=10
        )
        
        if result.returncode != 0:
            print(f"  Compilation Error:")
            print(f"    {result.stderr}")
            return False
        
        # Check generated Lua
        if os.path.exists(output_file):
            with open(output_file, 'r', encoding='utf-8') as f:
                lua_code = f.read()
                print(f"  Generated Lua:")
                for line in lua_code.split('\n')[:10]:
                    print(f"    {line}")
                
                # Check expected patterns
                for pattern in expected_patterns:
                    if pattern not in lua_code:
                        print(f"  FAIL: Expected pattern not found: {pattern}")
                        return False
                
                print(f"  PASS")
                return True
        else:
            print(f"  FAIL: No {output_file} generated")
            return False
            
    except Exception as e:
        print(f"  FAIL: {str(e)}")
        return False
    finally:
        # Cleanup
        for f in [test_file, output_file]:
            if os.path.exists(f):
                os.remove(f)

def main():
    print("=" * 64)
    print("  CRITICAL FEATURE TESTS - Direct Pipeline")
    print("=" * 64)
    
    os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    
    tests = [
        ("Simple template literal", 
         'let msg = `Hello World`;',
         ["Hello World"]),
        
        ("Template with interpolation",
         'let greeting = `Hello ${name}!`;',
         ["string.format", "name"]),
        
        ("Multiple interpolations",
         'let point = `(${x}, ${y})`;',
         ["string.format", "x", "y"]),
        
        ("For-of loop",
         'for (let item of items) { console.log(item); }',
         ["for", "item", "items"]),
    ]
    
    passed = 0
    failed = 0
    
    for name, code, patterns in tests:
        if run_test(name, code, patterns):
            passed += 1
        else:
            failed += 1
    
    print("\n" + "=" * 64)
    print(f"Results: {passed} passed, {failed} failed")
    
    if failed == 0:
        print("ALL TESTS PASSED - MILESTONE ACHIEVED!")
        return 0
    else:
        print(f"{failed} test(s) need fixes")
        return 1

if __name__ == "__main__":
    sys.exit(main())
