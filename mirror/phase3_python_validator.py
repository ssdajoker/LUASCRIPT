#!/usr/bin/env python3
"""
CSC LM EVO-A v3: Phase 3 Python Validation Suite
Comprehensive testing of 31 Python tier 2 showcase modules
"""

import os
import subprocess
import sys
from pathlib import Path

SHOWCASE_DIR = Path(__file__).parent / "tier2-python" / "showcase"

EXPECTED_MODULES = {
    'Type System': [
        'type_basics.py',
        'type_advanced.py',
        'type_generics.py',
        'type_constraints.py',
        'type_performance.py'
    ],
    'Pattern Matching': [
        'pattern_basic.py',
        'pattern_guards.py',
        'pattern_binding.py',
        'pattern_nested.py',
        'pattern_exhaustive.py',
        'pattern_performance.py'
    ],
    'Metaprogramming': [
        'meta_reflection.py',
        'meta_decorators.py',
        'meta_ast.py',
        'meta_generation.py'
    ],
    'Optimization': [
        'perf_caching.py',
        'perf_memoization.py',
        'perf_constantfolding.py',
        'perf_deadcode.py',
        'perf_benchmark.py'
    ],
    'Security': [
        'sec_input.py',
        'sec_crypto.py',
        'sec_injection.py',
        'sec_audit.py'
    ],
    'Async & Control Flow': [
        'async_promises.py',
        'async_coroutines.py',
        'async_parallel.py',
        'async_errhandling.py'
    ],
    'IR & Determinism': [
        'ir_canonical.py',
        'ir_determinism.py',
        'ir_tracing.py'
    ]
}

print('=' * 80)
print('CSC LM EVO-A v3: PHASE 3 PYTHON VALIDATION')
print('Testing all 31 Tier 2 Python Showcase Modules')
print('=' * 80)

total_modules = 0
executed_modules = 0
failed_modules = 0
results = {}

for category, modules in EXPECTED_MODULES.items():
    print(f"\n{'=' * 80}")
    print(f"CATEGORY: {category}")
    print('=' * 80)
    
    results[category] = {
        'total': len(modules),
        'passed': 0,
        'failed': 0,
        'modules': {}
    }
    
    for module in modules:
        module_path = SHOWCASE_DIR / module
        total_modules += 1
        
        print(f"Testing {module}... ", end='', flush=True)
        
        try:
            if not module_path.exists():
                raise FileNotFoundError(f"Module not found at {module_path}")
            
            # Execute Python module
            result = subprocess.run(
                [sys.executable, str(module_path)],
                capture_output=True,
                text=True,
                timeout=5
            )
            
            if result.returncode == 0:
                print("[PASS]")
                executed_modules += 1
                results[category]['passed'] += 1
                results[category]['modules'][module] = 'PASS'
            else:
                print(f"[FAIL] (exit code {result.returncode})")
                failed_modules += 1
                results[category]['failed'] += 1
                results[category]['modules'][module] = f"FAIL: exit {result.returncode}"
                if result.stderr:
                    print(f"   Error: {result.stderr[:100]}")
        
        except subprocess.TimeoutExpired:
            print("[FAIL] (timeout)")
            failed_modules += 1
            results[category]['failed'] += 1
            results[category]['modules'][module] = "FAIL: timeout"
        
        except Exception as e:
            print(f"[FAIL]: {str(e)[:50]}")
            failed_modules += 1
            results[category]['failed'] += 1
            results[category]['modules'][module] = f"FAIL: {str(e)}"

# Summary
print('\n' + '=' * 80)
print('PHASE 3 VALIDATION SUMMARY')
print('=' * 80)

for category, data in results.items():
    percentage = (data['passed'] / data['total'] * 100) if data['total'] > 0 else 0
    print(f"{category}: {data['passed']}/{data['total']} ({percentage:.1f}%)")

print('\n' + '=' * 80)
print(f"TOTAL: {executed_modules}/{total_modules} modules executed successfully")
print(f"SUCCESS RATE: {(executed_modules / total_modules * 100):.1f}%")
print('=' * 80)

if executed_modules == total_modules:
    print('\n[SUCCESS] ALL PYTHON MODULES VALIDATED!\n')
    print('Phase 3A: Python Phase C Complete')
    print('Total Modules Created: 31')
    print('Total Lines of Python Code: ~2,500+')
    print('\nStatus: Ready for Phase 3B-D (Ruby, PHP, Dart)\n')
    sys.exit(0)
else:
    print(f'\n[WARNING] {failed_modules} module(s) failed validation\n')
    sys.exit(1)
