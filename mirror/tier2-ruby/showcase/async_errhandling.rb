# MIRROR V3: Tier 2 Ruby Showcase
# Category: Async & Control Flow
# Module: async_errhandling.rb
# Purpose: Demonstrate error handling patterns

def try_catch(try_block, catch_block = nil)
  begin
    result = try_block.call
    { success: true, value: result }
  rescue => e
    catch_block.call(e) if catch_block
    { success: false, error: e.message }
  end
end

def risky_operation(value)
  raise "negative value" if value < 0
  value * 2
end

def divide_safe(a, b)
  begin
    { result: a / b, success: true }
  rescue ZeroDivisionError
    { result: nil, success: false, error: "division by zero" }
  end
end

result1 = try_catch(-> { risky_operation(10) })
result2 = try_catch(-> { risky_operation(-5) })
divide_ok = divide_safe(10, 2)
divide_error = divide_safe(10, 0)

result = {
  success_1: result1[:success],
  value_1: result1[:value],
  success_2: result2[:success],
  divide_ok: divide_ok[:result],
  divide_error_handled: !divide_error[:success],
  error_handling_active: true,
}

puts result.inspect
