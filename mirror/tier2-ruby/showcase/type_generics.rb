# MIRROR V3: Tier 2 Ruby Showcase
# Category: Type System
# Module: type_generics.rb
# Purpose: Demonstrate generic type patterns

class Box
  attr_reader :item
  
  def initialize(item)
    @item = item
  end
  
  def extract
    @item
  end
  
  def transform(&block)
    Box.new(block.call(@item))
  end
end

class Pair
  attr_reader :key, :value
  
  def initialize(key, value)
    @key = key
    @value = value
  end
end

result = {
  box_int: Box.new(100).extract,
  box_str: Box.new("generic").extract,
  pair_ks: Pair.new("key", "string").key,
  pair_vi: Pair.new("value", 42).value,
  generic_active: true,
}

puts result.inspect
