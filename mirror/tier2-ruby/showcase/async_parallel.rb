# MIRROR V3: Tier 2 Ruby Showcase
# Category: Async & Control Flow
# Module: async_parallel.rb
# Purpose: Demonstrate parallel execution patterns

def execute_parallel(tasks)
  results = []
  tasks.each { |task| results << task.call }
  results
end

def create_task(value, multiplier)
  -> { value * multiplier }
end

def batch_execute(items)
  tasks = items.map { |x| create_task(x, 2) }
  results = execute_parallel(tasks)
  {
    items: items,
    results: results,
    count: results.size,
  }
end

tasks = [
  create_task(10, 2),
  create_task(20, 3),
  create_task(30, 4),
]

results = execute_parallel(tasks)
batch_results = batch_execute([5, 10, 15])

result = {
  task_results: results,
  result_1: results[0],
  result_2: results[1],
  result_3: results[2],
  batch_count: batch_results[:count],
  parallel_active: true,
}

puts result.inspect
