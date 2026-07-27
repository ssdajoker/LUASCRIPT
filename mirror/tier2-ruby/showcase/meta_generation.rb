# MIRROR V3: Tier 2 Ruby Showcase
# Category: Metaprogramming
# Module: meta_generation.rb
# Purpose: Demonstrate code generation patterns

def generate_adder(n)
  -> (x) { x + n }
end

def generate_multiplier(n)
  -> (x) { x * n }
end

def compose_generators(*generators)
  -> (x) do
    result = x
    generators.each { |gen| result = gen.call(result) }
    result
  end
end

def meta_factory(op, value)
  case op
  when "add"
    generate_adder(value)
  when "mul"
    generate_multiplier(value)
  else
    -> (x) { x }
  end
end

add_10 = generate_adder(10)
mul_5 = generate_multiplier(5)
composed = compose_generators(
  generate_adder(5),
  generate_multiplier(2)
)

result = {
  add_10_to_20: add_10.call(20),
  mul_5_to_10: mul_5.call(10),
  composed_30: composed.call(10),
  factory_add: meta_factory("add", 100).call(50),
  factory_mul: meta_factory("mul", 3).call(7),
}

puts result.inspect
