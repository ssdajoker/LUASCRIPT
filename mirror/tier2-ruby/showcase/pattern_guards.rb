# MIRROR V3: Tier 2 Ruby Showcase
# Category: Pattern Matching
# Module: pattern_guards.rb
# Purpose: Demonstrate pattern matching with guards

def match_with_guard(value)
  case value
  when Integer
    if value > 100
      "large_int"
    elsif value > 0
      "small_int"
    else
      "non_positive"
    end
  when String
    if value.length > 10
      "long_string"
    else
      "short_string"
    end
  else
    "other"
  end
end

def guard_check(n, condition)
  if n > 0 && condition
    n * 2
  elsif n > 0
    n
  else
    0
  end
end

def filtered_match(items, &predicate)
  items.select(&predicate)
end

result = {
  guard_large: match_with_guard(150),
  guard_small: match_with_guard(50),
  guard_string_long: match_with_guard("this is a very long string"),
  guard_string_short: match_with_guard("short"),
  guard_check_true: guard_check(10, true),
  guard_check_false: guard_check(10, false),
  filtered_evens: filtered_match([1, 2, 3, 4, 5]) { |x| x.even? },
}

puts result.inspect
