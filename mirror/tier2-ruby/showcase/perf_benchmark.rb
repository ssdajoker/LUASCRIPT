# MIRROR V3: Tier 2 Ruby Showcase
# Category: Optimization
# Module: perf_benchmark.rb
# Purpose: Demonstrate performance benchmarking

def measure_time(method_sym = nil, iterations: 1000, &block)
  start = Time.now
  
  iterations.times do
    block.call if block
  end
  
  elapsed = (Time.now - start) * 1000
  
  {
    elapsed_ms: elapsed.round(3),
    iterations: iterations,
    per_call_us: (elapsed * 1000 / iterations).round(2),
  }
end

def simple_operation(x)
  x * 2
end

def complex_operation(x)
  result = 0
  10.times { |i| result += x * i }
  result
end

def optimized_operation(x)
  x * 10 * 9 / 2
end

simple_bench = measure_time(iterations: 10000) { simple_operation(100) }
complex_bench = measure_time(iterations: 1000) { complex_operation(100) }
optimized_bench = measure_time(iterations: 10000) { optimized_operation(100) }

result = {
  simple_elapsed: simple_bench[:elapsed_ms],
  complex_elapsed: complex_bench[:elapsed_ms],
  optimized_elapsed: optimized_bench[:elapsed_ms],
  benchmarking_active: true,
}

puts result.inspect
