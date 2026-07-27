# MIRROR V3: Tier 2 Ruby Showcase
# Category: Metaprogramming
# Module: meta_reflection.rb
# Purpose: Demonstrate reflection and introspection

def reflect_object(obj)
  {
    type: obj.class.name,
    class_name: obj.class.to_s,
    methods_count: obj.methods.size,
  }
end

def reflect_function(func)
  {
    name: func.class.name,
    arity: func.arity,
    callable: func.respond_to?(:call),
  }
end

def get_attributes(obj)
  attrs = {}
  obj.instance_variables.each do |var|
    attrs[var.to_s] = obj.instance_variable_get(var).class.name
  end
  attrs
end

class ReflectedClass
  def initialize(x, y)
    @x = x
    @y = y
  end
  
  def method
    "#{@x}:#{@y}"
  end
end

result = {
  reflect_int: reflect_object(42),
  reflect_str: reflect_object("hello"),
  reflect_list: reflect_object([1, 2, 3]),
  class_attrs: get_attributes(ReflectedClass.new(1, "a")).size,
}

puts result.inspect
