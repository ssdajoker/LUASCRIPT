
-- Example: Async/Await in GSS Rendering
-- Demonstrates practical usage of async/await for responsive rendering

local nodes = require("gss.ir.nodes")
local graph = require("gss.ir.graph")
local async = require("gss.runtime.async")

print("=================================")
print("  Async/Await Example")
print("=================================")

-- Example 1: Simple async operation
print("\n=== Example 1: Simple Async Operation ===")

local function expensive_computation(n)
    local result = 0
    for i = 1, n do
        result = result + math.sqrt(i)
    end
    return result
end

local async_compute = async.async(function()
    print("Starting expensive computation...")
    local result = expensive_computation(10000)
    coroutine.yield() -- Allow other work to proceed
    print("Computation complete!")
    return result
end)

-- Run the async operation
local step = async.run_async(async_compute)
local status, result

print("Stepping through async operation...")
local step_count = 0
repeat
    status, result = step()
    step_count = step_count + 1
    print(string.format("  Step %d: status=%s", step_count, tostring(status)))
until status ~= nil

print(string.format("✓ Result: %.2f (completed in %d steps)", result, step_count))

-- Example 2: Multiple concurrent async operations
print("\n=== Example 2: Concurrent Async Operations ===")

local function simulate_work(id, duration)
    return async.async(function()
        print(string.format("  Task %d: Starting...", id))
        
        -- Simulate work with yields
        for i = 1, duration do
            coroutine.yield()
        end
        
        print(string.format("  Task %d: Complete!", id))
        return id * 100
    end)
end

local tasks = {
    simulate_work(1, 2),
    simulate_work(2, 3),
    simulate_work(3, 1)
}

print("Running 3 tasks concurrently...")

-- Manual stepping through all tasks
local all_complete = false
local step_num = 0
local results = {}

while not all_complete do
    step_num = step_num + 1
    all_complete = true
    
    for i, task in ipairs(tasks) do
        if task.state ~= async.State.COMPLETED then
            local step_fn = async.run_async(task)
            local status, result = step_fn()
            
            if status == true then
                results[i] = result
            elseif status == nil then
                all_complete = false
            end
        end
    end
    
    if not all_complete then
        print(string.format("  Step %d: Tasks still running...", step_num))
    end
end

print(string.format("✓ All tasks completed in %d steps", step_num))
for i, result in ipairs(results) do
    print(string.format("  Task %d result: %d", i, result))
end

-- Example 3: Using async nodes in IR graph
print("\n=== Example 3: Async Nodes in IR Graph ===")

local g = graph.Graph()

-- Create some computation nodes
local const1 = nodes.ConstantNode(50)
local const2 = nodes.ConstantNode(30)
graph.add_node(g, const1)
graph.add_node(g, const2)

-- Create async operation that processes the constants
local async_process = graph.async_operation(g, "heavy_processing", {const1, const2})
print("✓ Created async operation node:", async_process.id)

-- Create await node to wait for result
local await_result = graph.await_operation(g, async_process)
print("✓ Created await node:", await_result.id)

-- Set as root and verify dependencies
graph.set_root(g, await_result)
print("✓ Set await node as graph root")

-- Verify the graph structure
local sorted = graph.sort(g)
print("\n  Graph execution order:")
for i, node in ipairs(sorted) do
    print(string.format("    %d. Node #%d [%s]", i, node.id, node.type))
end

-- Check dependencies
local await_deps = nodes.get_dependencies(await_result)
print(string.format("\n  Await node has %d dependency", #await_deps))
print(string.format("    → Depends on async node #%d", await_deps[1].id))

local async_deps = nodes.get_dependencies(async_process)
print(string.format("  Async node has %d dependencies", #async_deps))
for i, dep in ipairs(async_deps) do
    print(string.format("    → Input %d: Node #%d [%s] = %s", 
        i, dep.id, dep.type, tostring(dep.value)))
end

-- Example 4: Async block with multiple operations
print("\n=== Example 4: Async Block ===")

local ops = {}
for i = 1, 3 do
    local op = nodes.AsyncNode("operation_" .. i, {nodes.ConstantNode(i * 10)})
    graph.add_node(g, op)
    table.insert(ops, op)
end

local block = graph.async_block(g, ops)
print(string.format("✓ Created async block with %d operations", #block.operations))

for i, op in ipairs(block.operations) do
    print(string.format("  Operation %d: Node #%d [%s]", i, op.id, op.type))
end

-- Example 5: Practical rendering scenario
print("\n=== Example 5: Async Tile Rendering ===")

local function render_tile(x, y, size)
    return async.async(function()
        print(string.format("  Rendering tile at (%d, %d) size %d...", x, y, size))
        
        -- Simulate rendering work
        local pixels = size * size
        for i = 1, 3 do
            coroutine.yield()
        end
        
        return pixels
    end)
end

-- Create async operations for multiple tiles
local tiles = {
    render_tile(0, 0, 128),
    render_tile(128, 0, 128),
    render_tile(0, 128, 128),
    render_tile(128, 128, 128)
}

print("Starting async tile rendering (4 tiles)...")

local total_pixels = 0
local render_steps = 0
local tiles_done = 0

while tiles_done < #tiles do
    render_steps = render_steps + 1
    
    for i, tile_op in ipairs(tiles) do
        if tile_op.state ~= async.State.COMPLETED then
            local step_fn = async.run_async(tile_op)
            local status, result = step_fn()
            
            if status == true then
                total_pixels = total_pixels + result
                tiles_done = tiles_done + 1
                print(string.format("  ✓ Tile %d complete (%d pixels)", i, result))
            end
        end
    end
end

print(string.format("\n✓ All tiles rendered in %d steps", render_steps))
print(string.format("  Total pixels rendered: %d", total_pixels))
print(string.format("  Average steps per tile: %.1f", render_steps / #tiles))

-- Summary
print("\n=================================")
print("  Summary")
print("=================================")
print("✓ Async operations provide cooperative multitasking")
print("✓ Multiple async operations can run concurrently")
print("✓ IR graph supports async/await nodes")
print("✓ Async blocks group related operations")
print("✓ Practical for responsive rendering pipelines")
print("\n=================================")
