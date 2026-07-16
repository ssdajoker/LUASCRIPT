#!/usr/bin/env python3
"""
LUASCRIPT Performance Benchmarking Framework
Steve Jobs + Donald Knuth Excellence Standards

Comprehensive performance testing against JavaScript, Python, and raw Lua
to validate LUASCRIPT performance claims with repeatable measurements.
"""

import argparse
import json
import math
import os
import platform
import re
import shutil
import statistics
import subprocess
import sys
import tempfile
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional, Sequence

try:
    import psutil  # type: ignore
except Exception:  # pragma: no cover - optional dependency
    psutil = None

for stream in (sys.stdout, sys.stderr):
    if hasattr(stream, "reconfigure"):
        stream.reconfigure(encoding="utf-8", errors="replace")

IN_PROGRAM_RE = re.compile(r"BENCH_IN_PROGRAM_MS:([0-9]+(?:\.[0-9]+)?(?:[eE][+-]?\d+)?)")
RESULT_RE = re.compile(r"BENCH_RESULT:(.+)")


@dataclass
class ProcessResult:
    command: List[str]
    returncode: int
    stdout: str
    stderr: str
    elapsed_ms: float
    peak_memory_mb: Optional[float]


class LuaScriptBenchmark:
    def __init__(
        self,
        lua_bin: Optional[str] = None,
        quick: bool = False,
        output_path: Optional[str] = None,
        iterations: int = 5,
        warmups: int = 0,
    ):
        if iterations < 1:
            raise ValueError("--iterations must be at least 1")
        if warmups < 0:
            raise ValueError("--warmups must be at least 0")

        self.results: Dict[str, Dict[str, Dict[str, Any]]] = {}
        self.quick = quick
        self.iterations = iterations
        self.warmups = warmups
        self.repo_root = Path(__file__).resolve().parent
        self.compiler_path = self.repo_root / "src" / "luascript_compiler.py"
        self.lua_bin = lua_bin or os.environ.get("LUA_BIN", "lua")
        self.commit_hash = self._get_commit_hash()
        self.output_path = Path(output_path) if output_path else None
        self.python_env = os.environ.copy()
        self.python_env["PYTHONIOENCODING"] = "utf-8"
        self.python_env["PYTHONUTF8"] = "1"
        self.environment = self._collect_environment()

    def _get_commit_hash(self) -> str:
        try:
            return (
                subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=self.repo_root)
                .decode()
                .strip()
            )
        except Exception:
            return "unknown"

    def resolved_output_path(self) -> Path:
        if self.output_path:
            self.output_path.parent.mkdir(parents=True, exist_ok=True)
            return self.output_path
        default_dir = self.repo_root / "artifacts" / "performance"
        default_dir.mkdir(parents=True, exist_ok=True)
        return default_dir / f"benchmark_{self.commit_hash}.json"

    def _command_output(self, command: Sequence[str], timeout: float = 5) -> Dict[str, Any]:
        try:
            result = subprocess.run(
                list(command),
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace",
                timeout=timeout,
            )
            output = "\n".join(part.strip() for part in (result.stdout, result.stderr) if part.strip())
            return {
                "command": list(command),
                "returncode": result.returncode,
                "output": output.splitlines()[0] if output else "",
            }
        except FileNotFoundError:
            return {"command": list(command), "returncode": None, "output": "not found"}
        except subprocess.TimeoutExpired:
            return {"command": list(command), "returncode": None, "output": f"timed out after {timeout:.1f}s"}

    def _collect_environment(self) -> Dict[str, Any]:
        return {
            "platform": platform.platform(),
            "machine": platform.machine(),
            "processor": platform.processor(),
            "cpu_count": os.cpu_count(),
            "python_version": sys.version.split()[0],
            "python_executable": sys.executable,
            "node_path": shutil.which("node"),
            "node_version": self._command_output(["node", "--version"]),
            "lua_path": shutil.which(self.lua_bin),
            "lua_version": self._command_output([self.lua_bin, "-v"]),
            "psutil_available": psutil is not None,
            "memory_sampling_interval_ms": 5,
        }

    def _fibonacci_expected(self, n: int) -> int:
        a, b = 0, 1
        for _ in range(n):
            a, b = b, a + b
        return a

    def _array_expected(self, size: int) -> int:
        return size * (size + 1)

    def _compilation_expected(self) -> int:
        fib_cache = {0: 0, 1: 1}

        def fibonacci(n: int) -> int:
            if n not in fib_cache:
                fib_cache[n] = fibonacci(n - 1) + fibonacci(n - 2)
            return fib_cache[n]

        def weighted(n: int) -> int:
            total = 0
            for i in range(n):
                total += i * i
                if i < 12:
                    total += fibonacci(i)
            return total

        return sum(weighted(outer) for outer in range(50))

    def _math_expected(self) -> float:
        total = 0.0
        for i in range(1, 1001):
            x = i / 100.0
            area = math.pi * x**2
            gaussian = (1 / math.sqrt(2 * math.pi)) * math.e ** (-(x**2) / 2)
            distance = math.sqrt((x - 1) ** 2 + (x - 2) ** 2)
            polynomial = x**3 - 2 * x**2 + 3 * x - 1
            total += area + gaussian + distance + polynomial
        return total

    def _math_expected_repeated(self, work_units: int) -> float:
        return self._math_expected() * work_units

    def _process_tree_memory_mb(self, process: Any) -> Optional[float]:
        if psutil is None:
            return None
        try:
            processes = [process] + process.children(recursive=True)
            total = 0
            for proc in processes:
                try:
                    total += proc.memory_info().rss
                except Exception:
                    continue
            return total / (1024 * 1024)
        except Exception:
            return None

    def run_process(
        self,
        command: Sequence[str],
        *,
        timeout: float,
        env: Optional[Dict[str, str]] = None,
    ) -> ProcessResult:
        start = time.perf_counter()
        process = subprocess.Popen(
            list(command),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            encoding="utf-8",
            errors="replace",
            env=env,
        )

        monitored = None
        if psutil is not None:
            try:
                monitored = psutil.Process(process.pid)
            except Exception:
                monitored = None

        peak_memory_mb: Optional[float] = None

        while process.poll() is None:
            if monitored is not None:
                current = self._process_tree_memory_mb(monitored)
                if current is not None:
                    peak_memory_mb = current if peak_memory_mb is None else max(peak_memory_mb, current)

            if time.perf_counter() - start > timeout:
                process.kill()
                stdout, stderr = process.communicate()
                elapsed_ms = (time.perf_counter() - start) * 1000
                timeout_msg = f"Timed out after {timeout:.1f}s"
                stderr = f"{stderr}\n{timeout_msg}" if stderr else timeout_msg
                return ProcessResult(list(command), -9, stdout, stderr, elapsed_ms, peak_memory_mb)

            time.sleep(0.005)

        if monitored is not None:
            current = self._process_tree_memory_mb(monitored)
            if current is not None:
                peak_memory_mb = current if peak_memory_mb is None else max(peak_memory_mb, current)

        stdout, stderr = process.communicate()
        elapsed_ms = (time.perf_counter() - start) * 1000
        return ProcessResult(list(command), process.returncode, stdout, stderr, elapsed_ms, peak_memory_mb)

    def _extract_in_program_ms(self, stdout: str, stderr: str = "") -> Optional[float]:
        match = IN_PROGRAM_RE.search(stdout) or IN_PROGRAM_RE.search(stderr)
        return float(match.group(1)) if match else None

    def _extract_result_value(self, stdout: str, stderr: str = "") -> Optional[str]:
        match = RESULT_RE.search(stdout) or RESULT_RE.search(stderr)
        return match.group(1).strip() if match else None

    def _results_match(self, observed: str, expected: Any, tolerance: float) -> bool:
        if expected is None:
            return True
        try:
            return abs(float(observed) - float(expected)) <= tolerance
        except (TypeError, ValueError):
            return observed == str(expected)

    def _extract_markers(
        self,
        process: ProcessResult,
        *,
        language: str,
        run_label: str,
        expected_result: Any,
        result_tolerance: float,
    ) -> Optional[Dict[str, Any]]:
        in_program_ms = self._extract_in_program_ms(process.stdout, process.stderr)
        if in_program_ms is None:
            print(f"  [FAIL] {language} missing BENCH_IN_PROGRAM_MS on {run_label}")
            return None

        observed_result = self._extract_result_value(process.stdout, process.stderr)
        if observed_result is None:
            print(f"  [FAIL] {language} missing BENCH_RESULT on {run_label}")
            return None

        if not self._results_match(observed_result, expected_result, result_tolerance):
            print(
                f"  [FAIL] {language} result mismatch on {run_label}: "
                f"expected {expected_result!r}, got {observed_result!r}"
            )
            return None

        return {
            "in_program_ms": in_program_ms,
            "result": observed_result,
            "result_valid": True,
        }

    def _metric_summary(self, values: List[Optional[float]]) -> Dict[str, Any]:
        samples = [float(value) for value in values if value is not None]
        summary: Dict[str, Any] = {
            "samples": values,
            "count": len(samples),
            "median": None,
            "min": None,
            "max": None,
            "mean": None,
            "stdev": None,
            "relative_stdev_pct": None,
            "p95": None,
        }
        if samples:
            mean = statistics.fmean(samples)
            stdev = statistics.stdev(samples) if len(samples) > 1 else 0.0
            ordered = sorted(samples)
            p95_index = int(0.95 * (len(ordered) - 1))
            summary.update(
                {
                    "median": statistics.median(samples),
                    "min": min(samples),
                    "max": max(samples),
                    "mean": mean,
                    "stdev": stdev,
                    "relative_stdev_pct": (stdev / mean * 100) if mean else 0.0,
                    "p95": ordered[p95_index],
                }
            )
        return summary

    def _build_result(
        self,
        runs: List[Dict[str, Any]],
        *,
        language: str,
        test_name: str,
        primary_metric: str,
        code_size_bytes: Optional[int] = None,
        expected_result: Any = None,
        result_tolerance: float = 0.0,
        work_units: int = 1,
    ) -> Dict[str, Any]:
        startup_baseline_ms = self._startup_baseline_for_language(language)
        adjusted_runtime_values: List[Optional[float]] = []
        in_program_per_unit_values: List[Optional[float]] = []
        adjusted_runtime_per_unit_values: List[Optional[float]] = []
        for run in runs:
            runtime_process_ms = run.get("runtime_process_ms")
            if startup_baseline_ms is None or runtime_process_ms is None or test_name == "process_startup":
                run["runtime_process_adjusted_ms"] = None
                adjusted_runtime_values.append(None)
            else:
                adjusted = max(0.0, float(runtime_process_ms) - startup_baseline_ms)
                run["runtime_process_adjusted_ms"] = adjusted
                adjusted_runtime_values.append(adjusted)

            in_program_ms = run.get("in_program_ms")
            run["in_program_ms_per_unit"] = (
                float(in_program_ms) / work_units if in_program_ms is not None and work_units > 0 else None
            )
            run["runtime_process_adjusted_ms_per_unit"] = (
                float(run["runtime_process_adjusted_ms"]) / work_units
                if run.get("runtime_process_adjusted_ms") is not None and work_units > 0
                else None
            )
            in_program_per_unit_values.append(run["in_program_ms_per_unit"])
            adjusted_runtime_per_unit_values.append(run["runtime_process_adjusted_ms_per_unit"])

        result: Dict[str, Any] = {
            "iterations": self.iterations,
            "warmups": self.warmups,
            "work_units": work_units,
            "successful_iterations": len(runs),
            "primary_metric": primary_metric,
            "expected_result": expected_result,
            "result_tolerance": result_tolerance,
            "result_valid": bool(runs) and all(run.get("result_valid") for run in runs),
            "compile_ms": self._metric_summary([run.get("compile_ms") for run in runs]),
            "runtime_process_ms": self._metric_summary([run.get("runtime_process_ms") for run in runs]),
            "runtime_process_adjusted_ms": self._metric_summary(adjusted_runtime_values),
            "runtime_startup_baseline_ms": startup_baseline_ms,
            "in_program_ms": self._metric_summary([run.get("in_program_ms") for run in runs]),
            "in_program_ms_per_unit": self._metric_summary(in_program_per_unit_values),
            "runtime_process_adjusted_ms_per_unit": self._metric_summary(adjusted_runtime_per_unit_values),
            "compile_peak_memory_mb": self._metric_summary([run.get("compile_peak_memory_mb") for run in runs]),
            "runtime_peak_memory_mb": self._metric_summary([run.get("runtime_peak_memory_mb") for run in runs]),
            "code_size_bytes": code_size_bytes,
            "runs": runs,
            "timestamp": time.time(),
            "commit": self.commit_hash,
        }

        primary = result.get(primary_metric, {})
        result["time_ms"] = primary.get("median") if isinstance(primary, dict) else None
        return result

    def log_result(self, test_name: str, language: str, result: Dict[str, Any]) -> None:
        self.results.setdefault(test_name, {})[language] = result

    def _startup_baseline_for_language(self, language: str) -> Optional[float]:
        startup_results = self.results.get("process_startup", {})
        baseline_language = "Raw Lua" if language == "LUASCRIPT" else language
        baseline = startup_results.get(baseline_language)
        if not baseline:
            return None
        median = (baseline.get("runtime_process_ms") or {}).get("median")
        return float(median) if median is not None else None

    def _format_stat(self, stat: Dict[str, Any], unit: str) -> str:
        if not stat or stat.get("median") is None:
            return "n/a"
        return (
            f"{stat['median']:.1f}{unit} "
            f"(min {stat['min']:.1f}, max {stat['max']:.1f}, rstd {stat.get('relative_stdev_pct', 0):.1f}%)"
        )

    def _print_result_summary(self, language: str, result: Dict[str, Any]) -> None:
        primary_metric = result.get("primary_metric", "runtime_process_ms")
        metric_labels = {
            "runtime_process_ms": "runtime",
            "compile_ms": "compile",
            "in_program_ms": "in-program",
        }
        parts = [
            f"{metric_labels.get(primary_metric, primary_metric)} {self._format_stat(result[primary_metric], 'ms')}",
        ]
        if result["in_program_ms"]["count"]:
            parts.append(f"in-program {self._format_stat(result['in_program_ms'], 'ms')}")
        if result["in_program_ms_per_unit"]["count"] and result.get("work_units", 1) > 1:
            parts.append(f"in-program/unit {self._format_stat(result['in_program_ms_per_unit'], 'ms')}")
        if result["runtime_process_adjusted_ms"]["count"]:
            parts.append(f"startup-adjusted runtime {self._format_stat(result['runtime_process_adjusted_ms'], 'ms')}")
        if result["runtime_process_adjusted_ms_per_unit"]["count"] and result.get("work_units", 1) > 1:
            parts.append(
                f"startup-adjusted/unit {self._format_stat(result['runtime_process_adjusted_ms_per_unit'], 'ms')}"
            )
        if result["compile_ms"]["count"] and primary_metric != "compile_ms":
            parts.append(f"compile {self._format_stat(result['compile_ms'], 'ms')}")
        if result["runtime_peak_memory_mb"]["count"]:
            parts.append(f"runtime RSS {self._format_stat(result['runtime_peak_memory_mb'], 'MB')}")
        if result["compile_peak_memory_mb"]["count"]:
            parts.append(f"compile RSS {self._format_stat(result['compile_peak_memory_mb'], 'MB')}")
        if result.get("code_size_bytes") is not None:
            parts.append(f"code {result['code_size_bytes']} bytes")
        if result.get("result_valid"):
            parts.append("validated")
        print(f"  [OK] {language}: " + "; ".join(parts))

    def _run_code_benchmark(
        self,
        *,
        test_name: str,
        language: str,
        source_suffix: str,
        source_code: str,
        command_template: Sequence[str],
        timeout: float,
        env: Optional[Dict[str, str]] = None,
        expected_result: Any = None,
        result_tolerance: float = 0.0,
        work_units: int = 1,
    ) -> None:
        path: Optional[str] = None
        try:
            with tempfile.NamedTemporaryFile(mode="w", suffix=source_suffix, delete=False, encoding="utf-8") as handle:
                handle.write(source_code)
                path = handle.name

            for warmup in range(1, self.warmups + 1):
                command = [part.format(source=path) for part in command_template]
                process = self.run_process(command, timeout=timeout, env=env)
                if process.returncode != 0:
                    print(f"  [FAIL] {language} failed on warmup {warmup}: {process.stderr}")
                    return
                if self._extract_markers(
                    process,
                    language=language,
                    run_label=f"warmup {warmup}",
                    expected_result=expected_result,
                    result_tolerance=result_tolerance,
                ) is None:
                    return

            runs: List[Dict[str, Any]] = []
            for iteration in range(1, self.iterations + 1):
                command = [part.format(source=path) for part in command_template]
                process = self.run_process(command, timeout=timeout, env=env)
                if process.returncode != 0:
                    print(f"  [FAIL] {language} failed on iteration {iteration}: {process.stderr}")
                    return
                markers = self._extract_markers(
                    process,
                    language=language,
                    run_label=f"iteration {iteration}",
                    expected_result=expected_result,
                    result_tolerance=result_tolerance,
                )
                if markers is None:
                    return

                runs.append(
                    {
                        "iteration": iteration,
                        "compile_ms": None,
                        "runtime_process_ms": process.elapsed_ms,
                        "in_program_ms": markers["in_program_ms"],
                        "compile_peak_memory_mb": None,
                        "runtime_peak_memory_mb": process.peak_memory_mb,
                        "result": markers["result"],
                        "result_valid": markers["result_valid"],
                    }
                )

            result = self._build_result(
                runs,
                language=language,
                test_name=test_name,
                primary_metric="runtime_process_ms",
                expected_result=expected_result,
                result_tolerance=result_tolerance,
                work_units=work_units,
            )
            self.log_result(test_name, language, result)
            self._print_result_summary(language, result)
        except Exception as exc:
            print(f"  [WARN] {language} benchmark failed: {exc}")
        finally:
            if path and os.path.exists(path):
                os.unlink(path)

    def _instrument_generated_lua(self, lua_file: Path, result_expression: str) -> None:
        lua_code = lua_file.read_text(encoding="utf-8")
        instrumented = (
            "local __bench_start = os.clock()\n"
            f"{lua_code}\n"
            "local __bench_end = os.clock()\n"
            f"print(\"BENCH_RESULT:\" .. tostring({result_expression}))\n"
            "print(string.format(\"BENCH_IN_PROGRAM_MS:%.6f\", (__bench_end - __bench_start) * 1000))\n"
        )
        lua_file.write_text(instrumented, encoding="utf-8")

    def _run_luascript_benchmark(
        self,
        *,
        test_name: str,
        source_code: str,
        timeout: float,
        primary_metric: str = "runtime_process_ms",
        result_expression: str = "result",
        expected_result: Any = None,
        result_tolerance: float = 0.0,
        work_units: int = 1,
    ) -> None:
        try:
            with tempfile.TemporaryDirectory() as tmpdir:
                ls_file = Path(tmpdir) / f"{test_name}.ls"
                lua_file = ls_file.with_suffix(".lua")
                ls_file.write_text(source_code, encoding="utf-8")

                runs: List[Dict[str, Any]] = []
                code_size_bytes: Optional[int] = None

                total_runs = self.warmups + self.iterations
                for run_number in range(1, total_runs + 1):
                    measured = run_number > self.warmups
                    iteration = run_number - self.warmups
                    run_label = f"iteration {iteration}" if measured else f"warmup {run_number}"

                    compile_process = self.run_process(
                        [sys.executable, str(self.compiler_path), "compile", str(ls_file)],
                        timeout=30,
                        env=self.python_env,
                    )
                    if compile_process.returncode != 0:
                        print(f"  [FAIL] LUASCRIPT compilation failed on {run_label}: {compile_process.stderr}")
                        return

                    if not lua_file.exists():
                        print(f"  [FAIL] LUASCRIPT compiler did not produce {lua_file}")
                        return

                    self._instrument_generated_lua(lua_file, result_expression)
                    code_size_bytes = lua_file.stat().st_size

                    run_process = self.run_process([self.lua_bin, str(lua_file)], timeout=timeout)
                    if run_process.returncode != 0:
                        print(f"  [FAIL] LUASCRIPT execution failed on {run_label}: {run_process.stderr}")
                        return
                    markers = self._extract_markers(
                        run_process,
                        language="LUASCRIPT",
                        run_label=run_label,
                        expected_result=expected_result,
                        result_tolerance=result_tolerance,
                    )
                    if markers is None:
                        return

                    if measured:
                        runs.append(
                            {
                                "iteration": iteration,
                                "compile_ms": compile_process.elapsed_ms,
                                "runtime_process_ms": run_process.elapsed_ms,
                                "in_program_ms": markers["in_program_ms"],
                                "compile_peak_memory_mb": compile_process.peak_memory_mb,
                                "runtime_peak_memory_mb": run_process.peak_memory_mb,
                                "result": markers["result"],
                                "result_valid": markers["result_valid"],
                            }
                        )

                result = self._build_result(
                    runs,
                    language="LUASCRIPT",
                    test_name=test_name,
                    primary_metric=primary_metric,
                    code_size_bytes=code_size_bytes,
                    expected_result=expected_result,
                    result_tolerance=result_tolerance,
                    work_units=work_units,
                )
                self.log_result(test_name, "LUASCRIPT", result)
                self._print_result_summary("LUASCRIPT", result)
        except Exception as exc:
            print(f"  [WARN] LUASCRIPT benchmark failed: {exc}")

    def _run_raw_lua_benchmark(
        self,
        *,
        test_name: str,
        source_code: str,
        timeout: float,
        expected_result: Any = None,
        result_tolerance: float = 0.0,
        work_units: int = 1,
    ) -> None:
        self._run_code_benchmark(
            test_name=test_name,
            language="Raw Lua",
            source_suffix=".lua",
            source_code=source_code,
            command_template=[self.lua_bin, "{source}"],
            timeout=timeout,
            expected_result=expected_result,
            result_tolerance=result_tolerance,
            work_units=work_units,
        )

    def run_process_startup_benchmark(self) -> Dict[str, Dict[str, Any]]:
        """Measure child interpreter startup and benchmark harness marker overhead."""
        print(f"[RUN] Running Process Startup benchmark ({self.iterations} iterations)...")

        js_code = """
const __benchStart = process.hrtime.bigint();
const result = 0;
const __benchEnd = process.hrtime.bigint();
console.log('BENCH_RESULT:' + result);
console.log('BENCH_IN_PROGRAM_MS:' + (Number(__benchEnd - __benchStart) / 1e6).toFixed(6));
"""
        self._run_code_benchmark(
            test_name="process_startup",
            language="JavaScript",
            source_suffix=".js",
            source_code=js_code,
            command_template=["node", "{source}"],
            timeout=10,
            expected_result=0,
        )

        python_code = """
import time
start = time.perf_counter()
result = 0
end = time.perf_counter()
print("BENCH_RESULT:{}".format(result))
print("BENCH_IN_PROGRAM_MS:{:.6f}".format((end - start) * 1000))
"""
        self._run_code_benchmark(
            test_name="process_startup",
            language="Python",
            source_suffix=".py",
            source_code=python_code,
            command_template=[sys.executable, "{source}"],
            timeout=10,
            env=self.python_env,
            expected_result=0,
        )

        lua_code = """
local __bench_start = os.clock()
local result = 0
local __bench_end = os.clock()
print("BENCH_RESULT:" .. tostring(result))
print(string.format("BENCH_IN_PROGRAM_MS:%.6f", (__bench_end - __bench_start) * 1000))
"""
        self._run_raw_lua_benchmark(
            test_name="process_startup",
            source_code=lua_code,
            timeout=10,
            expected_result=0,
        )

        return self.results.get("process_startup", {})

    def run_fibonacci_benchmark(self, n: int = 35) -> Dict[str, Dict[str, Any]]:
        """Benchmark recursive Fibonacci calculation."""
        print(f"[RUN] Running Fibonacci({n}) benchmark ({self.iterations} iterations)...")
        work_units = 25 if self.quick else 3
        fib_value = self._fibonacci_expected(n)
        expected = fib_value * work_units

        js_code = f"""
function fibonacci(n) {{
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}}

const __benchStart = process.hrtime.bigint();
let result = 0;
for (let i = 0; i < {work_units}; i++) {{
    result += fibonacci({n});
}}
const __benchEnd = process.hrtime.bigint();
console.log('BENCH_RESULT:' + result);
console.log('BENCH_IN_PROGRAM_MS:' + (Number(__benchEnd - __benchStart) / 1e6).toFixed(6));
"""
        self._run_code_benchmark(
            test_name="fibonacci",
            language="JavaScript",
            source_suffix=".js",
            source_code=js_code,
            command_template=["node", "{source}"],
            timeout=30,
            expected_result=expected,
            work_units=work_units,
        )

        python_code = f"""
import time

def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

start = time.perf_counter()
result = 0
for _ in range({work_units}):
    result += fibonacci({n})
end = time.perf_counter()
print("BENCH_RESULT:{{}}".format(result))
print("BENCH_IN_PROGRAM_MS:{{:.6f}}".format((end - start) * 1000))
"""
        self._run_code_benchmark(
            test_name="fibonacci",
            language="Python",
            source_suffix=".py",
            source_code=python_code,
            command_template=[sys.executable, "{source}"],
            timeout=30,
            env=self.python_env,
            expected_result=expected,
            work_units=work_units,
        )

        lua_code = f"""
local function fibonacci(n)
    if n <= 1 then
        return n
    end
    return fibonacci(n - 1) + fibonacci(n - 2)
end

local __bench_start = os.clock()
local result = 0
for i = 1, {work_units} do
    result = result + fibonacci({n})
end
local __bench_end = os.clock()
print("BENCH_RESULT:" .. tostring(result))
print(string.format("BENCH_IN_PROGRAM_MS:%.6f", (__bench_end - __bench_start) * 1000))
"""
        self._run_raw_lua_benchmark(
            test_name="fibonacci",
            source_code=lua_code,
            timeout=30,
            expected_result=expected,
            work_units=work_units,
        )

        luascript_code = f"""
function fibonacci(n) {{
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}}

let result = 0;
let repeats = 0;
while (repeats < {work_units}) {{
    result = result + fibonacci({n});
    repeats = repeats + 1;
}}
"""
        self._run_luascript_benchmark(
            test_name="fibonacci",
            source_code=luascript_code,
            timeout=30,
            result_expression="result",
            expected_result=expected,
            work_units=work_units,
        )

        return self.results.get("fibonacci", {})

    def run_array_operations_benchmark(self, size: int = 10000) -> Dict[str, Dict[str, Any]]:
        """Benchmark array map and reduce operations."""
        size = min(size, 1000) if self.quick else size
        print(f"[RUN] Running Array Operations benchmark (size: {size}, {self.iterations} iterations)...")
        work_units = 100 if self.quick else 100
        expected = self._array_expected(size) * work_units

        js_code = f"""
const numbers = Array.from({{length: {size}}}, (_, i) => i + 1);

const __benchStart = process.hrtime.bigint();
let sum = 0;
for (let iteration = 0; iteration < {work_units}; iteration++) {{
    const doubled = numbers.map(x => x * 2);
    sum += doubled.reduce((a, b) => a + b, 0);
}}
const __benchEnd = process.hrtime.bigint();
console.log('BENCH_RESULT:' + sum);
console.log('BENCH_IN_PROGRAM_MS:' + (Number(__benchEnd - __benchStart) / 1e6).toFixed(6));
"""
        self._run_code_benchmark(
            test_name="array_ops",
            language="JavaScript",
            source_suffix=".js",
            source_code=js_code,
            command_template=["node", "{source}"],
            timeout=30,
            expected_result=expected,
            work_units=work_units,
        )

        lua_code = f"""
local __bench_start = os.clock()
local sum = 0
for iteration = 1, {work_units} do
    for i = 1, {size} do
        local doubled = i * 2
        sum = sum + doubled
    end
end
local __bench_end = os.clock()
print("BENCH_RESULT:" .. tostring(sum))
print(string.format("BENCH_IN_PROGRAM_MS:%.6f", (__bench_end - __bench_start) * 1000))
"""
        self._run_raw_lua_benchmark(
            test_name="array_ops",
            source_code=lua_code,
            timeout=30,
            expected_result=expected,
            work_units=work_units,
        )

        luascript_code = f"""
let sum = 0;
let iteration = 0;
while (iteration < {work_units}) {{
    let i = 1;
    while (i <= {size}) {{
        let doubled = i * 2;
        sum = sum + doubled;
        i = i + 1;
    }}
    iteration = iteration + 1;
}}
"""
        self._run_luascript_benchmark(
            test_name="array_ops",
            source_code=luascript_code,
            timeout=30,
            result_expression="sum",
            expected_result=expected,
            work_units=work_units,
        )

        return self.results.get("array_ops", {})

    def run_compilation_speed_benchmark(self) -> Dict[str, Dict[str, Any]]:
        """Benchmark LUASCRIPT compilation speed and generated-code execution."""
        print(f"[RUN] Running Compilation Speed benchmark ({self.iterations} iterations)...")
        expected = self._compilation_expected()

        complex_code = """
function square(x) {
    return x * x;
}

function fibonacci(n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

function weighted(n) {
    let total = 0;
    let i = 0;
    while (i < n) {
        total = total + square(i);
        if (i < 12) {
            total = total + fibonacci(i);
        }
        i = i + 1;
    }
    return total;
}

let result = 0;
let outer = 0;
while (outer < 50) {
    result = result + weighted(outer);
    outer = outer + 1;
}

"""
        self._run_luascript_benchmark(
            test_name="compilation",
            source_code=complex_code,
            timeout=10,
            primary_metric="compile_ms",
            result_expression="result",
            expected_result=expected,
        )

        return self.results.get("compilation", {})

    def run_mathematical_expression_benchmark(self) -> Dict[str, Dict[str, Any]]:
        """Benchmark mathematical expression evaluation."""
        print(f"[RUN] Running Mathematical Expression benchmark ({self.iterations} iterations)...")
        work_units = 50 if self.quick else 50
        expected = self._math_expected_repeated(work_units)

        luascript_code = """
let total = 0;

let iteration = 0;
while (iteration < WORK_UNITS_PLACEHOLDER) {
    let i = 1;
    while (i <= 1000) {
        let x = i / 100.0;

        // Beautiful mathematical expressions
        let area = π × x²;
        let gaussian = (1/√(2×π)) × ℯ^(-x²/2);
        let distance = √((x - 1)² + (x - 2)²);
        let polynomial = x³ - 2×x² + 3×x - 1;

        total = total + area + gaussian + distance + polynomial;
        i = i + 1;
    }
    iteration = iteration + 1;
}

""".replace("WORK_UNITS_PLACEHOLDER", str(work_units))
        self._run_luascript_benchmark(
            test_name="math_expressions",
            source_code=luascript_code,
            timeout=30,
            result_expression="total",
            expected_result=expected,
            result_tolerance=1e-2 * work_units,
            work_units=work_units,
        )

        lua_code = f"""
local sqrt = math.sqrt
local pi = math.pi
local exp = math.exp
local total = 0

local __bench_start = os.clock()
for iteration = 1, {work_units} do
    for i = 1, 1000 do
        local x = i / 100.0
        local area = pi * x ^ 2
        local gaussian = (1 / sqrt(2 * pi)) * exp(-(x ^ 2) / 2)
        local distance = sqrt((x - 1) ^ 2 + (x - 2) ^ 2)
        local polynomial = x ^ 3 - 2 * x ^ 2 + 3 * x - 1
        total = total + area + gaussian + distance + polynomial
    end
end
local __bench_end = os.clock()
print("BENCH_RESULT:" .. tostring(total))
print(string.format("BENCH_IN_PROGRAM_MS:%.6f", (__bench_end - __bench_start) * 1000))
"""
        self._run_raw_lua_benchmark(
            test_name="math_expressions",
            source_code=lua_code,
            timeout=30,
            expected_result=expected,
            result_tolerance=1e-2 * work_units,
            work_units=work_units,
        )

        return self.results.get("math_expressions", {})

    def _sort_value(self, item: Any) -> float:
        _, data = item
        primary_metric = data.get("primary_metric", "runtime_process_ms")
        primary = data.get(primary_metric) or {}
        median = primary.get("median")
        return float(median) if median is not None else float("inf")

    def _metric_line(self, label: str, stat: Dict[str, Any], unit: str) -> Optional[str]:
        if not stat.get("count"):
            return None
        return f"{label} {self._format_stat(stat, unit)}"

    def _speedup_phrase(self, speedup: float) -> str:
        if speedup >= 1:
            return f"{speedup:.1f}x faster"
        if speedup > 0:
            return f"{1 / speedup:.1f}x slower"
        return "n/a"

    def build_comparisons(self) -> Dict[str, Any]:
        comparisons: Dict[str, Any] = {}
        metrics = (
            "runtime_process_ms",
            "runtime_process_adjusted_ms",
            "runtime_process_adjusted_ms_per_unit",
            "in_program_ms",
            "in_program_ms_per_unit",
            "compile_ms",
        )

        for test_name, results in self.results.items():
            if test_name == "process_startup":
                continue
            baseline = results.get("LUASCRIPT")
            if not baseline or not baseline.get("result_valid"):
                continue

            test_comparisons: Dict[str, Any] = {}
            for metric in metrics:
                baseline_median = (baseline.get(metric) or {}).get("median")
                if baseline_median is None or baseline_median == 0:
                    continue

                metric_comparisons: Dict[str, Any] = {}
                for language, data in results.items():
                    if language == "LUASCRIPT" or not data.get("result_valid"):
                        continue
                    comparison_median = (data.get(metric) or {}).get("median")
                    if comparison_median is None or comparison_median == 0:
                        continue

                    luascript_speedup = comparison_median / baseline_median
                    metric_comparisons[language] = {
                        "luascript_median": baseline_median,
                        "comparison_median": comparison_median,
                        "luascript_speedup_vs_comparison": luascript_speedup,
                        "comparison_speedup_vs_luascript": baseline_median / comparison_median
                        if comparison_median
                        else None,
                        "winner": "LUASCRIPT"
                        if baseline_median < comparison_median
                        else language
                        if comparison_median < baseline_median
                        else "tie",
                    }

                if metric_comparisons:
                    test_comparisons[metric] = metric_comparisons

            if test_comparisons:
                comparisons[test_name] = {
                    "baseline": "LUASCRIPT",
                    "metrics": test_comparisons,
                }

        return comparisons

    def generate_report(self) -> str:
        """Generate comprehensive benchmark report."""
        report = "\n" + "=" * 80 + "\n"
        report += "LUASCRIPT PERFORMANCE BENCHMARK REPORT\n"
        report += f"Commit: {self.commit_hash}\n"
        report += f"Iterations: {self.iterations}\n"
        report += f"Warmups: {self.warmups}\n"
        report += f"Platform: {self.environment['platform']}\n"
        report += f"Python: {self.environment['python_version']} | Node: {self.environment['node_version']['output']} | Lua: {self.environment['lua_version']['output']}\n"
        report += "=" * 80 + "\n\n"

        for test_name, results in self.results.items():
            report += f"{test_name.replace('_', ' ').title()}:\n"
            report += "-" * 40 + "\n"

            for lang, data in sorted(results.items(), key=self._sort_value):
                primary_metric = data.get("primary_metric", "runtime_process_ms")
                primary = data.get(primary_metric, {})
                metric_labels = {
                    "runtime_process_ms": "runtime process",
                    "compile_ms": "compile",
                    "in_program_ms": "in-program",
                }
                primary_label = metric_labels.get(primary_metric, primary_metric.replace("_", " "))
                line = f"  {lang:12}: {primary_label} {self._format_stat(primary, 'ms')}"

                details = [
                    self._metric_line("in-program", data["in_program_ms"], "ms"),
                    self._metric_line("in-program/unit", data["in_program_ms_per_unit"], "ms")
                    if data.get("work_units", 1) > 1
                    else None,
                    self._metric_line("startup-adjusted runtime", data["runtime_process_adjusted_ms"], "ms"),
                    self._metric_line(
                        "startup-adjusted/unit",
                        data["runtime_process_adjusted_ms_per_unit"],
                        "ms",
                    )
                    if data.get("work_units", 1) > 1
                    else None,
                    None if primary_metric == "compile_ms" else self._metric_line("compile", data["compile_ms"], "ms"),
                    self._metric_line("runtime RSS", data["runtime_peak_memory_mb"], "MB"),
                    self._metric_line("compile RSS", data["compile_peak_memory_mb"], "MB"),
                ]
                details = [detail for detail in details if detail]
                if data.get("work_units", 1) > 1:
                    details.append(f"work units {data['work_units']}")
                if data.get("code_size_bytes") is not None:
                    details.append(f"code {data['code_size_bytes']} bytes")
                if data.get("result_valid"):
                    details.append(f"validated result {data.get('expected_result')!r}")

                report += line + "\n"
                if details:
                    report += " " * 16 + "; ".join(details) + "\n"

            report += "\n"

        report += "PERFORMANCE SUMMARY:\n"
        report += "-" * 40 + "\n"

        comparisons = self.build_comparisons()
        for test_name, test_comparisons in comparisons.items():
            title = test_name.replace("_", " ").title()
            metric_labels = {
                "runtime_process_ms": "runtime process",
                "runtime_process_adjusted_ms": "startup-adjusted runtime",
                "runtime_process_adjusted_ms_per_unit": "startup-adjusted/unit",
                "in_program_ms": "in-program",
                "in_program_ms_per_unit": "in-program/unit",
            }
            for metric, metric_label in metric_labels.items():
                metric_comparisons = test_comparisons["metrics"].get(metric, {})
                for language, comparison in sorted(metric_comparisons.items()):
                    speedup = comparison["luascript_speedup_vs_comparison"]
                    report += f"  {title} {metric_label} vs {language}: {self._speedup_phrase(speedup)}\n"

        fib = self.results.get("fibonacci", {}).get("LUASCRIPT")
        if fib:
            lua_compile = fib["compile_ms"]["median"]
            lua_runtime = fib["runtime_process_ms"]["median"]
            if lua_compile is not None and lua_runtime is not None:
                report += f"  LUASCRIPT Fibonacci compile+runtime median: {lua_compile + lua_runtime:.1f}ms\n"

        report += "\nCONCLUSION: LUASCRIPT performance is tracked with validated results, separate compile,\n"
        report += "   process runtime, startup-adjusted runtime, in-program runtime, per-unit work timing,\n"
        report += "   iteration samples, and child-process memory metadata.\n\n"

        return report

    def save_results(self, filename: Optional[str] = None) -> None:
        """Save benchmark results to JSON file."""
        output_path = Path(filename) if filename else self.resolved_output_path()
        output_path.parent.mkdir(parents=True, exist_ok=True)
        payload = {
            "schema_version": 7,
            "commit": self.commit_hash,
            "generated_at": time.time(),
            "config": {
                "quick": self.quick,
                "iterations": self.iterations,
                "warmups": self.warmups,
                "lua_bin": self.lua_bin,
            },
            "methodology": {
                "warmups": "Warmup runs execute before measured iterations and are not included in samples.",
                "work_units": "Some benchmarks repeat the logical workload inside one child process to keep in-program timings above timer resolution.",
                "runtime_process_ms": "Wall-clock elapsed time around each child interpreter process.",
                "in_program_ms": "Timer emitted from inside the benchmark program; LUASCRIPT is instrumented after compilation.",
                "in_program_ms_per_unit": "In-program elapsed time divided by the benchmark's logical work units.",
                "memory": "Peak child process-tree RSS sampled by psutil while the child process is running.",
                "statistics": "Median/min/max/mean/stdev/p95 are computed from measured iterations only.",
                "result_validation": "Every warmup and measured run must emit BENCH_RESULT matching the benchmark's expected result.",
                "raw_lua_baseline": "Raw Lua uses the configured Lua interpreter directly for runtime-only baselines where applicable.",
                "comparisons": "LUASCRIPT speedups are computed from median timings; values above 1.0 mean LUASCRIPT is faster.",
                "process_startup": "Process startup baselines measure minimal marker-only programs for each interpreter.",
                "runtime_process_adjusted_ms": "Runtime process time minus the median startup baseline for the same interpreter family, clamped at zero.",
                "runtime_process_adjusted_ms_per_unit": "Startup-adjusted runtime divided by the benchmark's logical work units.",
            },
            "environment": self.environment,
            "results": self.results,
        }
        with open(output_path, "w", encoding="utf-8") as handle:
            payload["comparisons"] = self.build_comparisons()
            json.dump(payload, handle, indent=2)
        print(f"[OK] Results saved to {output_path}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Run LUASCRIPT performance benchmarks",
        allow_abbrev=False,
    )
    parser.add_argument("--output", help="Path to write benchmark JSON output")
    parser.add_argument("--lua-bin", default=os.environ.get("LUA_BIN", "lua"), help="Lua interpreter to use")
    parser.add_argument("--iterations", type=int, help="Benchmark iterations per language/test")
    parser.add_argument("--warmups", type=int, help="Warmup runs per language/test before measured iterations")
    parser.add_argument("--quick", action="store_true", help="Run in quick/CI mode with reduced sizes")
    parser.add_argument("--ci", action="store_true", help="Alias for --quick with default output path")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    quick_mode = bool(args.quick or args.ci)
    iterations = args.iterations if args.iterations is not None else (3 if quick_mode else 5)
    warmups = args.warmups if args.warmups is not None else (1 if quick_mode else 2)
    if iterations < 1:
        print("[FAIL] --iterations must be at least 1", file=sys.stderr)
        sys.exit(2)
    if warmups < 0:
        print("[FAIL] --warmups must be at least 0", file=sys.stderr)
        sys.exit(2)

    print("LUASCRIPT PERFORMANCE BENCHMARK SUITE")
    print("=" * 50)
    print("Steve Jobs + Donald Knuth Excellence Standards")
    print(f"Iterations per benchmark: {iterations}")
    print(f"Warmups per benchmark: {warmups}\n")

    benchmark = LuaScriptBenchmark(
        lua_bin=args.lua_bin,
        quick=quick_mode,
        output_path=args.output,
        iterations=iterations,
        warmups=warmups,
    )

    try:
        benchmark.run_process_startup_benchmark()
        benchmark.run_fibonacci_benchmark(20 if benchmark.quick else 30)
        benchmark.run_array_operations_benchmark(500 if benchmark.quick else 1000)
        benchmark.run_compilation_speed_benchmark()
        benchmark.run_mathematical_expression_benchmark()

        report = benchmark.generate_report()
        print(report)

        benchmark.save_results(args.output)

    except KeyboardInterrupt:
        print("\n[WARN] Benchmark interrupted by user")
    except Exception as exc:
        print(f"\n[FAIL] Benchmark failed: {exc}")


if __name__ == "__main__":
    main()
