# MIRROR V3: Tier 2 Ruby Showcase
# Category: Optimization
# Module: perf_deadcode.rb
# Purpose: Demonstrate dead code elimination awareness

ENABLE_DEBUG = false
ENABLE_LOGGING = false
ENABLE_OPTIMIZATION = true

def compute_with_features(value)
  result = value
  
  result = result + 1000 if ENABLE_DEBUG
  result = result * 2 if ENABLE_OPTIMIZATION
  puts "Result: #{result}" if ENABLE_LOGGING
  
  result
end

def optimized_path(x)
  if ENABLE_OPTIMIZATION
    x * 2
  else
    x + 1
  end
end

def feature_branch(features)
  result = 100
  
  if features[:fast]
    result = result * 5
  else
    result = result + 10
  end
  
  result
end

result = {
  optimized_50: compute_with_features(50),
  fast_path_100: optimized_path(100),
  feature_fast: feature_branch(fast: true),
  feature_slow: feature_branch(fast: false),
  dead_code_removed: !ENABLE_DEBUG,
}

puts result.inspect
