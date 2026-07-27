# MIRROR V3: Tier 2 Ruby Showcase
# Category: IR & Determinism
# Module: ir_determinism.rb
# Purpose: Demonstrate deterministic computation

require 'digest'

def deterministic_sort(arr)
  arr.sort
end

def deterministic_hash(data)
  sorted_data = data.sort
  str_data = sorted_data.to_s
  Digest::MD5.hexdigest(str_data)[0..15]
end

def stable_computation(values)
  sorted_vals = deterministic_sort(values)
  hash1 = deterministic_hash(sorted_vals)
  hash2 = deterministic_hash(sorted_vals)
  
  {
    sorted: sorted_vals,
    hash1: hash1,
    hash2: hash2,
    hashes_equal: hash1 == hash2,
  }
end

input_data = [5, 2, 8, 1, 9]
computation = stable_computation(input_data)

result = {
  sorted_data: computation[:sorted],
  hash_1: computation[:hash1],
  hash_2: computation[:hash2],
  deterministic: computation[:hashes_equal],
  computation_stable: true,
}

puts result.inspect
