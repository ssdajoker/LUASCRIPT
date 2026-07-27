-- LUASCRIPT Enhanced Runtime Library
-- Provides JavaScript-like functionality with mathematical and performance optimizations
-- Addresses audit findings: connects array methods, adds mathematical functions, SIMD support

-- Steve Jobs + Donald Knuth Leadership Team
-- Priority: CRITICAL - The engine that powers mathematical programming beauty

local _LS = {}
local table_unpack = table.unpack or unpack

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

    subset_of = function(set1, set2)
        local set2_lookup = {}
        for i = 1, #set2 do
            set2_lookup[set2[i]] = true
        end
        for i = 1, #set1 do
            if not set2_lookup[set1[i]] then
                return false
            end
        end
        return true
    end,
}

local function pack_arguments(...)
    return { n = select("#", ...), ... }
end

local function ensure_numeric(value, context)
    if type(value) == "number" then
        return value
    end

    local converted = tonumber(value)
    if converted == nil then
        error(string.format("%s: expected numeric value, got %s", context, type(value)))
    end

    return converted
end

local function js_string(value)
    if value == nil then
        return "null"
    end

    return tostring(value)
end

local complex_metatable

local function is_complex(value)
    return type(value) == "table" and getmetatable(value) == complex_metatable
end

local function complex_new(real, imag)
    return setmetatable({ re = real or 0, im = imag or 0 }, complex_metatable)
end

local function as_complex(value, context)
    if is_complex(value) then
        return value
    end
    if type(value) == "number" then
        return complex_new(value, 0)
    end
    error(string.format("%s: expected number or complex value, got %s", context or "complex arithmetic", type(value)))
end

local function atan2(y, x)
    if math.atan2 then
        return math.atan2(y, x)
    end
    return math.atan(y, x)
end

local function real_if_close(value)
    if is_complex(value) and math.abs(value.im) < 1e-10 then
        return value.re
    end
    return value
end

local function complex_add(left, right)
    local a = as_complex(left, "complex add")
    local b = as_complex(right, "complex add")
    return real_if_close(complex_new(a.re + b.re, a.im + b.im))
end

local function complex_sub(left, right)
    local a = as_complex(left, "complex subtract")
    local b = as_complex(right, "complex subtract")
    return real_if_close(complex_new(a.re - b.re, a.im - b.im))
end

local function complex_mul(left, right)
    local a = as_complex(left, "complex multiply")
    local b = as_complex(right, "complex multiply")
    return real_if_close(complex_new((a.re * b.re) - (a.im * b.im), (a.re * b.im) + (a.im * b.re)))
end

local function complex_div(left, right)
    local a = as_complex(left, "complex divide")
    local b = as_complex(right, "complex divide")
    local denom = (b.re * b.re) + (b.im * b.im)
    if denom == 0 then
        error("complex divide: division by zero")
    end
    return real_if_close(complex_new(((a.re * b.re) + (a.im * b.im)) / denom, ((a.im * b.re) - (a.re * b.im)) / denom))
end

local function complex_unm(value)
    local z = as_complex(value, "complex negate")
    return real_if_close(complex_new(-z.re, -z.im))
end

local function complex_abs(value)
    local z = as_complex(value, "complex magnitude")
    return math.sqrt((z.re * z.re) + (z.im * z.im))
end

local function complex_log(value)
    local z = as_complex(value, "complex log")
    return complex_new(math.log(complex_abs(z)), atan2(z.im, z.re))
end

local function complex_exp(value)
    local z = as_complex(value, "complex exp")
    local scale = math.exp(z.re)
    return real_if_close(complex_new(scale * math.cos(z.im), scale * math.sin(z.im)))
end

local function complex_pow(left, right)
    local a = as_complex(left, "complex power")
    local b = as_complex(right, "complex power")
    return complex_exp(complex_mul(b, complex_log(a)))
end

local function complex_to_string(value)
    if not is_complex(value) then
        return tostring(value)
    end
    local re = math.abs(value.re) < 1e-10 and 0 or value.re
    local im = math.abs(value.im) < 1e-10 and 0 or value.im
    if im == 0 then
        return tostring(re)
    end
    if re == 0 then
        return tostring(im) .. "i"
    end
    local sign = im < 0 and "" or "+"
    return tostring(re) .. sign .. tostring(im) .. "i"
end

complex_metatable = {
    __add = complex_add,
    __sub = complex_sub,
    __mul = complex_mul,
    __div = complex_div,
    __unm = complex_unm,
    __pow = complex_pow,
    __tostring = complex_to_string,
}

function _LS.complex(real, imag)
    return complex_new(real, imag)
end

function _LS.is_complex(value)
    return is_complex(value)
end

function _LS.real(value)
    if is_complex(value) then
        return value.re
    end
    return value
end

function _LS.imag(value)
    if is_complex(value) then
        return value.im
    end
    return 0
end

function _LS.magnitude(value)
    if is_complex(value) then
        return complex_abs(value)
    end
    return math.abs(value)
end

function _LS.conjugate(value)
    if is_complex(value) then
        return complex_new(value.re, -value.im)
    end
    return value
end

_LS.I = complex_new(0, 1)

function _LS.add(left, right)
    if type(left) == "string" or type(right) == "string" then
        return js_string(left) .. js_string(right)
    end

    return left + right
end

function _LS.many(...)
    return _LS.array({...})
end

function _LS.index(value, key)
    if type(value) == "string" and type(key) == "number" then
        return string.sub(value, key + 1, key + 1)
    end

    if type(key) == "number" then
        return value[key + 1]
    end

    return value[key]
end

function _LS.set_index(value, key, assigned)
    if type(key) == "number" then
        value[key + 1] = assigned
    else
        value[key] = assigned
    end

    return assigned
end

function _LS.length(value)
    if type(value) == "string" then
        return #value
    end

    if type(value) == "table" then
        local count = 0
        for _ in pairs(value) do
            count = count + 1
        end
        return math.max(#value, count)
    end

    return 0
end

function _LS.truthy(value)
    if value == nil or value == false then
        return false
    end

    if type(value) == "number" and value == 0 then
        return false
    end

    if type(value) == "string" and value == "" then
        return false
    end

    return true
end

function _LS.logical_and(left, right_thunk)
    if _LS.truthy(left) then
        return right_thunk()
    end

    return left
end

function _LS.logical_or(left, right_thunk)
    if _LS.truthy(left) then
        return left
    end

    return right_thunk()
end

local function create_summation_impl()
    return function(...)
        local args = pack_arguments(...)
        if args.n == 0 then
            error("math.summation: expected at least one argument")
        end

        local first = args[1]

        if type(first) == "table" then
            local callback = type(args[2]) == "function" and args[2] or nil
            local total = 0

            for index = 1, #first do
                local value = first[index]
                if callback then
                    value = callback(value, index, first)
                end
                total = total + ensure_numeric(value, "math.summation callback result")
            end

            return total
        end

        local lower
        local upper
        local step
        local callback

        if type(first) == "function" and args.n >= 3 and type(args[2]) == "number" and type(args[3]) == "number" then
            callback = first
            lower = ensure_numeric(args[2], "math.summation lower")
            upper = ensure_numeric(args[3], "math.summation upper")
            step = args.n >= 4 and ensure_numeric(args[4], "math.summation step") or nil
        elseif args.n >= 4 and type(args[4]) == "function" then
            callback = args[4]
            lower = ensure_numeric(args[2], "math.summation lower")
            upper = ensure_numeric(args[3], "math.summation upper")
            step = args.n >= 5 and ensure_numeric(args[5], "math.summation step") or nil
        else
            lower = ensure_numeric(first, "math.summation lower")
            upper = ensure_numeric(args[2], "math.summation upper")

            if args.n >= 3 and type(args[3]) == "function" then
                callback = args[3]
                step = args.n >= 4 and ensure_numeric(args[4], "math.summation step") or nil
            else
                step = args.n >= 3 and ensure_numeric(args[3], "math.summation step") or nil
                callback = type(args[4]) == "function" and args[4] or nil
            end
        end

        callback = callback or function(value)
            return value
        end

        if type(callback) ~= "function" then
            error("math.summation: expected callback function")
        end

        step = step or (lower <= upper and 1 or -1)
        if step == 0 then
            error("math.summation: step must be non-zero")
        end

        local total = 0
        local iteration = 0

        for value = lower, upper, step do
            local result = callback(value, iteration)
            total = total + ensure_numeric(result, "math.summation callback result")
            iteration = iteration + 1
        end

        return total
    end
end

local function create_product_impl()
    return function(...)
        local args = pack_arguments(...)
        if args.n == 0 then
            error("math.product: expected at least one argument")
        end

        local first = args[1]

        if type(first) == "table" then
            local callback = type(args[2]) == "function" and args[2] or nil
            local total = 1

            for index = 1, #first do
                local value = first[index]
                if callback then
                    value = callback(value, index, first)
                end
                total = total * ensure_numeric(value, "math.product callback result")
            end

            return total
        end

        local lower
        local upper
        local step
        local callback

        if type(first) == "function" and args.n >= 3 and type(args[2]) == "number" and type(args[3]) == "number" then
            callback = first
            lower = ensure_numeric(args[2], "math.product lower")
            upper = ensure_numeric(args[3], "math.product upper")
            step = args.n >= 4 and ensure_numeric(args[4], "math.product step") or nil
        elseif args.n >= 4 and type(args[4]) == "function" then
            callback = args[4]
            lower = ensure_numeric(args[2], "math.product lower")
            upper = ensure_numeric(args[3], "math.product upper")
            step = args.n >= 5 and ensure_numeric(args[5], "math.product step") or nil
        else
            lower = ensure_numeric(first, "math.product lower")
            upper = ensure_numeric(args[2], "math.product upper")

            if args.n >= 3 and type(args[3]) == "function" then
                callback = args[3]
                step = args.n >= 4 and ensure_numeric(args[4], "math.product step") or nil
            else
                step = args.n >= 3 and ensure_numeric(args[3], "math.product step") or nil
                callback = type(args[4]) == "function" and args[4] or nil
            end
        end

        callback = callback or function(value)
            return value
        end

        if type(callback) ~= "function" then
            error("math.product: expected callback function")
        end

        step = step or (lower <= upper and 1 or -1)
        if step == 0 then
            error("math.product: step must be non-zero")
        end

        local total = 1
        local iteration = 0

        for value = lower, upper, step do
            local result = callback(value, iteration)
            total = total * ensure_numeric(result, "math.product callback result")
            iteration = iteration + 1
        end

        return total
    end
end

local function create_integral_impl()
    return function(...)
        local args = pack_arguments(...)
        if args.n == 0 then
            error("math.integral: expected at least one argument")
        end

        local first = args[1]

        if type(first) == "table" then
            if #first < 2 then
                return 0
            end

            local area = 0
            for i = 1, #first - 1 do
                local segment_start = first[i]
                local segment_end = first[i + 1]

                if type(segment_start) ~= "table" or type(segment_end) ~= "table" then
                    error("math.integral: expected table of {x, y} points")
                end

                local x0 = ensure_numeric(segment_start[1], "math.integral point x0")
                local y0 = ensure_numeric(segment_start[2], "math.integral point y0")
                local x1 = ensure_numeric(segment_end[1], "math.integral point x1")
                local y1 = ensure_numeric(segment_end[2], "math.integral point y1")

                area = area + ((y0 + y1) / 2) * (x1 - x0)
            end

            return area
        end

        local integrand
        local lower
        local upper
        local segments

        if type(first) == "function" and args.n >= 3 and type(args[2]) == "number" and type(args[3]) == "number" then
            integrand = first
            lower = ensure_numeric(args[2], "math.integral lower")
            upper = ensure_numeric(args[3], "math.integral upper")
            segments = args.n >= 4 and ensure_numeric(args[4], "math.integral segments") or nil
        elseif args.n >= 4 and type(args[4]) == "function" then
            integrand = args[4]
            lower = ensure_numeric(args[2], "math.integral lower")
            upper = ensure_numeric(args[3], "math.integral upper")
            segments = args.n >= 5 and ensure_numeric(args[5], "math.integral segments") or nil
        elseif type(args[3]) == "function" then
            lower = ensure_numeric(first, "math.integral lower")
            upper = ensure_numeric(args[2], "math.integral upper")
            integrand = args[3]
            segments = args.n >= 4 and ensure_numeric(args[4], "math.integral segments") or nil
        else
            error("math.integral: expected integrand function")
        end

        if type(integrand) ~= "function" then
            error("math.integral: expected integrand function")
        end

        segments = segments or 1000
        segments = math.max(1, math.floor(ensure_numeric(segments, "math.integral segments")))

        local range = upper - lower
        local step = range / segments
        if step == 0 then
            return 0
        end

        local area = 0
        local position = lower

        for _ = 1, segments do
            local midpoint = position + step / 2
            local height = ensure_numeric(integrand(midpoint), "math.integral integrand result")
            area = area + height * step
            position = position + step
        end

        return area
    end
end

local summation_impl = math.summation or create_summation_impl()
local product_impl = math.product or create_product_impl()
local integral_impl = math.integral or create_integral_impl()
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
    if step == 0 then
        error("math range step cannot be zero")
    end
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
    elseif type(collection_or_start) == "function" then
        local mapper = collection_or_start
        if type(finish) ~= "number" or type(step_or_mapper) ~= "number" then
            error("math.summation expects numeric bounds when callback is first argument")
        end

        local lower = ensure_numeric(finish, "math.summation lower")
        local upper = ensure_numeric(step_or_mapper, "math.summation upper")
        local step

        if maybe_mapper ~= nil then
            if type(maybe_mapper) ~= "number" then
                error("math.summation step must be a number")
            end
            step = normalize_step(lower, upper, ensure_numeric(maybe_mapper, "math.summation step"))
        else
            step = normalize_step(lower, upper)
        end

        iterate_range(lower, upper, step, function(value, index)
            local mapped = mapper(value, index)
            if mapped then
                total = total + mapped
            end
        end)

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

local function derivative_impl(fn, x, h)
    if type(fn) ~= "function" then
        error("math.derivative requires a function as the first argument")
    end
    if type(x) ~= "number" then
        error("math.derivative requires a numeric point")
    end
    h = h or 1e-5
    if type(h) ~= "number" or h == 0 then
        error("math.derivative requires a non-zero numeric step")
    end
    return (fn(x + h) - fn(x - h)) / (2 * h)
end

_LS.math.summation = summation_impl
_LS.math.product = product_impl
_LS.math.integral = integral_impl
_LS.math.derivative = derivative_impl

if not math.summation then
    math.summation = summation_impl
end
if not math.product then
    math.product = product_impl
end
if not math.integral then
    math.integral = integral_impl
end
if not math.derivative then
    math.derivative = derivative_impl
end

_LS.math.summation = summation_impl
_LS.math.product = product_impl
_LS.math.integral = integral_impl
_LS.math.derivative = derivative_impl

local function ensure_vector(value, context)
    if type(value) ~= "table" then
        error(string.format("%s: expected vector table, got %s", context, type(value)))
    end
    local result = {}
    for index = 1, #value do
        result[index] = ensure_numeric(value[index], context .. " component")
    end
    return result
end

local function shifted_point(point, coordinate, delta)
    local result = {}
    for index = 1, #point do
        result[index] = point[index]
    end
    result[coordinate] = result[coordinate] + delta
    return _LS.array(result)
end

function _LS.math.vector(value)
    return _LS.array(ensure_vector(value or {}, "math.vector"))
end

function _LS.math.dot(left, right)
    local a = ensure_vector(left, "math.dot left")
    local b = ensure_vector(right, "math.dot right")
    if #a ~= #b then
        error("math.dot: vector dimensions must match")
    end
    local total = 0
    for index = 1, #a do
        total = total + (a[index] * b[index])
    end
    return total
end

function _LS.math.cross(left, right)
    local a = ensure_vector(left, "math.cross left")
    local b = ensure_vector(right, "math.cross right")
    if #a ~= 3 or #b ~= 3 then
        error("math.cross: expected two 3D vectors")
    end
    return _LS.array({
        (a[2] * b[3]) - (a[3] * b[2]),
        (a[3] * b[1]) - (a[1] * b[3]),
        (a[1] * b[2]) - (a[2] * b[1]),
    })
end

function _LS.math.tensor_product(left, right)
    local a = ensure_vector(left, "math.tensor_product left")
    local b = ensure_vector(right, "math.tensor_product right")
    local rows = {}
    for i = 1, #a do
        local row = {}
        for j = 1, #b do
            row[j] = a[i] * b[j]
        end
        rows[i] = _LS.array(row)
    end
    return _LS.array(rows)
end

function _LS.math.norm(value)
    local vector = ensure_vector(value, "math.norm")
    return math.sqrt(_LS.math.dot(vector, vector))
end

function _LS.math.unit(value)
    local vector = ensure_vector(value, "math.unit")
    local length = _LS.math.norm(vector)
    if length == 0 then
        error("math.unit: zero vector has no unit direction")
    end
    local result = {}
    for index = 1, #vector do
        result[index] = vector[index] / length
    end
    return _LS.array(result)
end

function _LS.math.gradient(callback, point, h)
    if type(callback) ~= "function" then
        error("math.gradient: expected scalar field function")
    end
    local p = ensure_vector(point, "math.gradient point")
    h = h or 1e-5
    if type(h) ~= "number" or h == 0 then
        error("math.gradient: expected non-zero numeric step")
    end
    local result = {}
    for coordinate = 1, #p do
        local forward = callback(shifted_point(p, coordinate, h))
        local backward = callback(shifted_point(p, coordinate, -h))
        result[coordinate] = (ensure_numeric(forward, "math.gradient forward") - ensure_numeric(backward, "math.gradient backward")) / (2 * h)
    end
    return _LS.array(result)
end

function _LS.math.divergence(callback, point, h)
    if type(callback) ~= "function" then
        error("math.divergence: expected vector field function")
    end
    local p = ensure_vector(point, "math.divergence point")
    h = h or 1e-5
    if type(h) ~= "number" or h == 0 then
        error("math.divergence: expected non-zero numeric step")
    end
    local total = 0
    for coordinate = 1, #p do
        local forward = ensure_vector(callback(shifted_point(p, coordinate, h)), "math.divergence forward")
        local backward = ensure_vector(callback(shifted_point(p, coordinate, -h)), "math.divergence backward")
        total = total + ((forward[coordinate] - backward[coordinate]) / (2 * h))
    end
    return total
end

function _LS.math.curl(callback, point, h)
    if type(callback) ~= "function" then
        error("math.curl: expected vector field function")
    end
    local p = ensure_vector(point, "math.curl point")
    if #p ~= 3 then
        error("math.curl: expected a 3D point")
    end
    h = h or 1e-5
    if type(h) ~= "number" or h == 0 then
        error("math.curl: expected non-zero numeric step")
    end
    local function partial(component, coordinate)
        local forward = ensure_vector(callback(shifted_point(p, coordinate, h)), "math.curl forward")
        local backward = ensure_vector(callback(shifted_point(p, coordinate, -h)), "math.curl backward")
        return (forward[component] - backward[component]) / (2 * h)
    end
    return _LS.array({
        partial(3, 2) - partial(2, 3),
        partial(1, 3) - partial(3, 1),
        partial(2, 1) - partial(1, 2),
    })
end

local function copy_dimensions(dimensions)
    local result = {}
    if dimensions == nil then
        return result
    end
    if type(dimensions) ~= "table" then
        error("math.quantity: dimensions must be a table")
    end
    for key, exponent in pairs(dimensions) do
        if type(key) ~= "string" then
            error("math.quantity: dimension keys must be strings")
        end
        if type(exponent) ~= "number" then
            error("math.quantity: dimension exponents must be numbers")
        end
        if exponent ~= 0 then
            result[key] = exponent
        end
    end
    return result
end

local function same_dimensions(left, right)
    for key, exponent in pairs(left) do
        if right[key] ~= exponent then
            return false
        end
    end
    for key, exponent in pairs(right) do
        if left[key] ~= exponent then
            return false
        end
    end
    return true
end

local function combine_dimensions(left, right, scale)
    local result = copy_dimensions(left)
    for key, exponent in pairs(right) do
        local next_value = (result[key] or 0) + (exponent * scale)
        if next_value == 0 then
            result[key] = nil
        else
            result[key] = next_value
        end
    end
    return result
end

local function pow_dimensions(dimensions, exponent)
    local result = {}
    for key, value in pairs(dimensions) do
        local next_value = value * exponent
        if next_value ~= 0 then
            result[key] = next_value
        end
    end
    return result
end

local dimension_order = {
    kg = 1,
    m = 2,
    s = 3,
    A = 4,
    K = 5,
    mol = 6,
    cd = 7,
}

local function format_dimensions(dimensions)
    dimensions = copy_dimensions(dimensions)
    local keys = {}
    for key in pairs(dimensions) do
        keys[#keys + 1] = key
    end
    table.sort(keys, function(left, right)
        local left_order = dimension_order[left] or 1000
        local right_order = dimension_order[right] or 1000
        if left_order == right_order then
            return left < right
        end
        return left_order < right_order
    end)
    if #keys == 0 then
        return "1"
    end

    local parts = {}
    for _, key in ipairs(keys) do
        local exponent = dimensions[key]
        if exponent == 1 then
            parts[#parts + 1] = key
        else
            parts[#parts + 1] = key .. "^" .. tostring(exponent)
        end
    end
    return table.concat(parts, " ")
end

local function is_quantity(value)
    return type(value) == "table" and value.__ls_unit == true
end

local unit_metatable = {}

local function unit_new(value, symbol, dimensions)
    if type(value) ~= "number" then
        error("math.quantity: value must be numeric")
    end
    if symbol ~= nil and type(symbol) ~= "string" then
        error("math.quantity: symbol must be a string")
    end
    return setmetatable({
        __ls_unit = true,
        value = value,
        symbol = symbol or "",
        dimensions = copy_dimensions(dimensions),
    }, unit_metatable)
end

local function ensure_quantity(value, context)
    if is_quantity(value) then
        return value
    end
    if type(value) == "number" then
        return unit_new(value, "", {})
    end
    error(string.format("%s: expected quantity or number, got %s", context, type(value)))
end

local function quantity_value(value, context)
    if is_quantity(value) then
        return value.value
    end
    if type(value) == "number" then
        return value
    end
    error(string.format("%s: expected quantity or number, got %s", context, type(value)))
end

local function compose_unit_symbol(left, operator, right)
    if left == "" and right == "" then
        return ""
    end
    if left == "" then
        return right
    end
    if right == "" then
        return left
    end
    return left .. operator .. right
end

local function base_unit(value, symbol, dimensions)
    return unit_new(value, symbol, dimensions)
end

function _LS.math.quantity(value, symbol, dimensions)
    return unit_new(value, symbol, dimensions)
end

function _LS.math.unit_value(value)
    return ensure_quantity(value, "math.unit_value").value
end

function _LS.math.unit_symbol(value)
    return ensure_quantity(value, "math.unit_symbol").symbol
end

function _LS.math.unit_dimensions(value)
    return copy_dimensions(ensure_quantity(value, "math.unit_dimensions").dimensions)
end

function _LS.math.unit_compatible(left, right)
    local a = ensure_quantity(left, "math.unit_compatible left")
    local b = ensure_quantity(right, "math.unit_compatible right")
    return same_dimensions(a.dimensions, b.dimensions)
end

function _LS.math.unit_add(left, right)
    local a = ensure_quantity(left, "math.unit_add left")
    local b = ensure_quantity(right, "math.unit_add right")
    if not same_dimensions(a.dimensions, b.dimensions) then
        error("math.unit_add: incompatible dimensions")
    end
    return unit_new(a.value + b.value, a.symbol ~= "" and a.symbol or b.symbol, a.dimensions)
end

function _LS.math.unit_sub(left, right)
    local a = ensure_quantity(left, "math.unit_sub left")
    local b = ensure_quantity(right, "math.unit_sub right")
    if not same_dimensions(a.dimensions, b.dimensions) then
        error("math.unit_sub: incompatible dimensions")
    end
    return unit_new(a.value - b.value, a.symbol ~= "" and a.symbol or b.symbol, a.dimensions)
end

function _LS.math.unit_mul(left, right, symbol)
    local a = ensure_quantity(left, "math.unit_mul left")
    local b = ensure_quantity(right, "math.unit_mul right")
    return unit_new(
        a.value * b.value,
        symbol or compose_unit_symbol(a.symbol, "*", b.symbol),
        combine_dimensions(a.dimensions, b.dimensions, 1)
    )
end

function _LS.math.unit_div(left, right, symbol)
    local a = ensure_quantity(left, "math.unit_div left")
    local b = ensure_quantity(right, "math.unit_div right")
    if b.value == 0 then
        error("math.unit_div: division by zero")
    end
    return unit_new(
        a.value / b.value,
        symbol or compose_unit_symbol(a.symbol, "/", b.symbol),
        combine_dimensions(a.dimensions, b.dimensions, -1)
    )
end

function _LS.math.unit_pow(value, exponent, symbol)
    local quantity = ensure_quantity(value, "math.unit_pow")
    if type(exponent) ~= "number" then
        error("math.unit_pow: exponent must be numeric")
    end
    local next_symbol = symbol or quantity.symbol
    if symbol == nil and quantity.symbol ~= "" and exponent ~= 1 then
        next_symbol = quantity.symbol .. "^" .. tostring(exponent)
    end
    return unit_new(quantity.value ^ exponent, next_symbol, pow_dimensions(quantity.dimensions, exponent))
end

function _LS.math.unit_convert(value, factor, symbol)
    local quantity = ensure_quantity(value, "math.unit_convert")
    if type(factor) ~= "number" then
        error("math.unit_convert: factor must be numeric")
    end
    return unit_new(quantity.value * factor, symbol or quantity.symbol, quantity.dimensions)
end

function _LS.math.meters(value)
    return base_unit(value, "m", { m = 1 })
end

function _LS.math.seconds(value)
    return base_unit(value, "s", { s = 1 })
end

function _LS.math.kilograms(value)
    return base_unit(value, "kg", { kg = 1 })
end

function _LS.math.amps(value)
    return base_unit(value, "A", { A = 1 })
end

function _LS.math.volts(value)
    return base_unit(value, "V", { kg = 1, m = 2, s = -3, A = -1 })
end

function _LS.math.ohms(value)
    return base_unit(value, "Ω", { kg = 1, m = 2, s = -3, A = -2 })
end

function _LS.math.watts(value)
    return base_unit(value, "W", { kg = 1, m = 2, s = -3 })
end

function _LS.math.joules(value)
    return base_unit(value, "J", { kg = 1, m = 2, s = -2 })
end

function _LS.math.coulombs(value)
    return base_unit(value, "C", { s = 1, A = 1 })
end

function _LS.math.farads(value)
    return base_unit(value, "F", { kg = -1, m = -2, s = 4, A = 2 })
end

function _LS.math.henries(value)
    return base_unit(value, "H", { kg = 1, m = 2, s = -2, A = -2 })
end

function _LS.math.teslas(value)
    return base_unit(value, "T", { kg = 1, s = -2, A = -1 })
end

function _LS.math.newtons(value)
    return base_unit(value, "N", { kg = 1, m = 1, s = -2 })
end

function _LS.math.phasor(magnitude, degrees)
    local r = quantity_value(magnitude, "math.phasor magnitude")
    local theta = quantity_value(degrees, "math.phasor degrees") * math.pi / 180
    return complex_new(r * math.cos(theta), r * math.sin(theta))
end

function _LS.math.phase(value)
    local z = as_complex(value, "math.phase")
    return atan2(z.im, z.re) * 180 / math.pi
end

function _LS.math.reactance_L(frequency, inductance)
    return 2 * math.pi * quantity_value(frequency, "math.reactance_L frequency") * quantity_value(inductance, "math.reactance_L inductance")
end

function _LS.math.reactance_C(frequency, capacitance)
    local f = quantity_value(frequency, "math.reactance_C frequency")
    local c = quantity_value(capacitance, "math.reactance_C capacitance")
    if f == 0 or c == 0 then
        error("math.reactance_C: frequency and capacitance must be non-zero")
    end
    return -1 / (2 * math.pi * f * c)
end

function _LS.math.impedance_R(resistance)
    return quantity_value(resistance, "math.impedance_R resistance")
end

function _LS.math.impedance_L(frequency, inductance)
    return complex_new(0, _LS.math.reactance_L(frequency, inductance))
end

function _LS.math.impedance_C(frequency, capacitance)
    return complex_new(0, _LS.math.reactance_C(frequency, capacitance))
end

function _LS.math.series_impedance(values)
    if type(values) ~= "table" then
        error("math.series_impedance: expected an array")
    end
    local total = 0
    for index = 1, #values do
        total = complex_add(total, values[index])
    end
    return total
end

function _LS.math.parallel_impedance(values)
    if type(values) ~= "table" then
        error("math.parallel_impedance: expected an array")
    end
    local inverse_total = 0
    for index = 1, #values do
        inverse_total = complex_add(inverse_total, complex_div(1, values[index]))
    end
    return complex_div(1, inverse_total)
end

function _LS.math.rms(peak_value)
    return quantity_value(peak_value, "math.rms") / math.sqrt(2)
end

function _LS.math.peak(rms_value)
    return quantity_value(rms_value, "math.peak") * math.sqrt(2)
end

local symbolic_evaluate

local function positive_quantity_value(value, context)
    local numeric = quantity_value(value, context)
    if numeric <= 0 then
        error(context .. ": expected positive value")
    end
    return numeric
end

local function ensure_frequency_response(response, context)
    if type(response) ~= "table" or response.__ls_frequency_response ~= true then
        error(context .. ": expected frequency response")
    end
    return response
end

function _LS.math.rc_time_constant(resistance, capacitance)
    return positive_quantity_value(resistance, "math.rc_time_constant resistance") *
        positive_quantity_value(capacitance, "math.rc_time_constant capacitance")
end

function _LS.math.rl_time_constant(inductance, resistance)
    return positive_quantity_value(inductance, "math.rl_time_constant inductance") /
        positive_quantity_value(resistance, "math.rl_time_constant resistance")
end

function _LS.math.rc_cutoff_frequency(resistance, capacitance)
    return 1 / (2 * math.pi * _LS.math.rc_time_constant(resistance, capacitance))
end

function _LS.math.rl_cutoff_frequency(resistance, inductance)
    return positive_quantity_value(resistance, "math.rl_cutoff_frequency resistance") /
        (2 * math.pi * positive_quantity_value(inductance, "math.rl_cutoff_frequency inductance"))
end

function _LS.math.rlc_resonant_frequency(inductance, capacitance)
    local l = positive_quantity_value(inductance, "math.rlc_resonant_frequency inductance")
    local c = positive_quantity_value(capacitance, "math.rlc_resonant_frequency capacitance")
    return 1 / (2 * math.pi * math.sqrt(l * c))
end

function _LS.math.rlc_quality_series(resistance, inductance, capacitance)
    local r = positive_quantity_value(resistance, "math.rlc_quality_series resistance")
    local l = positive_quantity_value(inductance, "math.rlc_quality_series inductance")
    local c = positive_quantity_value(capacitance, "math.rlc_quality_series capacitance")
    return math.sqrt(l / c) / r
end

function _LS.math.rlc_bandwidth_series(resistance, inductance)
    return positive_quantity_value(resistance, "math.rlc_bandwidth_series resistance") /
        (2 * math.pi * positive_quantity_value(inductance, "math.rlc_bandwidth_series inductance"))
end

function _LS.math.frequency_response(transfer, parameters, frequency_hz)
    local f = quantity_value(frequency_hz, "math.frequency_response frequency")
    if f < 0 then
        error("math.frequency_response frequency: expected non-negative value")
    end
    local env = {}
    if parameters ~= nil then
        if type(parameters) ~= "table" then
            error("math.frequency_response: parameters must be a table")
        end
        for key, value in pairs(parameters) do
            env[key] = value
        end
    end
    env.s = complex_new(0, 2 * math.pi * f)
    local value = symbolic_evaluate(transfer, env)
    local magnitude = _LS.magnitude(value)
    local db
    if magnitude == 0 then
        db = -math.huge
    else
        db = 20 * math.log(magnitude) / math.log(10)
    end
    return {
        __ls_frequency_response = true,
        frequency_hz = f,
        omega = 2 * math.pi * f,
        value = value,
        magnitude = magnitude,
        db = db,
        phase_degrees = _LS.math.phase(value),
    }
end

function _LS.math.response_value(response)
    return ensure_frequency_response(response, "math.response_value").value
end

function _LS.math.response_magnitude(response)
    return ensure_frequency_response(response, "math.response_magnitude").magnitude
end

function _LS.math.response_db(response)
    return ensure_frequency_response(response, "math.response_db").db
end

function _LS.math.response_phase(response)
    return ensure_frequency_response(response, "math.response_phase").phase_degrees
end

function _LS.math.response_frequency(response)
    return ensure_frequency_response(response, "math.response_frequency").frequency_hz
end

function _LS.math.response_omega(response)
    return ensure_frequency_response(response, "math.response_omega").omega
end

local function ensure_response_table(values, context)
    if type(values) ~= "table" then
        error(context .. ": expected an array of frequency responses")
    end
    if #values == 0 then
        error(context .. ": expected at least one frequency response")
    end
    for index = 1, #values do
        ensure_frequency_response(values[index], context)
    end
    return values
end

function _LS.math.frequency_sweep(start_hz, stop_hz, count, scale)
    local start_value = positive_quantity_value(start_hz, "math.frequency_sweep start")
    local stop_value = positive_quantity_value(stop_hz, "math.frequency_sweep stop")
    local n = quantity_value(count, "math.frequency_sweep count")
    if n ~= math.floor(n) or n < 2 then
        error("math.frequency_sweep count: expected integer count >= 2")
    end
    local mode = scale or "log"
    if mode ~= "log" and mode ~= "linear" then
        error("math.frequency_sweep: scale must be 'log' or 'linear'")
    end
    if stop_value <= start_value then
        error("math.frequency_sweep stop: expected value greater than start")
    end

    local values = {}
    if mode == "linear" then
        local step = (stop_value - start_value) / (n - 1)
        for index = 1, n do
            values[index] = start_value + ((index - 1) * step)
        end
        return values
    end

    local log_start = math.log(start_value)
    local log_stop = math.log(stop_value)
    local step = (log_stop - log_start) / (n - 1)
    for index = 1, n do
        values[index] = math.exp(log_start + ((index - 1) * step))
    end
    return values
end

function _LS.math.frequency_response_sweep(transfer, parameters, frequencies)
    if type(frequencies) ~= "table" or #frequencies == 0 then
        error("math.frequency_response_sweep: expected non-empty frequency array")
    end
    local responses = {}
    for index = 1, #frequencies do
        responses[index] = _LS.math.frequency_response(transfer, parameters, frequencies[index])
    end
    return responses
end

local function response_column(responses, field, context)
    responses = ensure_response_table(responses, context)
    local values = {}
    for index = 1, #responses do
        values[index] = responses[index][field]
    end
    return values
end

function _LS.math.response_magnitudes(responses)
    return response_column(responses, "magnitude", "math.response_magnitudes")
end

function _LS.math.response_db_values(responses)
    return response_column(responses, "db", "math.response_db_values")
end

function _LS.math.response_phases(responses)
    return response_column(responses, "phase_degrees", "math.response_phases")
end

function _LS.math.response_peak(responses)
    responses = ensure_response_table(responses, "math.response_peak")
    local best = responses[1]
    for index = 2, #responses do
        if responses[index].magnitude > best.magnitude then
            best = responses[index]
        end
    end
    return best
end

function _LS.math.response_trough(responses)
    responses = ensure_response_table(responses, "math.response_trough")
    local best = responses[1]
    for index = 2, #responses do
        if responses[index].magnitude < best.magnitude then
            best = responses[index]
        end
    end
    return best
end

function _LS.math.response_nearest(responses, frequency_hz)
    responses = ensure_response_table(responses, "math.response_nearest")
    local target = quantity_value(frequency_hz, "math.response_nearest frequency")
    local best = responses[1]
    local best_delta = math.abs(best.frequency_hz - target)
    for index = 2, #responses do
        local delta = math.abs(responses[index].frequency_hz - target)
        if delta < best_delta then
            best = responses[index]
            best_delta = delta
        end
    end
    return best
end

function _LS.math.response_is_monotonic_db(responses, direction)
    responses = ensure_response_table(responses, "math.response_is_monotonic_db")
    if direction ~= "increasing" and direction ~= "decreasing" then
        error("math.response_is_monotonic_db: direction must be 'increasing' or 'decreasing'")
    end
    for index = 2, #responses do
        if direction == "increasing" and responses[index].db + 1e-9 < responses[index - 1].db then
            return false
        end
        if direction == "decreasing" and responses[index].db - 1e-9 > responses[index - 1].db then
            return false
        end
    end
    return true
end

function _LS.math.response_crossing_frequency(responses, target_db)
    responses = ensure_response_table(responses, "math.response_crossing_frequency")
    local target = quantity_value(target_db, "math.response_crossing_frequency target_db")
    for index = 1, #responses do
        if math.abs(responses[index].db - target) < 1e-9 then
            return responses[index].frequency_hz
        end
    end
    for index = 2, #responses do
        local previous = responses[index - 1]
        local current = responses[index]
        local previous_delta = previous.db - target
        local current_delta = current.db - target
        if previous_delta == 0 then
            return previous.frequency_hz
        end
        if current_delta == 0 then
            return current.frequency_hz
        end
        if (previous_delta < 0 and current_delta > 0) or (previous_delta > 0 and current_delta < 0) then
            local fraction = (target - previous.db) / (current.db - previous.db)
            return previous.frequency_hz + ((current.frequency_hz - previous.frequency_hz) * fraction)
        end
    end
    error("math.response_crossing_frequency: target dB not crossed")
end

unit_metatable.__add = function(left, right)
    return _LS.math.unit_add(left, right)
end

unit_metatable.__sub = function(left, right)
    return _LS.math.unit_sub(left, right)
end

unit_metatable.__mul = function(left, right)
    return _LS.math.unit_mul(left, right)
end

unit_metatable.__div = function(left, right)
    return _LS.math.unit_div(left, right)
end

unit_metatable.__pow = function(left, right)
    return _LS.math.unit_pow(left, right)
end

unit_metatable.__unm = function(value)
    local quantity = ensure_quantity(value, "math.unit negation")
    return unit_new(-quantity.value, quantity.symbol, quantity.dimensions)
end

unit_metatable.__tostring = function(value)
    if value.symbol == "" then
        return tostring(value.value)
    end
    return tostring(value.value) .. " " .. value.symbol
end

local function ensure_matrix(value, context)
    if type(value) ~= "table" then
        error(string.format("%s: expected a matrix", context))
    end
    local row_count = #value
    if row_count == 0 then
        error(string.format("%s: expected at least one row", context))
    end
    if type(value[1]) ~= "table" then
        error(string.format("%s: expected matrix rows to be arrays", context))
    end
    local column_count = #value[1]
    if column_count == 0 then
        error(string.format("%s: expected at least one column", context))
    end
    for row = 1, row_count do
        if type(value[row]) ~= "table" then
            error(string.format("%s: expected matrix rows to be arrays", context))
        end
        if #value[row] ~= column_count then
            error(string.format("%s: matrix rows must have equal length", context))
        end
    end
    return value, row_count, column_count
end

local function matrix_copy(value, context)
    local matrix, row_count, column_count = ensure_matrix(value, context)
    local rows = {}
    for row = 1, row_count do
        local next_row = {}
        for column = 1, column_count do
            next_row[column] = matrix[row][column]
        end
        rows[row] = _LS.array(next_row)
    end
    return _LS.array(rows)
end

function _LS.math.matrix(value)
    return matrix_copy(value, "math.matrix")
end

function _LS.math.transpose(value)
    local matrix, row_count, column_count = ensure_matrix(value, "math.transpose")
    local rows = {}
    for column = 1, column_count do
        local next_row = {}
        for row = 1, row_count do
            next_row[row] = matrix[row][column]
        end
        rows[column] = _LS.array(next_row)
    end
    return _LS.array(rows)
end

function _LS.math.matmul(left, right)
    local a, a_rows, a_columns = ensure_matrix(left, "math.matmul left")
    local b, b_rows, b_columns = ensure_matrix(right, "math.matmul right")
    if a_columns ~= b_rows then
        error("math.matmul: inner dimensions must match")
    end
    local rows = {}
    for row = 1, a_rows do
        local next_row = {}
        for column = 1, b_columns do
            local total = 0
            for index = 1, a_columns do
                total = total + (a[row][index] * b[index][column])
            end
            next_row[column] = total
        end
        rows[row] = _LS.array(next_row)
    end
    return _LS.array(rows)
end

function _LS.math.matrix_vector(matrix_value, vector_value)
    local matrix, row_count, column_count = ensure_matrix(matrix_value, "math.matrix_vector matrix")
    local vector = ensure_vector(vector_value, "math.matrix_vector vector")
    if column_count ~= #vector then
        error("math.matrix_vector: matrix columns must match vector length")
    end
    local result = {}
    for row = 1, row_count do
        local total = 0
        for column = 1, column_count do
            total = total + (matrix[row][column] * vector[column])
        end
        result[row] = total
    end
    return _LS.array(result)
end

function _LS.math.determinant2(value)
    local matrix, row_count, column_count = ensure_matrix(value, "math.determinant2")
    if row_count ~= 2 or column_count ~= 2 then
        error("math.determinant2: expected a 2x2 matrix")
    end
    return (matrix[1][1] * matrix[2][2]) - (matrix[1][2] * matrix[2][1])
end

function _LS.math.solve2(matrix_value, vector_value)
    local matrix, row_count, column_count = ensure_matrix(matrix_value, "math.solve2 matrix")
    local vector = ensure_vector(vector_value, "math.solve2 vector")
    if row_count ~= 2 or column_count ~= 2 or #vector ~= 2 then
        error("math.solve2: expected a 2x2 matrix and length-2 vector")
    end
    local determinant = _LS.math.determinant2(matrix)
    if determinant == 0 then
        error("math.solve2: singular matrix")
    end
    return _LS.array({
        ((vector[1] * matrix[2][2]) - (matrix[1][2] * vector[2])) / determinant,
        ((matrix[1][1] * vector[2]) - (vector[1] * matrix[2][1])) / determinant,
    })
end

function _LS.math.identity(size)
    if type(size) ~= "number" or size < 1 or size ~= math.floor(size) then
        error("math.identity: size must be a positive integer")
    end
    local rows = {}
    for row = 1, size do
        local next_row = {}
        for column = 1, size do
            next_row[column] = row == column and 1 or 0
        end
        rows[row] = _LS.array(next_row)
    end
    return _LS.array(rows)
end

function _LS.math.trace(value)
    local matrix, row_count, column_count = ensure_matrix(value, "math.trace")
    if row_count ~= column_count then
        error("math.trace: expected a square matrix")
    end
    local total = 0
    for index = 1, row_count do
        total = total + matrix[index][index]
    end
    return total
end

function _LS.math.lorentz_force(charge, electric_field, velocity, magnetic_field)
    local q = quantity_value(charge, "math.lorentz_force charge")
    local e = ensure_vector(electric_field, "math.lorentz_force electric field")
    local v = ensure_vector(velocity, "math.lorentz_force velocity")
    local b = ensure_vector(magnetic_field, "math.lorentz_force magnetic field")
    if #e ~= 3 or #v ~= 3 or #b ~= 3 then
        error("math.lorentz_force: expected 3D field and velocity vectors")
    end
    local magnetic_term = ensure_vector(_LS.math.cross(v, b), "math.lorentz_force magnetic term")
    return _LS.array({
        q * (e[1] + magnetic_term[1]),
        q * (e[2] + magnetic_term[2]),
        q * (e[3] + magnetic_term[3]),
    })
end

local symbolic_metatable = {}
local equation_metatable = {}
local formula_metatable = {}
local solution_metatable = {}

local function is_symbolic(value)
    return type(value) == "table" and value.__ls_symbolic == true
end

local function is_equation(value)
    return type(value) == "table" and value.__ls_equation == true
end

local function symbolic_number(value)
    if value == math.floor(value) then
        return string.format("%.0f", value)
    end
    return tostring(value)
end

local function symbolic_const(value, dimensions)
    if type(value) ~= "number" then
        error("math.symbolic: constants must be numeric")
    end
    return setmetatable({
        __ls_symbolic = true,
        kind = "const",
        value = value,
        dimensions = copy_dimensions(dimensions),
    }, symbolic_metatable)
end

local function symbolic_var(name, dimensions)
    if type(name) ~= "string" or name == "" then
        error("math.sym: name must be a non-empty string")
    end
    return setmetatable({
        __ls_symbolic = true,
        kind = "var",
        name = name,
        dimensions = copy_dimensions(dimensions),
    }, symbolic_metatable)
end

local function symbolic_from(value, context)
    if is_symbolic(value) then
        return value
    end
    if type(value) == "number" then
        return symbolic_const(value)
    end
    error(string.format("%s: expected symbolic expression or number, got %s", context, type(value)))
end

local function symbolic_unary(kind, value)
    local expr = symbolic_from(value, "math.symbolic unary")
    return setmetatable({
        __ls_symbolic = true,
        kind = kind,
        value = expr,
        dimensions = copy_dimensions(expr.dimensions),
    }, symbolic_metatable)
end

local function symbolic_dimension_of(expr)
    expr = symbolic_from(expr, "math.symbolic dimensions")
    return copy_dimensions(expr.dimensions)
end

local function symbolic_binary_dimensions(kind, left, right)
    local left_dimensions = symbolic_dimension_of(left)
    local right_dimensions = symbolic_dimension_of(right)
    if kind == "add" or kind == "sub" then
        if left.kind == "const" and left.value == 0 then
            return right_dimensions
        end
        if right.kind == "const" and right.value == 0 then
            return left_dimensions
        end
        if not same_dimensions(left_dimensions, right_dimensions) then
            error(
                "math.symbolic: incompatible dimensions for " .. kind .. ": " ..
                format_dimensions(left_dimensions) .. " vs " .. format_dimensions(right_dimensions)
            )
        end
        return left_dimensions
    end
    if kind == "mul" or kind == "dot" or kind == "cross" then
        return combine_dimensions(left_dimensions, right_dimensions, 1)
    end
    if kind == "div" then
        return combine_dimensions(left_dimensions, right_dimensions, -1)
    end
    if kind == "pow" then
        if right.kind ~= "const" then
            if not same_dimensions(left_dimensions, {}) then
                error("math.symbolic: dimensioned powers require numeric exponents")
            end
            return {}
        end
        return pow_dimensions(left_dimensions, right.value)
    end
    return {}
end

local function symbolic_binary(kind, left, right)
    local left_expr = symbolic_from(left, "math.symbolic binary left")
    local right_expr = symbolic_from(right, "math.symbolic binary right")
    return setmetatable({
        __ls_symbolic = true,
        kind = kind,
        left = left_expr,
        right = right_expr,
        dimensions = symbolic_binary_dimensions(kind, left_expr, right_expr),
    }, symbolic_metatable)
end

local function symbolic_function(name, value, dimensions)
    local expr = symbolic_from(value, "math.symbolic function")
    return setmetatable({
        __ls_symbolic = true,
        kind = "func",
        name = name,
        value = expr,
        dimensions = dimensions and copy_dimensions(dimensions) or copy_dimensions(expr.dimensions),
    }, symbolic_metatable)
end

local function ensure_symbolic_dimensionless(expr, context)
    if not same_dimensions(expr.dimensions, {}) then
        error(context .. ": expected dimensionless argument, got " .. format_dimensions(expr.dimensions))
    end
end

local function symbolic_intrinsic(name, value)
    local expr = symbolic_from(value, "math.symbolic intrinsic")
    ensure_symbolic_dimensionless(expr, "math." .. name)
    return symbolic_function(name, expr, {})
end

local function symbolic_render(expr)
    expr = symbolic_from(expr, "math.symbolic_format")
    if expr.kind == "const" then
        return symbolic_number(expr.value)
    end
    if expr.kind == "var" then
        return expr.name
    end
    if expr.kind == "neg" then
        return "(-" .. symbolic_render(expr.value) .. ")"
    end
    if expr.kind == "func" then
        return expr.name .. "(" .. symbolic_render(expr.value) .. ")"
    end

    local operators = {
        add = "+",
        sub = "-",
        mul = "*",
        div = "/",
        pow = "^",
        dot = "·",
        cross = "⨯",
    }
    local operator = operators[expr.kind]
    if operator then
        return "(" .. symbolic_render(expr.left) .. " " .. operator .. " " .. symbolic_render(expr.right) .. ")"
    end

    error("math.symbolic_format: unsupported symbolic node " .. tostring(expr.kind))
end

local function symbolic_is_const(expr, value)
    return is_symbolic(expr) and expr.kind == "const" and (value == nil or expr.value == value)
end

local function symbolic_contains(expr, variable)
    expr = symbolic_from(expr, "math.symbolic_contains")
    if expr.kind == "var" then
        return expr.name == variable
    end
    if expr.kind == "const" then
        return false
    end
    if expr.kind == "neg" or expr.kind == "func" then
        return symbolic_contains(expr.value, variable)
    end
    return symbolic_contains(expr.left, variable) or symbolic_contains(expr.right, variable)
end

local function symbolic_simplify(expr)
    expr = symbolic_from(expr, "math.symbolic_simplify")
    if expr.kind == "const" or expr.kind == "var" then
        return expr
    end
    if expr.kind == "func" then
        return symbolic_function(expr.name, symbolic_simplify(expr.value))
    end
    if expr.kind == "neg" then
        local value = symbolic_simplify(expr.value)
        if symbolic_is_const(value) then
            return symbolic_const(-value.value)
        end
        if value.kind == "neg" then
            return symbolic_simplify(value.value)
        end
        return symbolic_unary("neg", value)
    end

    local left = symbolic_simplify(expr.left)
    local right = symbolic_simplify(expr.right)
    if symbolic_is_const(left) and symbolic_is_const(right) then
        if expr.kind == "add" then return symbolic_const(left.value + right.value, expr.dimensions) end
        if expr.kind == "sub" then return symbolic_const(left.value - right.value, expr.dimensions) end
        if expr.kind == "mul" then return symbolic_const(left.value * right.value, expr.dimensions) end
        if expr.kind == "div" then return symbolic_const(left.value / right.value, expr.dimensions) end
        if expr.kind == "pow" then return symbolic_const(left.value ^ right.value, expr.dimensions) end
    end

    if expr.kind == "add" then
        if symbolic_is_const(left, 0) then return right end
        if symbolic_is_const(right, 0) then return left end
    elseif expr.kind == "sub" then
        if symbolic_is_const(right, 0) then return left end
        if symbolic_is_const(left, 0) then return symbolic_simplify(symbolic_unary("neg", right)) end
    elseif expr.kind == "mul" then
        if symbolic_is_const(left, 0) or symbolic_is_const(right, 0) then return symbolic_const(0, expr.dimensions) end
        if symbolic_is_const(left, 1) then return right end
        if symbolic_is_const(right, 1) then return left end
        if symbolic_is_const(left, -1) then return symbolic_simplify(symbolic_unary("neg", right)) end
        if symbolic_is_const(right, -1) then return symbolic_simplify(symbolic_unary("neg", left)) end
        if left.kind == "neg" and right.kind == "neg" then
            return symbolic_simplify(symbolic_binary("mul", left.value, right.value))
        end
        if left.kind == "neg" then
            return symbolic_simplify(symbolic_unary("neg", symbolic_binary("mul", left.value, right)))
        end
        if right.kind == "neg" then
            return symbolic_simplify(symbolic_unary("neg", symbolic_binary("mul", left, right.value)))
        end
    elseif expr.kind == "div" then
        if symbolic_is_const(left, 0) then return symbolic_const(0, expr.dimensions) end
        if symbolic_is_const(right, 1) then return left end
        if symbolic_is_const(right, -1) then return symbolic_simplify(symbolic_unary("neg", left)) end
        if left.kind == "neg" and right.kind == "neg" then
            return symbolic_simplify(symbolic_binary("div", left.value, right.value))
        end
    elseif expr.kind == "pow" then
        if symbolic_is_const(right, 0) then return symbolic_const(1) end
        if symbolic_is_const(right, 1) then return left end
    end

    return symbolic_binary(expr.kind, left, right)
end

function symbolic_evaluate(expr, env)
    expr = symbolic_from(expr, "math.symbolic_evaluate")
    env = env or {}
    if type(env) ~= "table" then
        error("math.symbolic_evaluate: environment must be a table")
    end
    if expr.kind == "const" then return expr.value end
    if expr.kind == "var" then
        local value = env[expr.name]
        if value == nil then
            error("math.symbolic_evaluate: missing variable " .. expr.name)
        end
        return value
    end
    if expr.kind == "neg" then return -symbolic_evaluate(expr.value, env) end
    if expr.kind == "func" then
        error("math.symbolic_evaluate: cannot numerically evaluate " .. expr.name .. " without a callback")
    end

    local left = symbolic_evaluate(expr.left, env)
    local right = symbolic_evaluate(expr.right, env)
    if expr.kind == "add" then return left + right end
    if expr.kind == "sub" then return left - right end
    if expr.kind == "mul" then return left * right end
    if expr.kind == "div" then return left / right end
    if expr.kind == "pow" then return left ^ right end
    if expr.kind == "dot" then return _LS.math.dot(left, right) end
    if expr.kind == "cross" then return _LS.math.cross(left, right) end

    error("math.symbolic_evaluate: unsupported symbolic node " .. tostring(expr.kind))
end

local function symbolic_linear_parts(expr, variable)
    expr = symbolic_simplify(expr)
    if not symbolic_contains(expr, variable) then
        return symbolic_const(0), expr
    end
    if expr.kind == "var" and expr.name == variable then
        return symbolic_const(1), symbolic_const(0)
    end
    if expr.kind == "neg" then
        local coeff, constant = symbolic_linear_parts(expr.value, variable)
        return symbolic_simplify(symbolic_unary("neg", coeff)), symbolic_simplify(symbolic_unary("neg", constant))
    end
    if expr.kind == "add" or expr.kind == "sub" then
        local left_coeff, left_const = symbolic_linear_parts(expr.left, variable)
        local right_coeff, right_const = symbolic_linear_parts(expr.right, variable)
        if expr.kind == "add" then
            return symbolic_simplify(symbolic_binary("add", left_coeff, right_coeff)),
                symbolic_simplify(symbolic_binary("add", left_const, right_const))
        end
        return symbolic_simplify(symbolic_binary("sub", left_coeff, right_coeff)),
            symbolic_simplify(symbolic_binary("sub", left_const, right_const))
    end
    if expr.kind == "mul" then
        local left_has = symbolic_contains(expr.left, variable)
        local right_has = symbolic_contains(expr.right, variable)
        if left_has and right_has then
            error("math.solve_linear: nonlinear term for variable " .. variable)
        end
        if left_has then
            local coeff, constant = symbolic_linear_parts(expr.left, variable)
            return symbolic_simplify(symbolic_binary("mul", coeff, expr.right)),
                symbolic_simplify(symbolic_binary("mul", constant, expr.right))
        end
        local coeff, constant = symbolic_linear_parts(expr.right, variable)
        return symbolic_simplify(symbolic_binary("mul", coeff, expr.left)),
            symbolic_simplify(symbolic_binary("mul", constant, expr.left))
    end
    if expr.kind == "div" then
        if symbolic_contains(expr.right, variable) then
            error("math.solve_linear: variable in denominator is nonlinear for " .. variable)
        end
        local coeff, constant = symbolic_linear_parts(expr.left, variable)
        return symbolic_simplify(symbolic_binary("div", coeff, expr.right)),
            symbolic_simplify(symbolic_binary("div", constant, expr.right))
    end

    error("math.solve_linear: unsupported nonlinear symbolic form " .. symbolic_render(expr))
end

function _LS.math.sym(name, dimensions)
    return symbolic_var(name, dimensions)
end

function _LS.math.symbol(name, dimensions)
    return symbolic_var(name, dimensions)
end

function _LS.math.symbolic(value)
    return symbolic_from(value, "math.symbolic")
end

function _LS.math.symbolic_format(value)
    if is_equation(value) then
        return symbolic_render(value.lhs) .. " = " .. symbolic_render(value.rhs)
    end
    if type(value) == "table" and value.__ls_formula == true then
        return value.name .. ": " .. tostring(value.equation)
    end
    return symbolic_render(value)
end

function _LS.math.symbolic_simplify(value)
    return symbolic_simplify(value)
end

function _LS.math.symbolic_evaluate(value, env)
    return symbolic_evaluate(value, env)
end

local function symbolic_substitute(expr, replacements)
    expr = symbolic_from(expr, "math.symbolic_substitute")
    if type(replacements) ~= "table" then
        error("math.symbolic_substitute: replacements must be a table")
    end
    if expr.kind == "const" then
        return expr
    end
    if expr.kind == "var" then
        local replacement = replacements[expr.name]
        if replacement == nil then
            return expr
        end
        local next_expr
        if type(replacement) == "number" then
            next_expr = symbolic_const(replacement, expr.dimensions)
        else
            next_expr = symbolic_from(replacement, "math.symbolic_substitute replacement")
        end
        if not same_dimensions(next_expr.dimensions, expr.dimensions) then
            error(
                "math.symbolic_substitute: replacement for " .. expr.name .. " has dimensions " ..
                format_dimensions(next_expr.dimensions) .. ", expected " .. format_dimensions(expr.dimensions)
            )
        end
        return next_expr
    end
    if expr.kind == "neg" then
        return symbolic_simplify(symbolic_unary("neg", symbolic_substitute(expr.value, replacements)))
    end
    if expr.kind == "func" then
        return symbolic_function(expr.name, symbolic_substitute(expr.value, replacements), expr.dimensions)
    end
    return symbolic_simplify(symbolic_binary(
        expr.kind,
        symbolic_substitute(expr.left, replacements),
        symbolic_substitute(expr.right, replacements)
    ))
end

local function symbolic_derivative(expr, variable)
    expr = symbolic_from(expr, "math.symbolic_derivative")
    if expr.kind == "const" then
        return symbolic_const(0)
    end
    if expr.kind == "var" then
        return symbolic_const(expr.name == variable and 1 or 0)
    end
    if expr.kind == "neg" then
        return symbolic_simplify(symbolic_unary("neg", symbolic_derivative(expr.value, variable)))
    end
    if expr.kind == "add" then
        return symbolic_simplify(symbolic_binary(
            "add",
            symbolic_derivative(expr.left, variable),
            symbolic_derivative(expr.right, variable)
        ))
    end
    if expr.kind == "sub" then
        return symbolic_simplify(symbolic_binary(
            "sub",
            symbolic_derivative(expr.left, variable),
            symbolic_derivative(expr.right, variable)
        ))
    end
    if expr.kind == "mul" then
        local left_term = symbolic_simplify(symbolic_binary("mul", symbolic_derivative(expr.left, variable), expr.right))
        local right_term = symbolic_simplify(symbolic_binary("mul", expr.left, symbolic_derivative(expr.right, variable)))
        return symbolic_simplify(symbolic_binary("add", left_term, right_term))
    end
    if expr.kind == "div" then
        local left_term = symbolic_simplify(symbolic_binary("mul", symbolic_derivative(expr.left, variable), expr.right))
        local right_term = symbolic_simplify(symbolic_binary("mul", expr.left, symbolic_derivative(expr.right, variable)))
        local numerator = symbolic_binary(
            "sub",
            left_term,
            right_term
        )
        local denominator = symbolic_binary("pow", expr.right, symbolic_const(2))
        return symbolic_simplify(symbolic_binary("div", numerator, denominator))
    end
    if expr.kind == "pow" then
        if expr.right.kind ~= "const" then
            error("math.symbolic_derivative: non-constant exponents are not supported")
        end
        local exponent = expr.right.value
        return symbolic_simplify(symbolic_binary(
            "mul",
            symbolic_binary("mul", symbolic_const(exponent), symbolic_binary("pow", expr.left, symbolic_const(exponent - 1))),
            symbolic_derivative(expr.left, variable)
        ))
    end
    if expr.kind == "func" then
        local inner_derivative = symbolic_derivative(expr.value, variable)
        if expr.name == "sin" then
            return symbolic_simplify(symbolic_binary("mul", symbolic_intrinsic("cos", expr.value), inner_derivative))
        end
        if expr.name == "cos" then
            return symbolic_simplify(symbolic_unary(
                "neg",
                symbolic_binary("mul", symbolic_intrinsic("sin", expr.value), inner_derivative)
            ))
        end
        if expr.name == "exp" then
            return symbolic_simplify(symbolic_binary("mul", symbolic_intrinsic("exp", expr.value), inner_derivative))
        end
        if expr.name == "log" then
            return symbolic_simplify(symbolic_binary("div", inner_derivative, expr.value))
        end
        error("math.symbolic_derivative: unsupported function " .. expr.name)
    end
    error("math.symbolic_derivative: unsupported symbolic node " .. tostring(expr.kind))
end

function _LS.math.symbolic_substitute(value, replacements)
    return symbolic_substitute(value, replacements)
end

function _LS.math.symbolic_derivative(value, variable)
    if type(variable) ~= "string" or variable == "" then
        error("math.symbolic_derivative: variable must be a non-empty string")
    end
    return symbolic_derivative(value, variable)
end

function _LS.math.symbolic_func(name, value, dimensions)
    if type(name) ~= "string" or name == "" then
        error("math.symbolic_func: name must be a non-empty string")
    end
    return symbolic_function(name, value, dimensions)
end

function _LS.math.symbolic_sin(value)
    return symbolic_intrinsic("sin", value)
end

function _LS.math.symbolic_cos(value)
    return symbolic_intrinsic("cos", value)
end

function _LS.math.symbolic_exp(value)
    return symbolic_intrinsic("exp", value)
end

function _LS.math.symbolic_log(value)
    return symbolic_intrinsic("log", value)
end

function _LS.math.symbolic_dot(left, right)
    return symbolic_binary("dot", left, right)
end

function _LS.math.symbolic_cross(left, right)
    return symbolic_binary("cross", left, right)
end

function _LS.math.symbolic_gradient(value)
    return symbolic_function("grad", value)
end

function _LS.math.symbolic_divergence(value)
    return symbolic_function("div", value)
end

function _LS.math.symbolic_curl(value)
    return symbolic_function("curl", value)
end

function _LS.math.equation(left, right)
    local lhs = symbolic_from(left, "math.equation lhs")
    local rhs = symbolic_from(right, "math.equation rhs")
    if not same_dimensions(lhs.dimensions, rhs.dimensions) then
        error(
            "math.equation: incompatible dimensions: " ..
            format_dimensions(lhs.dimensions) .. " vs " .. format_dimensions(rhs.dimensions)
        )
    end
    return setmetatable({
        __ls_equation = true,
        lhs = lhs,
        rhs = rhs,
    }, equation_metatable)
end

function _LS.math.solve_linear(equation, variable)
    if not is_equation(equation) then
        error("math.solve_linear: expected equation")
    end
    if type(variable) ~= "string" or variable == "" then
        error("math.solve_linear: variable must be a non-empty string")
    end
    local residual = symbolic_simplify(symbolic_binary("sub", equation.rhs, equation.lhs))
    local coeff, constant = symbolic_linear_parts(residual, variable)
    if symbolic_is_const(coeff, 0) then
        error("math.solve_linear: equation has no linear coefficient for " .. variable)
    end
    return symbolic_simplify(symbolic_binary("div", symbolic_unary("neg", constant), coeff))
end

function _LS.math.symbolic_solve_linear(equation, variable)
    return _LS.math.solve_linear(equation, variable)
end

local function ensure_symbolic_variables(variables, context)
    if type(variables) ~= "table" then
        error(context .. ": variables must be an array of names")
    end
    local result = {}
    for index, variable in ipairs(variables) do
        if type(variable) ~= "string" or variable == "" then
            error(context .. ": variable at index " .. tostring(index) .. " must be a non-empty string")
        end
        result[#result + 1] = variable
    end
    if #result == 0 then
        error(context .. ": at least one variable is required")
    end
    return result
end

local function symbolic_contains_any(expr, variables)
    for _, variable in ipairs(variables) do
        if symbolic_contains(expr, variable) then
            return variable
        end
    end
    return nil
end

local function symbolic_linear_coefficients(equation, variables)
    if not is_equation(equation) then
        error("math.solve_linear_system: expected equation")
    end
    local residual = symbolic_simplify(symbolic_binary("sub", equation.rhs, equation.lhs))
    local coeffs = {}
    local remainder = residual
    for _, variable in ipairs(variables) do
        local coeff, constant = symbolic_linear_parts(remainder, variable)
        coeff = symbolic_simplify(coeff)
        local leaked = symbolic_contains_any(coeff, variables)
        if leaked then
            error("math.solve_linear_system: nonlinear coefficient contains " .. leaked)
        end
        coeffs[#coeffs + 1] = coeff
        remainder = symbolic_simplify(constant)
    end
    local leaked = symbolic_contains_any(remainder, variables)
    if leaked then
        error("math.solve_linear_system: unsupported nonlinear remainder contains " .. leaked)
    end
    return coeffs, remainder
end

local function symbolic_solution_new(variables, values)
    local map = {}
    for index, variable in ipairs(variables) do
        map[variable] = symbolic_simplify(values[index])
    end
    return setmetatable({
        __ls_solution = true,
        variables = variables,
        values = map,
    }, solution_metatable)
end

function _LS.math.solve_linear_system(equations, variables)
    if type(equations) ~= "table" then
        error("math.solve_linear_system: equations must be an array")
    end
    local names = ensure_symbolic_variables(variables, "math.solve_linear_system")
    if #equations ~= #names then
        error("math.solve_linear_system: expected one equation per variable")
    end

    local matrix = {}
    for row, equation in ipairs(equations) do
        local coeffs, constant = symbolic_linear_coefficients(equation, names)
        matrix[row] = {}
        for column, coeff in ipairs(coeffs) do
            matrix[row][column] = coeff
        end
        matrix[row][#names + 1] = symbolic_simplify(symbolic_unary("neg", constant))
    end

    local size = #names
    for column = 1, size do
        local pivot_row = nil
        for row = column, size do
            if not symbolic_is_const(symbolic_simplify(matrix[row][column]), 0) then
                pivot_row = row
                break
            end
        end
        if not pivot_row then
            error("math.solve_linear_system: singular or underdetermined system at " .. names[column])
        end
        if pivot_row ~= column then
            matrix[column], matrix[pivot_row] = matrix[pivot_row], matrix[column]
        end

        local pivot = symbolic_simplify(matrix[column][column])
        for row = column + 1, size do
            local factor = symbolic_simplify(symbolic_binary("div", matrix[row][column], pivot))
            if not symbolic_is_const(factor, 0) then
                for item = column, size + 1 do
                    if not symbolic_is_const(symbolic_simplify(matrix[column][item]), 0) then
                        matrix[row][item] = symbolic_simplify(
                            symbolic_binary("sub", matrix[row][item], symbolic_binary("mul", factor, matrix[column][item]))
                        )
                    end
                end
            end
        end
    end

    local values = {}
    for row = size, 1, -1 do
        local rhs = matrix[row][size + 1]
        for column = row + 1, size do
            if not symbolic_is_const(symbolic_simplify(matrix[row][column]), 0) then
                rhs = symbolic_simplify(symbolic_binary("sub", rhs, symbolic_binary("mul", matrix[row][column], values[column])))
            end
        end
        values[row] = symbolic_simplify(symbolic_binary("div", rhs, matrix[row][row]))
    end
    return symbolic_solution_new(names, values)
end

function _LS.math.solution_get(solution, variable)
    if type(solution) ~= "table" or solution.__ls_solution ~= true then
        error("math.solution_get: expected linear-system solution")
    end
    if type(variable) ~= "string" or variable == "" then
        error("math.solution_get: variable must be a non-empty string")
    end
    local value = solution.values[variable]
    if value == nil then
        error("math.solution_get: unknown solution variable " .. variable)
    end
    return value
end

function _LS.math.solution_format(solution, variables)
    if type(solution) ~= "table" or solution.__ls_solution ~= true then
        error("math.solution_format: expected linear-system solution")
    end
    local names = variables and ensure_symbolic_variables(variables, "math.solution_format") or solution.variables
    local parts = {}
    for _, variable in ipairs(names) do
        parts[#parts + 1] = variable .. " = " .. symbolic_render(_LS.math.solution_get(solution, variable))
    end
    return table.concat(parts, "; ")
end

function _LS.math.symbolic_dimensions(value)
    if is_quantity(value) then
        return copy_dimensions(value.dimensions)
    end
    return symbolic_dimension_of(value)
end

function _LS.math.symbolic_dimension_format(value)
    if is_quantity(value) then
        return format_dimensions(value.dimensions)
    end
    if is_symbolic(value) then
        return format_dimensions(value.dimensions)
    end
    if type(value) == "table" then
        return format_dimensions(value)
    end
    error("math.symbolic_dimension_format: expected symbolic expression, quantity, or dimension table")
end

function _LS.math.symbolic_assert_dimensions(value, expected)
    local actual_dimensions = _LS.math.symbolic_dimensions(value)
    local expected_dimensions = is_quantity(expected) and expected.dimensions or copy_dimensions(expected)
    if not same_dimensions(actual_dimensions, expected_dimensions) then
        error(
            "math.symbolic_assert_dimensions: expected " .. format_dimensions(expected_dimensions) ..
            ", got " .. format_dimensions(actual_dimensions)
        )
    end
    return value
end

local physics_dimension_factories = {
    time = function() return _LS.math.unit_dimensions(_LS.math.seconds(1)) end,
    length = function() return _LS.math.unit_dimensions(_LS.math.meters(1)) end,
    voltage = function() return _LS.math.unit_dimensions(_LS.math.volts(1)) end,
    current = function() return _LS.math.unit_dimensions(_LS.math.amps(1)) end,
    resistance = function() return _LS.math.unit_dimensions(_LS.math.ohms(1)) end,
    capacitance = function() return _LS.math.unit_dimensions(_LS.math.farads(1)) end,
    inductance = function() return _LS.math.unit_dimensions(_LS.math.henries(1)) end,
    frequency = function() return { s = -1 } end,
    angular_frequency = function() return { s = -1 } end,
    power = function() return _LS.math.unit_dimensions(_LS.math.watts(1)) end,
    force = function() return _LS.math.unit_dimensions(_LS.math.newtons(1)) end,
    charge = function() return _LS.math.unit_dimensions(_LS.math.coulombs(1)) end,
    magnetic_flux_density = function() return _LS.math.unit_dimensions(_LS.math.teslas(1)) end,
}

function _LS.math.physics_dimensions(name)
    if type(name) ~= "string" or name == "" then
        error("math.physics_dimensions: name must be a non-empty string")
    end
    local factory = physics_dimension_factories[name]
    if not factory then
        error("math.physics_dimensions: unknown dimensions " .. name)
    end
    return factory()
end

function _LS.math.symbolic_impedance_R(resistance)
    return symbolic_from(resistance, "math.symbolic_impedance_R")
end

function _LS.math.symbolic_impedance_L(s, inductance)
    return symbolic_simplify(symbolic_binary("mul", s, inductance))
end

function _LS.math.symbolic_impedance_C(s, capacitance)
    return symbolic_simplify(symbolic_binary("div", 1, symbolic_binary("mul", s, capacitance)))
end

function _LS.math.symbolic_voltage_divider(top, bottom)
    return symbolic_simplify(symbolic_binary("div", bottom, symbolic_binary("add", top, bottom)))
end

function _LS.math.rc_lowpass_transfer(s, resistance, capacitance)
    local tau = symbolic_simplify(symbolic_binary("mul", symbolic_binary("mul", s, resistance), capacitance))
    return symbolic_simplify(symbolic_binary("div", 1, symbolic_binary("add", 1, tau)))
end

function _LS.math.rc_highpass_transfer(s, resistance, capacitance)
    local tau = symbolic_simplify(symbolic_binary("mul", symbolic_binary("mul", s, resistance), capacitance))
    return symbolic_simplify(symbolic_binary("div", tau, symbolic_binary("add", 1, tau)))
end

function _LS.math.rl_lowpass_transfer(s, inductance, resistance)
    local z_l = _LS.math.symbolic_impedance_L(s, inductance)
    return symbolic_simplify(symbolic_binary("div", resistance, symbolic_binary("add", resistance, z_l)))
end

function _LS.math.rl_highpass_transfer(s, inductance, resistance)
    local z_l = _LS.math.symbolic_impedance_L(s, inductance)
    return symbolic_simplify(symbolic_binary("div", z_l, symbolic_binary("add", resistance, z_l)))
end

function _LS.math.rlc_series_impedance(s, resistance, inductance, capacitance)
    local z_r = _LS.math.symbolic_impedance_R(resistance)
    local z_l = _LS.math.symbolic_impedance_L(s, inductance)
    local z_c = _LS.math.symbolic_impedance_C(s, capacitance)
    return symbolic_simplify(symbolic_binary("add", symbolic_binary("add", z_r, z_l), z_c))
end

symbolic_metatable.__add = function(left, right) return symbolic_simplify(symbolic_binary("add", left, right)) end
symbolic_metatable.__sub = function(left, right) return symbolic_simplify(symbolic_binary("sub", left, right)) end
symbolic_metatable.__mul = function(left, right) return symbolic_simplify(symbolic_binary("mul", left, right)) end
symbolic_metatable.__div = function(left, right) return symbolic_simplify(symbolic_binary("div", left, right)) end
symbolic_metatable.__pow = function(left, right) return symbolic_simplify(symbolic_binary("pow", left, right)) end
symbolic_metatable.__unm = function(value) return symbolic_simplify(symbolic_unary("neg", value)) end
symbolic_metatable.__tostring = function(value) return symbolic_render(value) end

equation_metatable.__tostring = function(value)
    return symbolic_render(value.lhs) .. " = " .. symbolic_render(value.rhs)
end

solution_metatable.__tostring = function(value)
    return _LS.math.solution_format(value)
end

local physics_formula_factories = {}

physics_formula_factories.newton2 = function()
    return _LS.math.equation(_LS.math.sym("F"), _LS.math.sym("m") * _LS.math.sym("a"))
end

physics_formula_factories.ohm = function()
    return _LS.math.equation(_LS.math.sym("V"), _LS.math.sym("I") * _LS.math.sym("R"))
end

physics_formula_factories.electric_power = function()
    return _LS.math.equation(_LS.math.sym("P"), _LS.math.sym("V") * _LS.math.sym("I"))
end

physics_formula_factories.coulomb_force = function()
    return _LS.math.equation(
        _LS.math.sym("F"),
        (_LS.math.sym("k") * _LS.math.sym("q1") * _LS.math.sym("q2")) / (_LS.math.sym("r") ^ 2)
    )
end

physics_formula_factories.lorentz_force = function()
    return _LS.math.equation(
        _LS.math.sym("F"),
        _LS.math.sym("q") * (_LS.math.sym("E") + _LS.math.symbolic_cross(_LS.math.sym("v"), _LS.math.sym("B")))
    )
end

physics_formula_factories.poynting = function()
    return _LS.math.equation(_LS.math.sym("S"), _LS.math.symbolic_cross(_LS.math.sym("E"), _LS.math.sym("H")))
end

physics_formula_factories.gauss_electric = function()
    return _LS.math.equation(_LS.math.symbolic_divergence(_LS.math.sym("E")), _LS.math.sym("rho") / _LS.math.sym("epsilon0"))
end

physics_formula_factories.faraday = function()
    return _LS.math.equation(_LS.math.symbolic_curl(_LS.math.sym("E")), -_LS.math.sym("dB_dt"))
end

physics_formula_factories.ampere_maxwell = function()
    return _LS.math.equation(
        _LS.math.symbolic_curl(_LS.math.sym("B")),
        _LS.math.sym("mu0") * (_LS.math.sym("J") + (_LS.math.sym("epsilon0") * _LS.math.sym("dE_dt")))
    )
end

function _LS.math.physics_formula(name)
    if type(name) ~= "string" or name == "" then
        error("math.physics_formula: name must be a non-empty string")
    end
    local factory = physics_formula_factories[name]
    if not factory then
        error("math.physics_formula: unknown formula " .. name)
    end
    return setmetatable({
        __ls_formula = true,
        name = name,
        equation = factory(),
    }, formula_metatable)
end

function _LS.math.formula_name(formula)
    if type(formula) ~= "table" or formula.__ls_formula ~= true then
        error("math.formula_name: expected physics formula")
    end
    return formula.name
end

function _LS.math.formula_equation(formula)
    if type(formula) ~= "table" or formula.__ls_formula ~= true then
        error("math.formula_equation: expected physics formula")
    end
    return formula.equation
end

function _LS.math.formula_lhs(formula)
    return _LS.math.formula_equation(formula).lhs
end

function _LS.math.formula_rhs(formula)
    return _LS.math.formula_equation(formula).rhs
end

function _LS.math.formula_render(formula)
    return tostring(_LS.math.formula_equation(formula))
end

formula_metatable.__tostring = function(value)
    return value.name .. ": " .. tostring(value.equation)
end

-- ============================================================================
-- ARRAY OPERATIONS (FIXED: Properly Connected)
-- ============================================================================

-- Create enhanced array with metatable for method chaining
function _LS.array(data)
    data = data or {}
    return setmetatable(data, _LS.metatables.Array)
end

function _LS.range(start_value, end_value, step)
    if type(start_value) ~= "number" or type(end_value) ~= "number" then
        error("range bounds must be numbers")
    end

    if step == nil then
        step = start_value <= end_value and 1 or -1
    end
    if type(step) ~= "number" then
        error("range step must be a number")
    end
    if step == 0 then
        error("range step cannot be zero")
    end

    local result = {}
    for value = start_value, end_value, step do
        result[#result + 1] = value
    end
    return _LS.array(result)
end

function _LS.limit_direction(variable, target)
    return { variable = variable, target = target }
end

function _LS.limit(callback, variable, target)
    if type(callback) ~= "function" then
        error("limit expects a function")
    end

    local sample = target
    if target == math.huge then
        sample = 1000000
    elseif target == -math.huge then
        sample = -1000000
    end

    return callback(sample)
end

function _LS.compose(f, g)
    if type(f) ~= "function" or type(g) ~= "function" then
        error("compose expects two functions")
    end
    return function(...)
        return f(g(...))
    end
end

function _LS.binary_compose(f, g)
    if type(f) ~= "function" or type(g) ~= "function" then
        error("binary compose expects two functions")
    end
    return function(value)
        return f(value, g(value))
    end
end

-- Core collection functions (FIXED: These are what the transpiler calls)
function _LS.map(array, callback)
    local result = {}
    for i = 1, #array do
        -- JavaScript-style callback: callback(element, index, array)
        local item = array[i]
        local info = debug and debug.getinfo and debug.getinfo(callback, "u") or nil
        if type(item) == "table" and info and info.nparams and info.nparams > 1 and info.nparams <= #item then
            result[i] = callback(table_unpack(item, 1, info.nparams))
        else
            result[i] = callback(item, i - 1, array)
        end
    end
    return _LS.array(result)
end

function _LS.map_indexed(array, callback)
    local result = {}
    for i = 1, #array do
        result[i] = callback(array[i], i - 1, array)
    end
    return _LS.array(result)
end

local function dft(signal, inverse)
    local n = #signal
    local result = {}
    if n == 0 then
        return _LS.array(result)
    end

    local direction = inverse and 1 or -1
    for k = 0, n - 1 do
        local sum = _LS.complex(0, 0)
        for t = 0, n - 1 do
            local angle = direction * 2 * math.pi * k * t / n
            local twiddle = _LS.complex(math.cos(angle), math.sin(angle))
            sum = sum + ((signal[t + 1] or 0) * twiddle)
        end
        if inverse then
            sum = sum / n
        end
        result[k + 1] = real_if_close(sum)
    end

    return _LS.array(result)
end

function _LS.fft(signal)
    return dft(signal or {}, false)
end

function _LS.inverse_fft(spectrum)
    return dft(spectrum or {}, true)
end

function _LS.filter(array, predicate)
    local result = {}
    local count = 0
    for i = 1, #array do
        local item = array[i]
        local info = debug and debug.getinfo and debug.getinfo(predicate, "u") or nil
        local keep
        if type(item) == "table" and info and info.nparams and info.nparams > 1 and info.nparams <= #item then
            keep = predicate(table_unpack(item, 1, info.nparams))
        else
            keep = predicate(item, i - 1, array)
        end
        if keep then
            count = count + 1
            result[count] = item
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

function _LS.keys(value)
    local result = {}
    if type(value) ~= "table" then
        return _LS.array(result)
    end
    for key, _ in pairs(value) do
        result[#result + 1] = key
    end
    return _LS.array(result)
end

function _LS.dict(pairs_array)
    local result = {}
    for i = 1, #(pairs_array or {}) do
        local pair = pairs_array[i]
        if type(pair) == "table" then
            result[pair[1]] = pair[2]
        end
    end
    return result
end

function _LS.iterate_until(step, initial_value, predicate, max_iterations)
    if type(step) ~= "function" or type(predicate) ~= "function" then
        error("iterate_until expects step and predicate functions")
    end
    local value = initial_value
    local limit = max_iterations or 10000
    for _ = 1, limit do
        if predicate(value) then
            return value
        end
        value = step(value)
    end
    return value
end

function _LS.random_normal(mean, standard_deviation)
    mean = mean or 0
    standard_deviation = standard_deviation or 1
    local u1 = math.random()
    local u2 = math.random()
    if u1 <= 0 then
        u1 = 1e-12
    end
    local z0 = math.sqrt(-2 * math.log(u1)) * math.cos(2 * math.pi * u2)
    return mean + z0 * standard_deviation
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
    local start_index = (start or 0) + 1  -- Convert to 1-based

    if type(array) == "string" then
        local string_end = end_index or #array
        return string.sub(array, start_index, math.min(string_end, #array))
    end

    local final_index = end_index and (end_index + 1) or (#array + 1)
    local result = {}
    for i = start_index, math.min(final_index - 1, #array) do
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

-- ==========================================================================
-- RANGE ITERATION SUPPORT
-- ==========================================================================

-- Iterate over a numeric range, invoking the callback for each value.
-- Lua's for-loop semantics already handle positive or negative step values,
-- so we can rely on a single loop without branching on the step sign.
function _LS.iterate_range(start_value, end_value, step, callback)
    if type(callback) ~= 'function' then
        error('callback must be a function')
    end
    for value = start_value, end_value, step do
        callback(value)
    end
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
    
    return string.format(format_str, table_unpack(args))
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
        local max_val = math.max(table_unpack(vector))
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
