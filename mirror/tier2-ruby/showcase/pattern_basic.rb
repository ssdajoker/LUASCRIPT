# MIRROR V3: Tier 2 Ruby Showcase
# Category: Pattern Matching
# Module: pattern_basic.rb
# Purpose: Demonstrate basic pattern matching

def match_type(value)
  case value
  when Integer
    "integer"
  when String
    "string"
  when Array
    "list"
  when Hash
    "dict"
  else
    "unknown"
  end
end

def match_value(value)
  case value
  when 0
    "zero"
  when 1..Float::INFINITY
    "positive"
  when -Float::INFINITY...0
    "negative"
  else
    "unknown"
  end
end

def match_pattern(obj)
  if obj.is_a?(Hash)
    if obj.key?("name") && obj.key?("age")
      "person"
    elsif obj.key?("x") && obj.key?("y")
      "point"
    else
      "generic"
    end
  end
end

result = {
  type_int: match_type(42),
  type_str: match_type("hello"),
  type_list: match_type([1, 2, 3]),
  value_zero: match_value(0),
  value_pos: match_value(10),
  pattern_person: match_pattern({"name" => "Alice", "age" => 30}),
  pattern_point: match_pattern({"x" => 1, "y" => 2}),
}

puts result.inspect
