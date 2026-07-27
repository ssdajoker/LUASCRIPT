# MIRROR V3: Tier 2 Ruby Showcase
# Category: Pattern Matching
# Module: pattern_exhaustive.rb
# Purpose: Demonstrate exhaustive pattern matching

def exhaustive_match(value)
  case value
  when nil
    "nil"
  when true, false
    "boolean"
  when Integer
    "integer"
  when Float
    "float"
  when String
    "string"
  when Array
    "list"
  when Hash
    "dictionary"
  when Proc
    "function"
  else
    "unknown"
  end
end

def handle_all_types(value)
  case exhaustive_match(value)
  when "integer"
    value * 2
  when "string"
    value.upcase
  when "list"
    value.size
  when "dictionary"
    value.keys
  when "function"
    "callable"
  else
    nil
  end
end

result = {
  type_nil: exhaustive_match(nil),
  type_bool: exhaustive_match(true),
  type_int: exhaustive_match(42),
  type_float: exhaustive_match(3.14),
  type_str: exhaustive_match("hello"),
  type_list: exhaustive_match([1, 2, 3]),
  type_hash: exhaustive_match({"a" => 1}),
  handle_int: handle_all_types(10),
  handle_str: handle_all_types("test"),
}

puts result.inspect
