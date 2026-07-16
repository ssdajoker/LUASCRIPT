# MIRROR V3: Tier 2 Ruby Showcase
# Category: Pattern Matching
# Module: pattern_nested.rb
# Purpose: Demonstrate nested pattern matching

def match_nested_hash(data)
  if data.is_a?(Hash)
    if data["user"].is_a?(Hash)
      user = data["user"]
      if user["profile"].is_a?(Hash)
        profile = user["profile"]
        name = profile["name"] || "unknown"
        {found: true, name: name}
      end
    end
  end
  {found: false}
end

def match_nested_list(data)
  if data.is_a?(Array) && data.size > 0
    first = data[0]
    if first.is_a?(Array) && first.size > 0
      inner = first[0]
      {outer: first, inner: inner}
    end
  end
end

def traverse_structure(obj, depth = 0)
  return nil if depth > 3
  
  case obj
  when Hash
    obj.each { |k, v| traverse_structure(v, depth + 1) if v.is_a?(Hash) || v.is_a?(Array) }
    "traversed_hash"
  when Array
    obj.each { |item| traverse_structure(item, depth + 1) if item.is_a?(Hash) || item.is_a?(Array) }
    "traversed_list"
  end
end

result = {
  nested_hash_found: match_nested_hash({"user" => {"profile" => {"name" => "Alice"}}}),
  nested_hash_notfound: match_nested_hash({"data" => "simple"}),
  nested_list: match_nested_list([[1, 2, 3], 4, 5]),
  traversed: traverse_structure({"a" => {"b" => {"c" => 1}}}),
}

puts result.inspect
