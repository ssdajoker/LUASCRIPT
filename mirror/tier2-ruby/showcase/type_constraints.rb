# MIRROR V3: Tier 2 Ruby Showcase
# Category: Type System
# Module: type_constraints.rb
# Purpose: Demonstrate type constraints and validation

class ConstrainedValue
  attr_reader :value, :value_type
  
  def initialize(value, value_type)
    unless value.is_a?(value_type)
      raise TypeError, "Expected #{value_type}, got #{value.class}"
    end
    @value = value
    @value_type = value_type
  end
end

class BoundedInt
  attr_reader :value
  
  def initialize(value, min_val = 0, max_val = 100)
    unless min_val <= value && value <= max_val
      raise ValueError, "Value #{value} outside bounds [#{min_val}, #{max_val}]"
    end
    @value = value
    @min = min_val
    @max = max_val
  end
end

def validate_number(n, min_val = -100, max_val = 100)
  min_val <= n && n <= max_val
end

result = {
  constrained_int: ConstrainedValue.new(42, Integer).value,
  bounded_value: BoundedInt.new(50, 0, 100).value,
  validate_valid: validate_number(50),
  validate_invalid: validate_number(200, 0, 100),
  constraints_active: true,
}

puts result.inspect
