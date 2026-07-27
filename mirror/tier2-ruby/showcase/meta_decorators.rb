# MIRROR V3: Tier 2 Ruby Showcase
# Category: Metaprogramming
# Module: meta_decorators.rb
# Purpose: Demonstrate decorator patterns

def timing_decorator(&block)
  -> (*args) do
    start = Time.now
    result = block.call(*args)
    elapsed = Time.now - start
    result
  end
end

def memoization_decorator(&block)
  cache = {}
  -> (*args) do
    if cache.key?(args)
      cache[args]
    else
      cache[args] = block.call(*args)
    end
  end
end

def validation_decorator(validator, &block)
  -> (*args) do
    return nil unless validator.call(*args)
    block.call(*args)
  end
end

fibonacci = memoization_decorator do |n|
  n < 2 ? n : fibonacci.call(n-1) + fibonacci.call(n-2)
end

result = {
  memo_fib_5: fibonacci.call(5),
  memo_fib_10: fibonacci.call(10),
  decorators_active: true,
}

puts result.inspect
