# MIRROR V3: Tier 2 Ruby Showcase
# Category: Optimization
# Module: perf_memoization.rb
# Purpose: Demonstrate generic memoization

def memoize(&block)
  cache = {}
  -> (*args) do
    key = args
    cache[key] ||= block.call(*args)
  end
end

def expensive_computation(n)
  result = 0
  n.times { |i| result += i * i }
  result
end

custom_memoized = memoize do |x|
  total = 0
  x.times { |i| total += i }
  total
end

result = {
  expensive_5: expensive_computation(5),
  expensive_10: expensive_computation(10),
  custom_memo_100: custom_memoized.call(100),
  custom_memo_200: custom_memoized.call(200),
  memoization_active: true,
}

puts result.inspect
