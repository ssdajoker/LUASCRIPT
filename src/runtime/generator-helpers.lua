-- LUASCRIPT Generator Runtime (Lua)
-- Provides Lua-side utilities for generators transpiled from JavaScript

local generator_runtime = {}

-- Create a generator object from a coroutine
-- Returns an object with next(), return(), throw() methods
function generator_runtime.create(co)
    local generator = {}
    
    function generator:next(value)
        if coroutine.status(co) == "dead" then
            return { value = nil, done = true }
        end
        
        local success, result = coroutine.resume(co, value)
        if not success then
            error(result)
        end
        
        local done = coroutine.status(co) == "dead"
        return { value = result, done = done }
    end
    
    function generator:return_(value)
        -- Terminate the generator early
        return { value = value, done = true }
    end
    
    function generator:throw(err)
        -- Throw an error into the generator
        error(err)
    end
    
    -- Make generator iterable in for loops
    setmetatable(generator, {
        __call = function()
            local result = generator:next()
            if result.done then
                return nil
            end
            return result.value
        end
    })
    
    return generator
end

-- Helper for for-of loops with generators
-- Converts generator to Lua iterator
function generator_runtime.iterate(gen)
    return function()
        local result = gen:next()
        if result.done then
            return nil
        end
        return result.value
    end
end

-- Support for yield* (generator delegation)
function generator_runtime.delegate(inner_gen)
    local result
    while true do
        result = inner_gen:next()
        if result.done then
            return result.value
        end
        coroutine.yield(result.value)
    end
end

return generator_runtime
