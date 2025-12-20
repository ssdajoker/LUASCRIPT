
-- Test Async/Await Support

local nodes = require("gss.ir.nodes")
local graph = require("gss.ir.graph")
local lowering = require("gss.ir.lowering")
local async = require("gss.runtime.async")

local function test_async_node_creation()
    print("\n=== Test: Async Node Creation ===")
    
    local inputs = {
        nodes.ConstantNode(10),
        nodes.ConstantNode(20)
    }
    
    local async_node = nodes.AsyncNode("render", inputs)
    
    if async_node.type ~= "async" then
        print("❌ FAILED: Async node type incorrect:", async_node.type)
        return false
    end
    
    if #async_node.inputs ~= 2 then
        print("❌ FAILED: Async node inputs incorrect:", #async_node.inputs)
        return false
    end
    
    print("✓ Async node created successfully")
    print("  Type:", async_node.type)
    print("  Inputs:", #async_node.inputs)
    
    return true
end

local function test_await_node_creation()
    print("\n=== Test: Await Node Creation ===")
    
    local async_node = nodes.AsyncNode("compute", {})
    local await_node = nodes.AwaitNode(async_node)
    
    if await_node.type ~= "await" then
        print("❌ FAILED: Await node type incorrect:", await_node.type)
        return false
    end
    
    if await_node.async_node ~= async_node then
        print("❌ FAILED: Await node reference incorrect")
        return false
    end
    
    print("✓ Await node created successfully")
    print("  Type:", await_node.type)
    print("  References async node:", await_node.async_node.id)
    
    return true
end

local function test_async_block_node()
    print("\n=== Test: Async Block Node ===")
    
    local ops = {
        nodes.AsyncNode("op1", {}),
        nodes.AsyncNode("op2", {}),
        nodes.AsyncNode("op3", {})
    }
    
    local block_node = nodes.AsyncBlockNode(ops)
    
    if block_node.type ~= "async_block" then
        print("❌ FAILED: Async block type incorrect:", block_node.type)
        return false
    end
    
    if #block_node.operations ~= 3 then
        print("❌ FAILED: Async block operations count incorrect:", #block_node.operations)
        return false
    end
    
    print("✓ Async block node created successfully")
    print("  Type:", block_node.type)
    print("  Operations:", #block_node.operations)
    
    return true
end

local function test_async_graph_integration()
    print("\n=== Test: Async Graph Integration ===")
    
    local g = graph.Graph()
    
    -- Create async operation
    local inputs = {nodes.ConstantNode(42)}
    local async_op = graph.async_operation(g, "test_op", inputs)
    
    if not async_op then
        print("❌ FAILED: Could not create async operation in graph")
        return false
    end
    
    print("✓ Async operation added to graph")
    print("  Node ID:", async_op.id)
    print("  Total nodes:", #g.nodes)
    
    -- Create await operation
    local await_op = graph.await_operation(g, async_op)
    
    if not await_op then
        print("❌ FAILED: Could not create await operation in graph")
        return false
    end
    
    print("✓ Await operation added to graph")
    print("  Node ID:", await_op.id)
    print("  Total nodes:", #g.nodes)
    
    return true
end

local function test_async_dependencies()
    print("\n=== Test: Async Dependencies ===")
    
    local input_node = nodes.ConstantNode(100)
    local async_node = nodes.AsyncNode("process", {input_node})
    local await_node = nodes.AwaitNode(async_node)
    
    -- Test async node dependencies
    local async_deps = nodes.get_dependencies(async_node)
    
    if #async_deps ~= 1 then
        print("❌ FAILED: Async node dependencies incorrect:", #async_deps)
        return false
    end
    
    print("✓ Async node dependencies correct:", #async_deps)
    
    -- Test await node dependencies
    local await_deps = nodes.get_dependencies(await_node)
    
    if #await_deps ~= 1 then
        print("❌ FAILED: Await node dependencies incorrect:", #await_deps)
        return false
    end
    
    if await_deps[1] ~= async_node then
        print("❌ FAILED: Await dependency does not reference async node")
        return false
    end
    
    print("✓ Await node dependencies correct:", #await_deps)
    
    return true
end

local function test_async_runtime_basic()
    print("\n=== Test: Async Runtime Basic ===")
    
    local counter = 0
    
    local async_op = async.async(function()
        counter = counter + 1
        coroutine.yield()
        counter = counter + 10
        return counter
    end)
    
    if async_op.state ~= async.State.PENDING then
        print("❌ FAILED: Initial state incorrect:", async_op.state)
        return false
    end
    
    print("✓ Async operation created")
    print("  Initial state:", async_op.state)
    
    -- Run first step
    local step = async.run_async(async_op)
    local status, result = step()
    
    if counter ~= 1 then
        print("❌ FAILED: Counter should be 1, got:", counter)
        return false
    end
    
    print("✓ First step executed, counter:", counter)
    
    -- Run second step
    status, result = step()
    
    if counter ~= 11 then
        print("❌ FAILED: Counter should be 11, got:", counter)
        return false
    end
    
    if async_op.state ~= async.State.COMPLETED then
        print("❌ FAILED: Final state incorrect:", async_op.state)
        return false
    end
    
    if result ~= 11 then
        print("❌ FAILED: Result should be 11, got:", result)
        return false
    end
    
    print("✓ Async operation completed")
    print("  Final state:", async_op.state)
    print("  Result:", result)
    
    return true
end

local function test_async_runtime_await()
    print("\n=== Test: Async Runtime Await ===")
    
    local value = 42
    
    local async_op = async.async(function()
        coroutine.yield()
        return value * 2
    end)
    
    -- Note: In a real scenario, await would be called from within a coroutine
    -- For testing, we'll manually step through
    local step = async.run_async(async_op)
    local status, result
    
    -- Step until complete
    repeat
        status, result = step()
    until status ~= nil
    
    if not status then
        print("❌ FAILED: Async operation failed:", result)
        return false
    end
    
    if result ~= 84 then
        print("❌ FAILED: Expected result 84, got:", result)
        return false
    end
    
    print("✓ Async await completed successfully")
    print("  Result:", result)
    
    return true
end

local function test_topological_sort_with_async()
    print("\n=== Test: Topological Sort with Async ===")
    
    local g = graph.Graph()
    
    -- Create a graph with async operations
    local const_node = nodes.ConstantNode(10)
    graph.add_node(g, const_node)
    
    local async_node = nodes.AsyncNode("compute", {const_node})
    graph.add_node(g, async_node)
    
    local await_node = nodes.AwaitNode(async_node)
    graph.add_node(g, await_node)
    
    graph.set_root(g, await_node)
    
    -- Perform topological sort
    local sorted = graph.sort(g)
    
    if #sorted ~= 3 then
        print("❌ FAILED: Expected 3 nodes in sorted order, got:", #sorted)
        return false
    end
    
    print("✓ Topological sort completed")
    print("  Sorted nodes:", #sorted)
    
    -- Verify order: const -> async -> await
    local found_const = false
    local found_async = false
    local found_await = false
    
    for i, node in ipairs(sorted) do
        print(string.format("  %d. Node #%d [%s]", i, node.id, node.type))
        
        if node.type == "constant" then
            found_const = true
        elseif node.type == "async" then
            found_async = true
            if not found_const then
                print("❌ FAILED: Async node appears before constant node")
                return false
            end
        elseif node.type == "await" then
            found_await = true
            if not found_async then
                print("❌ FAILED: Await node appears before async node")
                return false
            end
        end
    end
    
    if not (found_const and found_async and found_await) then
        print("❌ FAILED: Not all expected nodes found in sort")
        return false
    end
    
    print("✓ Topological order is correct")
    
    return true
end

-- Run all tests
local function run_all_tests()
    print("=================================")
    print("   Async/Await Test Suite")
    print("=================================")
    
    local tests = {
        test_async_node_creation,
        test_await_node_creation,
        test_async_block_node,
        test_async_graph_integration,
        test_async_dependencies,
        test_async_runtime_basic,
        test_async_runtime_await,
        test_topological_sort_with_async
    }
    
    local passed = 0
    local failed = 0
    
    for _, test in ipairs(tests) do
        local success, err = pcall(test)
        if success and err ~= false then
            passed = passed + 1
        else
            failed = failed + 1
            if not success then
                print("❌ Test crashed:", err)
            end
        end
    end
    
    print("\n=================================")
    print(string.format("Results: %d passed, %d failed", passed, failed))
    print("=================================")
    
    return failed == 0
end

-- Run tests
run_all_tests()
