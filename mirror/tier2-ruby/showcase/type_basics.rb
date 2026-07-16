# MIRROR V3: Tier 2 Ruby Showcase
# Category: Type System
# Module: type_basics.rb
# Purpose: Demonstrate Ruby type system basics

def check_type(value)
  value.class.name
end

def is_numeric?(value)
  value.is_a?(Numeric)
end

def is_sequence?(value)
  value.is_a?(Array) || value.is_a?(String)
end

def combine_types(a, b)
  if a.is_a?(String) && b.is_a?(String)
    "#{a}#{b}"
  elsif a.is_a?(Numeric) && b.is_a?(Numeric)
    (a + b).to_s
  else
    "mixed"
  end
end

result = {
  type_check_int: check_type(42),
  type_check_str: check_type("hello"),
  is_numeric_int: is_numeric?(100),
  is_numeric_str: is_numeric?("text"),
  is_sequence_list: is_sequence?([1, 2, 3]),
  combined_strings: combine_types("hello", "world"),
  combined_numbers: combine_types(10, 20),
}

puts result.inspect
