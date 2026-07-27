"""
MIRROR V3: Tier 2 Python Showcase
Category: IR & Determinism
Module: ir_tracing.py
Purpose: Demonstrate IR-level tracing
"""

from typing import List, Dict, Any


class IRTracer:
    """IR-level execution tracer"""
    def __init__(self):
        self.trace: List[Dict] = []
    
    def record(self, operation: str, inputs: list, output: Any):
        """Record operation"""
        self.trace.append({
            "op": operation,
            "inputs": inputs,
            "output": output,
        })
    
    def traced_add(self, a: int, b: int) -> int:
        """Traced addition"""
        result = a + b
        self.record("add", [a, b], result)
        return result
    
    def traced_mul(self, a: int, b: int) -> int:
        """Traced multiplication"""
        result = a * b
        self.record("mul", [a, b], result)
        return result
    
    def get_trace(self) -> List[Dict]:
        """Get trace"""
        return self.trace
    
    def get_trace_length(self) -> int:
        """Get trace length"""
        return len(self.trace)


tracer = IRTracer()
r1 = tracer.traced_add(10, 20)
r2 = tracer.traced_mul(5, 6)
r3 = tracer.traced_add(r1, r2)
trace_len = tracer.get_trace_length()

result = {
    "result_1": r1,
    "result_2": r2,
    "result_3": r3,
    "trace_length": trace_len,
    "tracing_enabled": True,
}

if __name__ == "__main__":
    print(result)
