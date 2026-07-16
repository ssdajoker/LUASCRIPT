# MIRROR V3: Tier 2 Ruby Showcase
# Category: Optimization
# Module: perf_caching.rb
# Purpose: Demonstrate caching and memoization

class CachedFibonacci
  def initialize
    @cache = {}
    @hits = 0
    @misses = 0
  end
  
  def compute(n)
    if @cache.key?(n)
      @hits += 1
      return @cache[n]
    end
    
    @misses += 1
    result = if n < 2
      n
    else
      compute(n - 1) + compute(n - 2)
    end
    
    @cache[n] = result
    result
  end
  
  def stats
    {
      hits: @hits,
      misses: @misses,
      cache_size: @cache.size
    }
  end
end

fib = CachedFibonacci.new
fib_10 = fib.compute(10)
fib_20 = fib.compute(20)
stats = fib.stats

result = {
  fib_10: fib_10,
  fib_20: fib_20,
  cache_hits: stats[:hits],
  cache_misses: stats[:misses],
  cache_enabled: true,
}

puts result.inspect
