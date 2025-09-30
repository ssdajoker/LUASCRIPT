#!/usr/bin/env python3
"""
LUASCRIPT Performance Monitor
Real-time performance tracking and optimization suggestions
Part of Week 2 completion - performance benchmarking integration

Author: Linus Torvalds (GitHub Integration Lead)
"""

import time
import psutil
import os
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, field
from contextlib import contextmanager

@dataclass
class PerformanceMetrics:
    """Performance metrics for compilation and execution"""
    compilation_time: float = 0.0
    memory_usage: float = 0.0
    lines_of_code: int = 0
    tokens_generated: int = 0
    ast_nodes: int = 0
    lua_lines_generated: int = 0
    execution_time: Optional[float] = None
    peak_memory: float = 0.0
    
    @property
    def compilation_speed(self) -> float:
        """Lines per second compilation speed"""
        if self.compilation_time > 0:
            return self.lines_of_code / self.compilation_time
        return 0.0
    
    @property
    def memory_efficiency(self) -> float:
        """Memory usage per line of code (MB/LOC)"""
        if self.lines_of_code > 0:
            return self.memory_usage / self.lines_of_code
        return 0.0

@dataclass
class BenchmarkResult:
    """Benchmark comparison result"""
    filename: str
    metrics: PerformanceMetrics
    baseline_metrics: Optional[PerformanceMetrics] = None
    performance_grade: str = "A"
    warnings: List[str] = field(default_factory=list)
    optimizations: List[str] = field(default_factory=list)

class PerformanceMonitor:
    """Monitor and track LUASCRIPT performance"""
    
    def __init__(self):
        self.baselines: Dict[str, PerformanceMetrics] = {}
        self.current_metrics: Optional[PerformanceMetrics] = None
        self.process = psutil.Process()
    
    @contextmanager
    def measure_compilation(self, filename: str, source_lines: int):
        """Context manager for measuring compilation performance"""
        self.current_metrics = PerformanceMetrics(lines_of_code=source_lines)
        
        # Start measurements
        start_time = time.perf_counter()
        start_memory = self.process.memory_info().rss / 1024 / 1024  # MB
        
        try:
            yield self.current_metrics
        finally:
            # End measurements
            end_time = time.perf_counter()
            end_memory = self.process.memory_info().rss / 1024 / 1024  # MB
            
            self.current_metrics.compilation_time = end_time - start_time
            self.current_metrics.memory_usage = end_memory - start_memory
            self.current_metrics.peak_memory = max(start_memory, end_memory)
    
    def record_tokens(self, count: int):
        """Record number of tokens generated"""
        if self.current_metrics:
            self.current_metrics.tokens_generated = count
    
    def record_ast_nodes(self, count: int):
        """Record number of AST nodes created"""
        if self.current_metrics:
            self.current_metrics.ast_nodes = count
    
    def record_lua_lines(self, count: int):
        """Record number of Lua lines generated"""
        if self.current_metrics:
            self.current_metrics.lua_lines_generated = count
    
    def record_execution_time(self, execution_time: float):
        """Record Lua execution time"""
        if self.current_metrics:
            self.current_metrics.execution_time = execution_time
    
    def set_baseline(self, filename: str, metrics: PerformanceMetrics):
        """Set baseline metrics for comparison"""
        self.baselines[filename] = metrics
    
    def analyze_performance(self, filename: str) -> BenchmarkResult:
        """Analyze current performance against baselines"""
        if not self.current_metrics:
            raise ValueError("No current metrics available")
        
        result = BenchmarkResult(
            filename=filename,
            metrics=self.current_metrics,
            baseline_metrics=self.baselines.get(filename)
        )
        
        # Performance grading
        compilation_speed = self.current_metrics.compilation_speed
        memory_efficiency = self.current_metrics.memory_efficiency
        
        if compilation_speed > 10000:  # >10k LOC/sec
            result.performance_grade = "A+"
        elif compilation_speed > 5000:  # >5k LOC/sec
            result.performance_grade = "A"
        elif compilation_speed > 1000:  # >1k LOC/sec
            result.performance_grade = "B"
        elif compilation_speed > 500:   # >500 LOC/sec
            result.performance_grade = "C"
        else:
            result.performance_grade = "D"
        
        # Generate warnings and optimizations
        self._generate_recommendations(result)
        
        return result
    
    def _generate_recommendations(self, result: BenchmarkResult):
        """Generate performance recommendations"""
        metrics = result.metrics
        
        # Compilation speed warnings
        if metrics.compilation_speed < 1000:
            result.warnings.append(
                f"Slow compilation: {metrics.compilation_speed:.0f} LOC/sec"
            )
            result.optimizations.extend([
                "Consider optimizing parser for complex expressions",
                "Check for inefficient AST node creation",
                "Profile lexer performance"
            ])
        
        # Memory usage warnings
        if metrics.memory_efficiency > 1.0:  # >1MB per LOC
            result.warnings.append(
                f"High memory usage: {metrics.memory_efficiency:.2f} MB/LOC"
            )
            result.optimizations.extend([
                "Optimize AST node memory usage",
                "Consider streaming compilation for large files",
                "Check for memory leaks in transpiler"
            ])
        
        # Baseline comparison
        if result.baseline_metrics:
            baseline = result.baseline_metrics
            current = metrics
            
            # Speed regression
            if current.compilation_speed < baseline.compilation_speed * 0.9:
                regression = (1 - current.compilation_speed / baseline.compilation_speed) * 100
                result.warnings.append(
                    f"Performance regression: {regression:.1f}% slower than baseline"
                )
            
            # Memory regression
            if current.memory_usage > baseline.memory_usage * 1.1:
                regression = (current.memory_usage / baseline.memory_usage - 1) * 100
                result.warnings.append(
                    f"Memory regression: {regression:.1f}% more memory than baseline"
                )
    
    def format_report(self, result: BenchmarkResult) -> str:
        """Format performance report"""
        lines = []
        metrics = result.metrics
        
        # Header
        lines.append(f"🚀 Performance Report: {result.filename}")
        lines.append("=" * 60)
        
        # Core metrics
        lines.append(f"📊 Compilation Speed: {metrics.compilation_speed:.0f} LOC/sec")
        lines.append(f"⏱️  Compilation Time: {metrics.compilation_time*1000:.1f}ms")
        lines.append(f"💾 Memory Usage: {metrics.memory_usage:.2f} MB")
        lines.append(f"📝 Lines of Code: {metrics.lines_of_code}")
        lines.append(f"🎯 Tokens Generated: {metrics.tokens_generated}")
        lines.append(f"🌳 AST Nodes: {metrics.ast_nodes}")
        lines.append(f"🔧 Lua Lines: {metrics.lua_lines_generated}")
        
        if metrics.execution_time:
            lines.append(f"⚡ Execution Time: {metrics.execution_time*1000:.1f}ms")
        
        # Grade
        grade_emoji = {"A+": "🏆", "A": "🥇", "B": "🥈", "C": "🥉", "D": "⚠️"}
        lines.append(f"\n{grade_emoji.get(result.performance_grade, '📊')} Performance Grade: {result.performance_grade}")
        
        # Baseline comparison
        if result.baseline_metrics:
            lines.append(f"\n📈 Baseline Comparison:")
            baseline = result.baseline_metrics
            speed_change = (metrics.compilation_speed / baseline.compilation_speed - 1) * 100
            memory_change = (metrics.memory_usage / baseline.memory_usage - 1) * 100
            
            speed_emoji = "🚀" if speed_change > 0 else "🐌" if speed_change < -10 else "➡️"
            memory_emoji = "💚" if memory_change < 0 else "🔴" if memory_change > 10 else "➡️"
            
            lines.append(f"  {speed_emoji} Speed: {speed_change:+.1f}%")
            lines.append(f"  {memory_emoji} Memory: {memory_change:+.1f}%")
        
        # Warnings
        if result.warnings:
            lines.append(f"\n⚠️  Warnings:")
            for warning in result.warnings:
                lines.append(f"  • {warning}")
        
        # Optimizations
        if result.optimizations:
            lines.append(f"\n💡 Optimization Suggestions:")
            for opt in result.optimizations:
                lines.append(f"  • {opt}")
        
        return "\n".join(lines)

# Global performance monitor instance
performance_monitor = PerformanceMonitor()
