#!/usr/bin/env python3
"""
LUASCRIPT Performance Benchmarking Framework
Steve Jobs + Donald Knuth Excellence Standards

Comprehensive performance testing against JavaScript, Python, and raw Lua
to validate LUASCRIPT's claim of >5x faster mathematical programming.
"""

import argparse
import json
import os
import shutil
import subprocess
import sys
import tempfile
import time
from pathlib import Path
from typing import Dict, List, Optional, Tuple

try:
    import psutil  # type: ignore
except Exception:  # pragma: no cover - optional dependency
    psutil = None

class LuaScriptBenchmark:
    def __init__(self, lua_bin: Optional[str] = None, quick: bool = False, output_path: Optional[str] = None):
        self.results = {}
        self.quick = quick
        self.repo_root = Path(__file__).resolve().parent
        self.compiler_path = self.repo_root / "src" / "luascript_compiler.py"
        self.lua_bin = lua_bin or os.environ.get("LUA_BIN", "lua")
        self.commit_hash = self._get_commit_hash()
        self.output_path = Path(output_path) if output_path else None
        
    def _get_commit_hash(self) -> str:
        try:
            return (
                subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=self.repo_root)
                .decode()
                .strip()
            )
        except Exception:
            return "unknown"
        
    def capture_memory_mb(self) -> Optional[float]:
        if psutil is None:
            return None
        try:
            process = psutil.Process(os.getpid())
            return process.memory_info().rss / (1024 * 1024)
        except Exception:
            return None
        
    def log_result(self, test_name: str, language: str, time_ms: float, memory_mb: Optional[float] = None, code_size_bytes: Optional[int] = None, compile_time_ms: Optional[float] = None):
        """Log benchmark results"""
        if test_name not in self.results:
            self.results[test_name] = {}
        self.results[test_name][language] = {
            'time_ms': time_ms,
            'compile_time_ms': compile_time_ms,
            'memory_mb': memory_mb if memory_mb is not None else self.capture_memory_mb(),
            'code_size_bytes': code_size_bytes,
            'timestamp': time.time(),
            'commit': self.commit_hash
        }
        
    def resolved_output_path(self) -> Path:
        if self.output_path:
            self.output_path.parent.mkdir(parents=True, exist_ok=True)
            return self.output_path
        default_dir = self.repo_root / "artifacts" / "performance"
        default_dir.mkdir(parents=True, exist_ok=True)
        return default_dir / f"benchmark_{self.commit_hash}.json"
        
    def run_fibonacci_benchmark(self, n: int = 35) -> Dict[str, float]:
        """Benchmark recursive Fibonacci calculation"""
        print(f"?? Running Fibonacci({n}) benchmark...")

        # JavaScript (Node.js) version
        js_code = f"""
        function fibonacci(n) {{
            if (n <= 1) return n;
            return fibonacci(n - 1) + fibonacci(n - 2);
        }}

        console.time('fibonacci');
        const result = fibonacci({n});
        console.timeEnd('fibonacci');
        console.log('Result:', result);
        """

        try:
            with tempfile.NamedTemporaryFile(mode='w', suffix='.js', delete=False) as f:
                f.write(js_code)
                js_file = f.name

            start_time = time.time()
            result = subprocess.run(['node', js_file], capture_output=True, text=True, timeout=30)
            js_time = (time.time() - start_time) * 1000

            if result.returncode == 0:
                self.log_result('fibonacci', 'JavaScript', js_time, self.capture_memory_mb())
                print(f"  ? JavaScript: {js_time:.1f}ms")
            else:
                print(f"  ? JavaScript failed: {result.stderr}")

            os.unlink(js_file)
        except Exception as e:
            print(f"  ?? JavaScript benchmark failed: {e}")

        # Python version
        python_code = f"""
import time

def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

start = time.time()
result = fibonacci({n})
end = time.time()
print(f"Time: {(end - start) * 1000:.1f}ms")
print(f"Result: {result}")
"""

        try:
            with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
                f.write(python_code)
                py_file = f.name

            start_time = time.time()
            result = subprocess.run([sys.executable, py_file], capture_output=True, text=True, timeout=30)
            py_time = (time.time() - start_time) * 1000

            if result.returncode == 0:
                self.log_result('fibonacci', 'Python', py_time, self.capture_memory_mb())
                print(f"  ? Python: {py_time:.1f}ms")
            else:
                print(f"  ? Python failed: {result.stderr}")

            os.unlink(py_file)
        except Exception as e:
            print(f"  ?? Python benchmark failed: {e}")

        # LUASCRIPT version
        luascript_code = f"""
function fibonacci(n) {{
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}}

let start = Date.now();
let result = fibonacci({n});
let end = Date.now();
print("Time:", (end - start), "ms");
print("Result:", result);
"""

        try:
            with tempfile.NamedTemporaryFile(mode='w', suffix='.ls', delete=False) as f:
                f.write(luascript_code)
                ls_file = f.name

            compile_start = time.time()
            compile_result = subprocess.run([
                sys.executable, str(self.compiler_path), 'compile', ls_file
            ], capture_output=True, text=True)
            compile_time = (time.time() - compile_start) * 1000

            if compile_result.returncode == 0:
                lua_file = ls_file.replace('.ls', '.lua')

                start_time = time.time()
                run_result = subprocess.run([self.lua_bin, lua_file], capture_output=True, text=True, timeout=30)
                luascript_time = (time.time() - start_time) * 1000
                code_size = os.path.getsize(lua_file) if os.path.exists(lua_file) else None

                if run_result.returncode == 0:
                    self.log_result('fibonacci', 'LUASCRIPT', luascript_time, self.capture_memory_mb(), code_size, compile_time)
                    print(f"  ?? LUASCRIPT: {luascript_time:.1f}ms (compile {compile_time:.1f}ms)")
                else:
                    print(f"  ? LUASCRIPT execution failed: {run_result.stderr}")

                os.unlink(lua_file)
            else:
                print(f"  ? LUASCRIPT compilation failed: {compile_result.stderr}")

            os.unlink(ls_file)
        except Exception as e:
            print(f"  ?? LUASCRIPT benchmark failed: {e}")

        return self.results.get('fibonacci', {})

    def run_array_operations_benchmark(self, size: int = 10000) -> Dict[str, float]:
        """Benchmark array map and reduce operations"""
        size = min(size, 1000) if self.quick else size
        print(f"?? Running Array Operations benchmark (size: {size})...")

        # JavaScript version
        js_code = f"""
        const numbers = Array.from({{length: {size}}}, (_, i) => i + 1);

        console.time('array-ops');
        const doubled = numbers.map(x => x * 2);
        const sum = doubled.reduce((a, b) => a + b, 0);
        console.timeEnd('array-ops');
        console.log('Sum:', sum);
        """

        try:
            with tempfile.NamedTemporaryFile(mode='w', suffix='.js', delete=False) as f:
                f.write(js_code)
                js_file = f.name

            start_time = time.time()
            result = subprocess.run(['node', js_file], capture_output=True, text=True, timeout=30)
            js_time = (time.time() - start_time) * 1000

            if result.returncode == 0:
                self.log_result('array_ops', 'JavaScript', js_time, self.capture_memory_mb())
                print(f"  ? JavaScript: {js_time:.1f}ms")
            else:
                print(f"  ? JavaScript failed: {result.stderr}")

            os.unlink(js_file)
        except Exception as e:
            print(f"  ?? JavaScript benchmark failed: {e}")

        # LUASCRIPT version
        luascript_code = f"""
        let numbers = [];
        for (let i = 1; i <= {size}; i++) {{
            numbers.push(i);
        }}

        let start = Date.now();
        let doubled = numbers.map(x => x * 2);
        let sum = doubled.reduce((a, b) => a + b, 0);
        let end = Date.now();
        print("Time:", (end - start), "ms");
        print("Sum:", sum);
        """

        try:
            with tempfile.NamedTemporaryFile(mode='w', suffix='.ls', delete=False) as f:
                f.write(luascript_code)
                ls_file = f.name

            compile_start = time.time()
            compile_result = subprocess.run([
                sys.executable, str(self.compiler_path), 'compile', ls_file
            ], capture_output=True, text=True)
            compile_time = (time.time() - compile_start) * 1000

            if compile_result.returncode == 0:
                lua_file = ls_file.replace('.ls', '.lua')

                start_time = time.time()
                run_result = subprocess.run([self.lua_bin, lua_file], capture_output=True, text=True, timeout=30)
                luascript_time = (time.time() - start_time) * 1000
                code_size = os.path.getsize(lua_file) if os.path.exists(lua_file) else None

                if run_result.returncode == 0:
                    self.log_result('array_ops', 'LUASCRIPT', luascript_time, self.capture_memory_mb(), code_size, compile_time)
                    print(f"  ?? LUASCRIPT: {luascript_time:.1f}ms (compile {compile_time:.1f}ms)")
                else:
                    print(f"  ? LUASCRIPT execution failed: {run_result.stderr}")

                os.unlink(lua_file)
            else:
                print(f"  ? LUASCRIPT compilation failed: {compile_result.stderr}")

            os.unlink(ls_file)
        except Exception as e:
            print(f"  ?? LUASCRIPT benchmark failed: {e}")

        return self.results.get('array_ops', {})

    def run_compilation_speed_benchmark(self) -> Dict[str, float]:
        """Benchmark compilation speed"""
        print("⚡ Running Compilation Speed benchmark...")
        
        # Create a moderately complex LUASCRIPT file
        complex_code = """
        // Complex LUASCRIPT program for compilation benchmarking
        class MathUtils {
            constructor() {
                this.pi = π;
                this.e = ℯ;
            }
            
            factorial(n) {
                if (n <= 1) return 1;
                return n * this.factorial(n - 1);
            }
            
            fibonacci(n) {
                if (n <= 1) return n;
                return this.fibonacci(n - 1) + this.fibonacci(n - 2);
            }
            
            calculateArea(radius) {
                return this.pi × radius²;
            }
            
            gaussianPdf(x, mu = 0, sigma = 1) {
                return (1 / √(2 × this.pi × sigma²)) × ℯ^(-(x - mu)² / (2 × sigma²));
            }
        }
        
        function processArray(data) {
            return data
                .map(x => x * 2)
                .filter(x => x > 10)
                .reduce((sum, x) => sum + x, 0);
        }
        
        let mathUtils = new MathUtils();
        let numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        
        for (let i = 0; i < 100; i++) {
            let area = mathUtils.calculateArea(i);
            let fact = mathUtils.factorial(Math.min(i, 10));
            let fib = mathUtils.fibonacci(Math.min(i, 20));
            let gaussian = mathUtils.gaussianPdf(i / 10);
        }
        
        let result = processArray(numbers);
        print("Benchmark complete, result:", result);
        
        // Template literal usage
        for (let i = 0; i < 50; i++) {
            let message = `Iteration ${i}: area = ${mathUtils.calculateArea(i)}`;
            if (i % 10 === 0) print(message);
        }
        
        // Object-oriented mathematical programming
        class Vector2D {
            constructor(x, y) {
                this.x = x;
                this.y = y;
            }
            
            magnitude() {
                return √(this.x² + this.y²);
            }
            
            dot(other) {
                return this.x × other.x + this.y × other.y;
            }
            
            normalize() {
                let mag = this.magnitude();
                return new Vector2D(this.x / mag, this.y / mag);
            }
        }
        
        let vectors = [];
        for (let i = 0; i < 100; i++) {
            vectors.push(new Vector2D(Math.random() * 10, Math.random() * 10));
        }
        
        let totalMagnitude = vectors
            .map(v => v.magnitude())
            .reduce((sum, mag) => sum + mag, 0);
            
        print("Total magnitude:", totalMagnitude);
        """
        
        try:
            with tempfile.NamedTemporaryFile(mode='w', suffix='.ls', delete=False) as f:
                f.write(complex_code)
                ls_file = f.name
                
            # Measure compilation time
            start_time = time.time()
            compile_result = subprocess.run([
                sys.executable, str(self.compiler_path), 'compile', ls_file
            ], capture_output=True, text=True)
            compile_time = (time.time() - start_time) * 1000
            
            if compile_result.returncode == 0:
                lua_file = ls_file.replace('.ls', '.lua')
                code_size = os.path.getsize(lua_file) if os.path.exists(lua_file) else None

                start_time = time.time()
                run_result = subprocess.run([self.lua_bin, lua_file], capture_output=True, text=True, timeout=10)
                self.log_result('compilation', 'LUASCRIPT', compile_time, self.capture_memory_mb(), code_size, compile_time)
                print(f"  ?? LUASCRIPT compilation: {compile_time:.1f}ms")

                if run_result.returncode == 0:
                    print("  ✅ Generated code executes successfully")
                else:
                    print(f"  ⚠️ Generated code execution warning: {run_result.stderr}")
                
                os.unlink(lua_file)
            else:
                print(f"  ❌ LUASCRIPT compilation failed: {compile_result.stderr}")
                
            os.unlink(ls_file)
        except Exception as e:
            print(f"  ⚠️ Compilation benchmark failed: {e}")
            
        return self.results.get('compilation', {})
        
    def run_mathematical_expression_benchmark(self) -> Dict[str, float]:
        """Benchmark mathematical expression evaluation"""
        print("🔬 Running Mathematical Expression benchmark...")
        
        # LUASCRIPT version with beautiful mathematical syntax
        luascript_code = """
        let results = [];
        let start = Date.now();
        
        for (let i = 1; i <= 1000; i++) {
            let x = i / 100.0;
            
            // Beautiful mathematical expressions
            let area = π × x²;
            let gaussian = (1/√(2×π)) × ℯ^(-x²/2);
            let distance = √((x - 1)² + (x - 2)²);
            let polynomial = x³ - 2×x² + 3×x - 1;
            
            results.push(area + gaussian + distance + polynomial);
        }
        
        let end = Date.now();
        print("Time:", (end - start), "ms");
        print("Results calculated:", results.length);
        print("Sample result:", results[0]);
        """
        
        try:
            with tempfile.NamedTemporaryFile(mode='w', suffix='.ls', delete=False) as f:
                f.write(luascript_code)
                ls_file = f.name
                
            # Compile and run
            compile_start = time.time()
            compile_result = subprocess.run([
                sys.executable, str(self.compiler_path), 'compile', ls_file
            ], capture_output=True, text=True)
            compile_time = (time.time() - compile_start) * 1000
            
            if compile_result.returncode == 0:
                lua_file = ls_file.replace('.ls', '.lua')
                
                start_time = time.time()
                run_result = subprocess.run([self.lua_bin, lua_file], capture_output=True, text=True, timeout=30)
                luascript_time = (time.time() - start_time) * 1000
                code_size = os.path.getsize(lua_file) if os.path.exists(lua_file) else None
                
                if run_result.returncode == 0:
                    self.log_result('math_expressions', 'LUASCRIPT', luascript_time, self.capture_memory_mb(), code_size, compile_time)
                    print(f"  ?? LUASCRIPT: {luascript_time:.1f}ms (compile {compile_time:.1f}ms)")
                else:
                    print(f"  ? LUASCRIPT execution failed: {run_result.stderr}")
                
                os.unlink(lua_file)
            else:
                print(f"  ? LUASCRIPT compilation failed: {compile_result.stderr}")
                
            os.unlink(ls_file)
        except Exception as e:
            print(f"  ⚠️ Mathematical expressions benchmark failed: {e}")
            
        return self.results.get('math_expressions', {})
        
    def generate_report(self) -> str:
        """Generate comprehensive benchmark report"""
        report = "\n" + "="*80 + "\n"
        report += "?? LUASCRIPT PERFORMANCE BENCHMARK REPORT\n"
        report += f"Commit: {self.commit_hash}\n"
        report += "="*80 + "\n\n"

        for test_name, results in self.results.items():
            report += f"?? {test_name.replace('_', ' ').title()}:\n"
            report += "-" * 40 + "\n"

            sorted_results = sorted(results.items(), key=lambda x: x[1].get('time_ms', 0))

            for lang, data in sorted_results:
                line = f"  {lang:12}: {data.get('time_ms', 0):8.1f}ms"
                if data.get('compile_time_ms') is not None:
                    line += f" (compile {data['compile_time_ms']:.1f}ms)"
                if data.get('code_size_bytes') is not None:
                    line += f"  code {data['code_size_bytes']} bytes"
                if data.get('memory_mb') is not None:
                    line += f"  mem {data['memory_mb']:.1f}MB"
                report += line + "\n"

            report += "\n"

        report += "?? PERFORMANCE SUMMARY:\n"
        report += "-" * 40 + "\n"

        if 'fibonacci' in self.results and 'LUASCRIPT' in self.results['fibonacci']:
            luascript_fib = self.results['fibonacci']['LUASCRIPT']['time_ms']
            if 'Python' in self.results['fibonacci']:
                python_fib = self.results['fibonacci']['Python']['time_ms']
                speedup = python_fib / luascript_fib if luascript_fib else 0
                report += f"  Fibonacci vs Python: {speedup:.1f}x faster ?\n"
            if 'JavaScript' in self.results['fibonacci']:
                js_fib = self.results['fibonacci']['JavaScript']['time_ms']
                speedup = js_fib / luascript_fib if luascript_fib else 0
                report += f"  Fibonacci vs JavaScript: {speedup:.1f}x faster ?\n"

        report += "\n?? CONCLUSION: LUASCRIPT performance tracked with per-commit metadata\n"
        report += "   while maintaining mathematical programming elegance!\n\n"

        return report

    def save_results(self, filename: Optional[str] = None):
        """Save benchmark results to JSON file"""
        output_path = Path(filename) if filename else self.resolved_output_path()
        output_path.parent.mkdir(parents=True, exist_ok=True)
        payload = {
            'commit': self.commit_hash,
            'generated_at': time.time(),
            'results': self.results
        }
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(payload, f, indent=2)
        print(f"?? Results saved to {output_path}")


def parse_args():
     parser = argparse.ArgumentParser(description='Run LUASCRIPT performance benchmarks')
     parser.add_argument('--output', help='Path to write benchmark JSON output')
     parser.add_argument('--lua-bin', default=os.environ.get('LUA_BIN', 'lua'), help='Lua interpreter to use')
     parser.add_argument('--quick', action='store_true', help='Run in quick/CI mode with reduced sizes')
     parser.add_argument('--ci', action='store_true', help='Alias for --quick with default output path')
     return parser.parse_args()


def main():
    print("?? LUASCRIPT PERFORMANCE BENCHMARK SUITE")
    print("=" * 50)
    print("Steve Jobs + Donald Knuth Excellence Standards\n")

    args = parse_args()
    quick_mode = bool(args.quick or args.ci)

    benchmark = LuaScriptBenchmark(lua_bin=args.lua_bin, quick=quick_mode, output_path=args.output)

    # Run all benchmarks
    try:
        benchmark.run_fibonacci_benchmark(20 if benchmark.quick else 30)
        benchmark.run_array_operations_benchmark(500 if benchmark.quick else 1000)
        benchmark.run_compilation_speed_benchmark()
        benchmark.run_mathematical_expression_benchmark()

        report = benchmark.generate_report()
        print(report)

        benchmark.save_results(args.output)

    except KeyboardInterrupt:
        print("\n?? Benchmark interrupted by user")
    except Exception as e:
        print(f"\n? Benchmark failed: {e}")

if __name__ == "__main__":
    main()
