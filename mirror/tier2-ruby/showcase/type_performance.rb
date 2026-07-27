# MIRROR V3: Tier 2 Ruby Showcase
# Category: Type System
# Module: type_performance.rb
# Purpose: Demonstrate type-aware performance optimization

def fast_numeric_op(a, b)
  if a.is_a?(Numeric) && b.is_a?(Numeric)
    a + b
  else
    "#{a}#{b}"
  end
end

def optimized_dispatch(value, operation)
  case value
  when Integer
    case operation
    when "double"
      value * 2
    when "square"
      value * value
    end
  when String
    case operation
    when "upper"
      value.upcase
    when "len"
      value.length
    end
  end
end

result = {
  fast_add: fast_numeric_op(10, 20),
  fast_concat: fast_numeric_op("hello", "world"),
  dispatch_double: optimized_dispatch(25, "double"),
  dispatch_square: optimized_dispatch(5, "square"),
  dispatch_upper: optimized_dispatch("test", "upper"),
}

puts result.inspect
