# MIRROR V3: Tier 2 Ruby Showcase
# Category: IR & Determinism
# Module: ir_tracing.rb
# Purpose: Demonstrate IR-level tracing

class IRTracer
  def initialize
    @trace = []
  end
  
  def record(operation, inputs, output)
    @trace << {
      op: operation,
      inputs: inputs,
      output: output,
    }
  end
  
  def traced_add(a, b)
    result = a + b
    record("add", [a, b], result)
    result
  end
  
  def traced_mul(a, b)
    result = a * b
    record("mul", [a, b], result)
    result
  end
  
  def get_trace
    @trace
  end
  
  def get_trace_length
    @trace.size
  end
end

tracer = IRTracer.new
r1 = tracer.traced_add(10, 20)
r2 = tracer.traced_mul(5, 6)
r3 = tracer.traced_add(r1, r2)
trace_len = tracer.get_trace_length

result = {
  result_1: r1,
  result_2: r2,
  result_3: r3,
  trace_length: trace_len,
  tracing_enabled: true,
}

puts result.inspect
