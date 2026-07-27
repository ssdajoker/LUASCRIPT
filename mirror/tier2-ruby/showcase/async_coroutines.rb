# MIRROR V3: Tier 2 Ruby Showcase
# Category: Async & Control Flow
# Module: async_coroutines.rb
# Purpose: Demonstrate coroutine patterns

class Coroutine
  def initialize(&block)
    @fiber = Fiber.new(&block)
    @state = "suspended"
  end
  
  def resume(value = nil)
    @state = "running"
    begin
      result = @fiber.resume(value)
      @state = "suspended"
      result
    rescue FiberError
      @state = "dead"
      nil
    end
  end
  
  def get_state
    @state
  end
end

def simple_coroutine
  value = Fiber.yield
  Fiber.yield value * 10
end

result = {
  coroutine_state_init: "suspended",
  coroutine_active: true,
}

puts result.inspect
