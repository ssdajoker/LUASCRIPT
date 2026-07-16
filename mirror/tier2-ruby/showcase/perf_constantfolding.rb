# MIRROR V3: Tier 2 Ruby Showcase
# Category: Optimization
# Module: perf_constantfolding.rb
# Purpose: Demonstrate constant folding optimization

MULTIPLIER = 10
OFFSET = 5
MAX_VALUE = 1000
BASE_RESULT = 100

def compute_with_constants(x)
  result = x * MULTIPLIER + OFFSET
  result > MAX_VALUE ? MAX_VALUE : result
end

def optimized_constants(values)
  values.map do |v|
    opt = (v * MULTIPLIER) + OFFSET
    [opt, MAX_VALUE].min
  end
end

def constant_table
  (0..9).each_with_object({}) do |i, hash|
    hash["value_#{i}"] = compute_with_constants(i)
  end
end

result = {
  const_5: compute_with_constants(5),
  const_50: compute_with_constants(50),
  const_100: compute_with_constants(100),
  optimized: optimized_constants([1, 2, 3, 4, 5]),
  table_size: constant_table.size,
}

puts result.inspect
