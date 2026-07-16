# MIRROR V3: Tier 2 Ruby Showcase
# Category: Async & Control Flow
# Module: async_promises.rb
# Purpose: Demonstrate promise-like patterns

class Promise
  def initialize(&executor)
    @state = "pending"
    @value = nil
    @callbacks = []
    
    executor.call(method(:resolve))
  end
  
  private
  
  def resolve(result)
    if @state == "pending"
      @state = "fulfilled"
      @value = result
      @callbacks.each { |callback| callback.call(result) }
    end
  end
  
  public
  
  def then(&callback)
    if @state == "fulfilled"
      callback.call(@value)
    else
      @callbacks << callback
    end
    self
  end
  
  def get_value
    @value
  end
  
  def state
    @state
  end
end

p1 = Promise.new { |resolve| resolve.call(42) }
p2 = Promise.new { |resolve| resolve.call("hello") }

result = {
  promise_state: p1.state,
  promise_value: p1.get_value,
  promise_2_value: p2.get_value,
  promise_created: true,
}

puts result.inspect
