
-- Async/Await Runtime
-- Structured async/await support wrapping Lua coroutines

local M = {}

-- Async operation state
M.State = {
    PENDING = "pending",
    RUNNING = "running",
    COMPLETED = "completed",
    FAILED = "failed"
}

-- Create an async operation
function M.async(fn)
    local co = coroutine.create(fn)
    
    return {
        coroutine = co,
        state = M.State.PENDING,
        result = nil,
        error = nil
    }
end

-- Await an async operation
function M.await(async_op, max_iterations)
    max_iterations = max_iterations or 1000 -- Default max iterations to prevent infinite recursion
    local iterations = 0
    
    local function await_impl(op)
        iterations = iterations + 1
        
        if iterations > max_iterations then
            op.state = M.State.FAILED
            op.error = "Maximum await iterations exceeded"
            error("Maximum await iterations exceeded")
        end
        
        if op.state == M.State.COMPLETED then
            return op.result
        elseif op.state == M.State.FAILED then
            error(op.error)
        end
        
        -- Resume the coroutine
        op.state = M.State.RUNNING
        local success, result = coroutine.resume(op.coroutine)
        
        if not success then
            op.state = M.State.FAILED
            op.error = result
            error(result)
        end
        
        if coroutine.status(op.coroutine) == "dead" then
            op.state = M.State.COMPLETED
            op.result = result
            return result
        end
        
        -- Still pending, yield control if in coroutine
        if coroutine.running() then
            coroutine.yield()
        end
        return await_impl(op)
    end
    
    return await_impl(async_op)
end

-- Run async operation with cooperative multitasking
function M.run_async(async_op, callback)
    local function step()
        if async_op.state == M.State.COMPLETED or async_op.state == M.State.FAILED then
            return async_op.state == M.State.COMPLETED, async_op.result or async_op.error
        end
        
        async_op.state = M.State.RUNNING
        local success, result = coroutine.resume(async_op.coroutine)
        
        if not success then
            async_op.state = M.State.FAILED
            async_op.error = result
            return false, result
        end
        
        if coroutine.status(async_op.coroutine) == "dead" then
            async_op.state = M.State.COMPLETED
            async_op.result = result
            return true, result
        end
        
        -- Call callback for progress updates
        if callback then
            callback(result)
        end
        
        return nil -- Still pending
    end
    
    return step
end

-- Run multiple async operations concurrently
function M.all(async_ops)
    local results = {}
    local completed = 0
    
    while completed < #async_ops do
        for i, async_op in ipairs(async_ops) do
            if async_op.state ~= M.State.COMPLETED and async_op.state ~= M.State.FAILED then
                local step = M.run_async(async_op)
                local status, result = step()
                
                if status == true then
                    results[i] = result
                    completed = completed + 1
                elseif status == false then
                    error("Async operation failed: " .. tostring(result))
                end
            end
        end
        
        -- Yield to allow other operations to progress (only if in coroutine)
        if coroutine.running() then
            coroutine.yield()
        end
    end
    
    return results
end

-- Run async operations in sequence
function M.chain(async_ops)
    local results = {}
    
    for i, async_op in ipairs(async_ops) do
        local result = M.await(async_op)
        results[i] = result
    end
    
    return results
end

-- Create async wrapper for tile rendering
function M.async_render_tile(tile_fn, ...)
    local args = {...}
    
    return M.async(function()
        -- Execute tile rendering
        local result = tile_fn(table.unpack(args))
        
        -- Yield after rendering to allow cooperative multitasking
        coroutine.yield()
        
        return result
    end)
end

-- Create async wrapper for agent step
function M.async_agent_step(step_fn, ...)
    local args = {...}
    
    return M.async(function()
        -- Execute agent step
        local result = step_fn(table.unpack(args))
        
        -- Yield for cooperative multitasking
        coroutine.yield()
        
        return result
    end)
end

-- Execute async operation with timeout
function M.with_timeout(async_op, timeout_ms)
    local start_time = os.clock() * 1000
    
    while async_op.state ~= M.State.COMPLETED and async_op.state ~= M.State.FAILED do
        local elapsed = (os.clock() * 1000) - start_time
        
        if elapsed > timeout_ms then
            async_op.state = M.State.FAILED
            async_op.error = "Timeout exceeded"
            error("Async operation timed out after " .. timeout_ms .. "ms")
        end
        
        local step = M.run_async(async_op)
        local status, result = step()
        
        if status == true then
            return result
        elseif status == false then
            error("Async operation failed: " .. tostring(result))
        end
        
        -- Brief sleep to avoid busy waiting (only if in coroutine)
        if coroutine.running() then
            coroutine.yield()
        end
    end
    
    return async_op.result
end

-- Schedule async operation for later execution
function M.defer(async_op, delay_ms)
    return M.async(function()
        local start_time = os.clock() * 1000
        
        while (os.clock() * 1000) - start_time < delay_ms do
            coroutine.yield()
        end
        
        return M.await(async_op)
    end)
end

return M
