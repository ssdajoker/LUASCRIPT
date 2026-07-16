# MIRROR V3: Tier 2 Ruby Showcase
# Category: Pattern Matching
# Module: pattern_binding.rb
# Purpose: Demonstrate pattern binding and destructuring

def destructure_tuple(data)
  if data.is_a?(Array) && data.size == 3
    a, b, c = data
    {first: a, second: b, third: c}
  end
end

def destructure_hash(data)
  if data.is_a?(Hash)
    name = data["name"] || "unknown"
    age = data["age"] || 0
    {person: name, age: age}
  end
end

def destructure_list(data)
  if data.is_a?(Array) && data.size >= 2
    head = data[0]
    tail = data[1..-1]
    {head: head, tail: tail}
  end
end

def bind_and_match(obj)
  if obj.is_a?(Hash)
    x = obj["x"]
    y = obj["y"]
    if x && y
      {bound_x: x, bound_y: y, sum: x + y}
    end
  end
end

result = {
  tuple_destructure: destructure_tuple([1, 2, 3]),
  hash_destructure: destructure_hash({"name" => "Alice", "age" => 30}),
  list_destructure: destructure_list([10, 20, 30, 40]),
  bind_and_match: bind_and_match({"x" => 5, "y" => 10}),
}

puts result.inspect
