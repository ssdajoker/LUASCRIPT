# MIRROR V3: Tier 2 Ruby Showcase
# Category: Type System
# Module: type_advanced.rb
# Purpose: Demonstrate advanced Ruby type system

class GenericContainer
  attr_reader :value
  
  def initialize(value)
    @value = value
  end
  
  def map(&block)
    GenericContainer.new(block.call(@value))
  end
end

def create_int_container
  GenericContainer.new(42)
end

def create_str_container
  GenericContainer.new("typed")
end

result = {
  int_container: create_int_container.value,
  str_container: create_str_container.value,
  mapped_value: create_int_container.map { |x| x * 2 }.value,
  generic_demo: true,
}

puts result.inspect
