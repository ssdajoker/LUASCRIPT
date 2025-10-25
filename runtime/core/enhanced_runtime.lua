-- LUASCRIPT Enhanced Runtime Library
-- Provides JavaScript-like functionality with mathematical and performance optimizations
-- Addresses audit findings: connects array methods, adds mathematical functions, SIMD support

-- Steve Jobs + Donald Knuth Leadership Team
-- Priority: CRITICAL - The engine that powers mathematical programming beauty

local _LS = {}

-- ============================================================================
-- MATHEMATICAL CONSTANTS AND FUNCTIONS (Enhanced Unicode Support)  
-- ============================================================================

_LS.math = {
    -- Mathematical constants (beyond standard Lua)
    phi = (1 + math.sqrt(5)) / 2,  -- Golden ratio φ
    tau = 2 * math.pi,             -- τ = 2π
    e = math.exp(1),               -- Euler's number ℯ
    
    -- Enhanced mathematical functions
    factorial = function(n)
        if n <= 1 then return 1 end
        return n * _LS.math.factorial(n - 1)
    end,
    
    -- Gaussian function with Unicode parameter support
    gaussian = function(mu, sigma_squared)
        return function(x)
            return (1 / math.sqrt(2 * math.pi * sigma_squared)) * 
                   math.exp(-((x - mu)^2) / (2 * sigma_squared))
        end
    end,
    
    -- Set theory functions for Unicode operators
    element_of = function(element, set)
        for i = 1, #set do
            if set[i] == element then return true end
        end
        return false
    end,
    
    union = function(set1, set2)
        local result = {}
        local seen = {}
        
        for i = 1, #set1 do
            if not seen[set1[i]] then
                table.insert(result, set1[i])
                seen[set1[i]] = true
            end
        end
        
        for i = 1, #set2 do
            if not seen[set2[i]] then
                table.insert(result, set2[i])
                seen[set2[i]] = true
            end
        end
        
        return _LS.array(result)
    end,
    
    intersection = function(set1, set2)
        local result = {}
        local set2_lookup = {}

        -- Create lookup table for set2
        for i = 1, #set2 do
            set2_lookup[set2[i]] = true
        end

        -- Find intersection
        for i = 1, #set1 do
            if set2_lookup[set1[i]] then
                table.insert(result, set1[i])
            end
        end

        return _LS.array(result)
    end,
}

local function normalize_step(start_value, end_value, step)
    if step == nil then
        return start_value <= end_value and 1 or -1
    end
    if step == 0 then
        error("math range step cannot be zero")
    end
    return step
end

local function iterate_range(start_value, end_value, step, handler)
    local index = 0
    for value = start_value, end_value, step do
        handler(value, index)
        index = index + 1
    end
end

local function summation_impl(collection_or_start, finish, step_or_mapper, maybe_mapper)
    local total = 0
    if type(collection_or_start) == "function" then
        local lower = finish
        local upper = step_or_mapper
        local step = maybe_mapper

        if type(lower) ~= "number" or type(upper) ~= "number" then
            error("math.summation expects numeric bounds (got " .. type(lower) .. ", " .. type(upper) .. ")")
        end
        if step ~= nil and type(step) ~= "number" then
            error("math.summation step must be a number")
        end

        step = normalize_step(lower, upper, step)

        if (step > 0 and lower > upper) or (step < 0 and lower < upper) then
            return total
        end

        iterate_range(lower, upper, step, function(value, index)
            local mapped = collection_or_start(value, index)
            if mapped ~= nil then
                total = total + mapped
            end
        end)
        return total
    elseif type(collection_or_start) == "table" then
        local mapper = step_or_mapper
        if mapper ~= nil and type(mapper) ~= "function" then
            error("math.summation mapper must be a function")
        end
        for index, value in ipairs(collection_or_start) do
            if mapper then
                local mapped = mapper(value, index - 1, collection_or_start)
                if mapped then
                    total = total + mapped
                end
            else
                total = total + (value or 0)
            end
        end
        return total
    elseif type(collection_or_start) == "number" and type(finish) == "number" then
        local step, mapper
        if type(step_or_mapper) == "number" then
            step = normalize_step(collection_or_start, finish, step_or_mapper)
            mapper = maybe_mapper
        else
            step = normalize_step(collection_or_start, finish)
            mapper = step_or_mapper
        end
        if mapper ~= nil and type(mapper) ~= "function" then
            error("math.summation mapper must be a function")
        end
        mapper = mapper or function(value)
            return value
        end
        if step > 0 and collection_or_start > finish then
            return 0
        end
        if step < 0 and collection_or_start < finish then
            return 0
        end
        iterate_range(collection_or_start, finish, step, function(value, index)
            local mapped = mapper(value, index)
            if mapped then
                total = total + mapped
            end
        end)
        return total
    end
    error("math.summation expects a table or numeric range")
end

local function product_impl(collection_or_start, finish, step_or_mapper, maybe_mapper)
    local result = 1
    if type(collection_or_start) == "function" then
        local lower = finish
        local upper = step_or_mapper
        local step = maybe_mapper

        if type(lower) ~= "number" or type(upper) ~= "number" then
            error("math.product expects numeric bounds (got '" .. type(lower) .. "', '" .. type(upper) .. "')")
        end
        if step ~= nil and type(step) ~= "number" then
            error("math.product step must be a number")
        end

        step = normalize_step(lower, upper, step)

        if (step > 0 and lower > upper) or (step < 0 and lower < upper) then
            return result
        end

        iterate_range(lower, upper, step, function(value, index)
            local mapped = collection_or_start(value, index)
            if mapped ~= nil then
                result = result * mapped
            end
        end)
        return result
    elseif type(collection_or_start) == "table" then
        local mapper = step_or_mapper
        if mapper ~= nil and type(mapper) ~= "function" then
            error("math.product mapper must be a function")
        end
        for index, value in ipairs(collection_or_start) do
            local mapped
            if mapper then
                mapped = mapper(value, index - 1, collection_or_start)
            else
                mapped = value
            end
            if mapped ~= nil then
                result = result * mapped
            end
        end
        return result
    elseif type(collection_or_start) == "number" and type(finish) == "number" then
        local step, mapper
        if type(step_or_mapper) == "number" then
            step = normalize_step(collection_or_start, finish, step_or_mapper)
            mapper = maybe_mapper
        else
            step = normalize_step(collection_or_start, finish)
            mapper = step_or_mapper
        end
        if mapper ~= nil and type(mapper) ~= "function" then
            error("math.product mapper must be a function")
        end
        mapper = mapper or function(value)
            return value
        end
        if step > 0 and collection_or_start > finish then
            return 1
        end
        if step < 0 and collection_or_start < finish then
            return 1
        end
        iterate_range(collection_or_start, finish, step, function(value, index)
            local mapped = mapper(value, index)
            if mapped ~= nil then
                result = result * mapped
            end
        end)
        return result
    end
    error("math.product expects a table or numeric range")
end

local function integral_impl(fn, a, b, steps)
    if type(fn) ~= "function" then
        error("math.integral requires a function as the first argument")
    end
    if type(a) ~= "number" or type(b) ~= "number" then
        error("math.integral requires numeric bounds")
    end
    steps = steps or 1000
    if steps <= 0 then
        return 0
    end
    local direction = 1
    if b < a then
        a, b = b, a
        direction = -1
    end
    local step = (b - a) / steps
    local total = 0.5 * (fn(a) + fn(b))
    for i = 1, steps - 1 do
        local x = a + step * i
        total = total + fn(x)
    end
    return total * step * direction
end

_LS.math.summation = summation_impl
_LS.math.product = product_impl
_LS.math.integral = integral_impl

if not math.summation then
    math.summation = summation_impl
end
if not math.product then
    math.product = product_impl
end
if not math.integral then
    math.integral = integral_impl
end

-- ============================================================================
-- ARRAY OPERATIONS (FIXED: Properly Connected)
-- ============================================================================

-- Create enhanced array with metatable for method chaining
function _LS.array(data)
    data = data or {}
    return setmetatable(data, _LS.metatables.Array)
end

-- Core collection functions (FIXED: These are what the transpiler calls)
function _LS.map(array, callback)
    local result = {}
    for i = 1, #array do
        -- JavaScript-style callback: callback(element, index, array)
        result[i] = callback(array[i], i - 1, array)
    end
    return _LS.array(result)
end

function _LS.filter(array, predicate)
    local result = {}
    local count = 0
    for i = 1, #array do
        if predicate(array[i], i - 1, array) then
            count = count + 1
            result[count] = array[i]
        end
    end
    return _LS.array(result)
end

function _LS.reduce(array, callback, initial_value)
    local accumulator = initial_value
    local start_index = 1
    
    if accumulator == nil then
        if #array == 0 then
            error("Reduce of empty array with no initial value")
        end
        accumulator = array[1]
        start_index = 2
    end
    
    for i = start_index, #array do
        accumulator = callback(accumulator, array[i], i - 1, array)
    end
    
    return accumulator
end

function _LS.forEach(array, callback)
    for i = 1, #array do
        callback(array[i], i - 1, array)
    end
end

function _LS.find(array, predicate)
    for i = 1, #array do
        if predicate(array[i], i - 1, array) then
            return array[i]
        end
    end
    return nil
end

function _LS.some(array, predicate)
    for i = 1, #array do
        if predicate(array[i], i - 1, array) then
            return true
        end
    end
    return false
end

function _LS.every(array, predicate)
    for i = 1, #array do
        if not predicate(array[i], i - 1, array) then
            return false
        end
    end
    return true
end

function _LS.indexOf(array, search_element, from_index)
    from_index = (from_index or 0) + 1  -- Convert to 1-based
    for i = from_index, #array do
        if array[i] == search_element then
            return i - 1  -- Return 0-based index
        end
    end
    return -1
end

function _LS.includes(array, search_element)
    return _LS.indexOf(array, search_element) ~= -1
end

function _LS.slice(array, start, end_index)
    start = (start or 0) + 1  -- Convert to 1-based
    end_index = end_index and (end_index + 1) or (#array + 1)
    
    local result = {}
    for i = start, math.min(end_index - 1, #array) do
        table.insert(result, array[i])
    end
    
    return _LS.array(result)
end

function _LS.concat(array1, array2)
    local result = {}
    
    -- Copy first array
    for i = 1, #array1 do
        result[i] = array1[i]
    end
    
    -- Append second array
    for i = 1, #array2 do
        result[#result + 1] = array2[i]
    end
    
    return _LS.array(result)
end

-- ============================================================================
-- METATABLES FOR JAVASCRIPT-LIKE BEHAVIOR
-- ============================================================================

_LS.metatables = {}

-- Enhanced Array metatable with method chaining
_LS.metatables.Array = {
    __index = function(self, key)
        if key == "length" then
            return #self
        elseif key == "map" then
            return function(self, callback)
                return _LS.map(self, callback)
            end
        elseif key == "filter" then
            return function(self, predicate)
                return _LS.filter(self, predicate)
            end
        elseif key == "reduce" then
            return function(self, callback, initial)
                return _LS.reduce(self, callback, initial)
            end
        elseif key == "forEach" then
            return function(self, callback)
                return _LS.forEach(self, callback)
            end
        elseif key == "find" then
            return function(self, predicate)
                return _LS.find(self, predicate)
            end
        elseif key == "some" then
            return function(self, predicate)
                return _LS.some(self, predicate)
            end
        elseif key == "every" then
            return function(self, predicate)
                return _LS.every(self, predicate)
            end
        elseif key == "indexOf" then
            return function(self, element)
                return _LS.indexOf(self, element)
            end
        elseif key == "includes" then
            return function(self, element)
                return _LS.includes(self, element)
            end
        elseif key == "slice" then
            return function(self, start, end_index)
                return _LS.slice(self, start, end_index)
            end
        elseif key == "concat" then
            return function(self, other)
                return _LS.concat(self, other)
            end
        elseif key == "push" then
            return function(self, ...)
                local args = {...}
                for i = 1, #args do
                    table.insert(self, args[i])
                end
                return #self
            end
        elseif key == "pop" then
            return function(self)
                return table.remove(self)
            end
        end
        
        -- Handle numeric indexing (0-based like JavaScript)
        if type(key) == "number" and key >= 0 then
            return rawget(self, key + 1)  -- Convert to 1-based
        end
        
        return rawget(self, key)
    end,
    
    __newindex = function(self, key, value)
        if type(key) == "number" and key >= 0 then
            rawset(self, key + 1, value)  -- Convert to 1-based
        else
            rawset(self, key, value)
        end
    end,
    
    __tostring = function(self)
        local elements = {}
        for i = 1, #self do
            elements[i] = tostring(self[i])
        end
        return "[" .. table.concat(elements, ", ") .. "]"
    end
}

-- ============================================================================
-- TEMPLATE STRING SUPPORT (FIXED: Proper ${} interpolation)
-- ============================================================================

function _LS.template_string(format_str, ...)
    -- Enhanced string.format with better type conversion
    local args = {...}
    for i = 1, #args do
        if type(args[i]) == "table" and getmetatable(args[i]) == _LS.metatables.Array then
            args[i] = tostring(args[i])  -- Use array's __tostring
        elseif type(args[i]) == "number" then
            -- Format numbers nicely
            if args[i] == math.floor(args[i]) then
                args[i] = string.format("%.0f", args[i])
            else
                args[i] = string.format("%.6g", args[i])
            end
        else
            args[i] = tostring(args[i])
        end
    end
    
    return string.format(format_str, table.unpack(args))
end

-- ============================================================================
-- PERFORMANCE OPTIMIZATIONS (Torvalds/Bellard Vision)
-- ============================================================================

_LS.simd = {}

-- Simulated SIMD operations for mathematical performance
function _LS.simd.float32x4(a, b, c, d)
    return setmetatable({a or 0.0, b or 0.0, c or 0.0, d or 0.0}, {
        __add = function(self, other)
            return _LS.simd.float32x4(
                self[1] + other[1], self[2] + other[2],
                self[3] + other[3], self[4] + other[4]
            )
        end,
        
        __sub = function(self, other)
            return _LS.simd.float32x4(
                self[1] - other[1], self[2] - other[2],
                self[3] - other[3], self[4] - other[4]
            )
        end,
        
        __mul = function(self, other)
            if type(other) == "number" then
                -- Scalar multiplication
                return _LS.simd.float32x4(
                    self[1] * other, self[2] * other,
                    self[3] * other, self[4] * other
                )
            else
                -- Element-wise multiplication
                return _LS.simd.float32x4(
                    self[1] * other[1], self[2] * other[2],
                    self[3] * other[3], self[4] * other[4]
                )
            end
        end,
        
        __tostring = function(self)
            return string.format("float32x4(%.3f, %.3f, %.3f, %.3f)", 
                                self[1], self[2], self[3], self[4])
        end
    })
end

-- Vector operations for mathematical performance
function _LS.simd.vector_add(a, b)
    local result = {}
    for i = 1, math.min(#a, #b) do
        result[i] = a[i] + b[i]
    end
    return result
end

function _LS.simd.vector_multiply(a, b)
    local result = {}
    for i = 1, math.min(#a, #b) do
        result[i] = a[i] * b[i]
    end
    return result
end

-- Dot product for mathematical operations
function _LS.simd.dot_product(a, b)
    local sum = 0
    for i = 1, math.min(#a, #b) do
        sum = sum + a[i] * b[i]
    end
    return sum
end

-- ============================================================================
-- AI/ML COMPUTATIONAL ALTERNATIVES (Norvig Vision Preview)
-- ============================================================================

_LS.tensor = {}

-- Basic tensor operations (CPU-friendly alternatives to GPU-heavy frameworks)
function _LS.tensor.create(dimensions, initial_value)
    initial_value = initial_value or 0.0
    
    if #dimensions == 1 then
        -- 1D tensor (vector)
        local result = {}
        for i = 1, dimensions[1] do
            result[i] = initial_value
        end
        return result
    elseif #dimensions == 2 then
        -- 2D tensor (matrix)
        local result = {}
        for i = 1, dimensions[1] do
            result[i] = {}
            for j = 1, dimensions[2] do
                result[i][j] = initial_value
            end
        end
        return result
    end
    
    error("Tensors with more than 2 dimensions not yet implemented")
end

-- Matrix multiplication (CPU-optimized)
function _LS.tensor.matmul(a, b)
    if #a[1] ~= #b then
        error("Matrix dimensions don't match for multiplication")
    end
    
    local result = {}
    for i = 1, #a do
        result[i] = {}
        for j = 1, #b[1] do
            local sum = 0
            for k = 1, #b do
                sum = sum + a[i][k] * b[k][j]
            end
            result[i][j] = sum
        end
    end
    
    return result
end

-- Activation functions for neural networks
_LS.tensor.activation = {
    relu = function(x)
        return math.max(0, x)
    end,
    
    sigmoid = function(x)
        return 1 / (1 + math.exp(-x))
    end,
    
    tanh = function(x)
        return math.tanh(x)
    end,
    
    softmax = function(vector)
        local max_val = math.max(table.unpack(vector))
        local exp_sum = 0
        local result = {}
        
        -- Compute exponentials (shifted for numerical stability)
        for i = 1, #vector do
            result[i] = math.exp(vector[i] - max_val)
            exp_sum = exp_sum + result[i]
        end
        
        -- Normalize
        for i = 1, #result do
            result[i] = result[i] / exp_sum
        end
        
        return result
    end
}

-- ============================================================================
-- CONSOLE AND UTILITY FUNCTIONS
-- ============================================================================

_LS.console = {
    log = function(...)
        local args = {...}
        local output = {}
        
        for i = 1, #args do
            if type(args[i]) == "table" and getmetatable(args[i]) == _LS.metatables.Array then
                output[i] = tostring(args[i])
            else
                output[i] = tostring(args[i])
            end
        end
        
        print(table.concat(output, " "))
    end,
    
    error = function(...)
        error(table.concat({...}, " "))
    end,
    
    warn = function(...)
        print("WARNING:", table.concat({...}, " "))
    end
}

-- ============================================================================
-- MODULE EXPORTS
-- ============================================================================

-- Global setup for transpiled code
if _G then
    _G._LS = _LS
    _G.console = _LS.console
end

return _LS
