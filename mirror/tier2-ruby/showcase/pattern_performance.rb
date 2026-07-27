# MIRROR V3: Tier 2 Ruby Showcase
# Category: Pattern Matching
# Module: pattern_performance.rb
# Purpose: Demonstrate optimized pattern matching

def fast_match(value)
  case value
  when Integer
    "fast_int"
  when String
    "fast_str"
  when Array
    "fast_list"
  when Hash
    "fast_hash"
  else
    "other"
  end
end

def optimized_dispatch(value, operation)
  case value
  when Integer
    case operation
    when "double"
      value * 2
    end
  when String
    case operation
    when "upper"
      value.upcase
    end
  when Array
    case operation
    when "length"
      value.size
    end
  end
end

def batch_match(values)
  results = []
  type_cache = {}
  
  values.each do |v|
    t = v.class.name
    type_cache[t] ||= 0
    type_cache[t] += 1
    results << fast_match(v)
  end
  
  {matches: results, type_counts: type_cache}
end

result = {
  fast_int: fast_match(42),
  fast_str: fast_match("hello"),
  fast_list: fast_match([1, 2, 3]),
  dispatch_double: optimized_dispatch(5, "double"),
  dispatch_upper: optimized_dispatch("test", "upper"),
  batch_count: batch_match([1, "a", 2, "b", 3])[:matches].size,
}

puts result.inspect
