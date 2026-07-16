def main
  box = {count: 3}
  box[:count] = box[:count] + 4
  puts "ruby_hash_mutation"
  puts box[:count]
end
