-- LUASCRIPT Runtime Library
-- Provides JavaScript-compatible functions for Lua environment
-- Phase 1B: Critical runtime compatibility fixes
local runtime = {}
-- Console object for JavaScript compatibility
runtime.console = {}
function runtime.console.log(...)
    local args = {...}
    local output = {}
    for i, v in ipairs(args) do
        if type(v) == "table" then
            output[i] = runtime.JSON.stringify(v)
        elseif type(v) == "nil" then
            output[i] = "nil"
        elseif type(v) == "boolean" then
            output[i] = tostring(v)
        else
            output[i] = tostring(v)
        end
    end
    print(table.concat(output, " "))
end
function runtime.console.error(...)
    io.stderr:write("ERROR: ")
    runtime.console.log(...)
end
function runtime.console.warn(...)
    io.stderr:write("WARNING: ")
    runtime.console.log(...)
end
function runtime.console.info(...)
    io.stderr:write("INFO: ")
    runtime.console.log(...)
end
-- JSON object for JavaScript compatibility
runtime.JSON = {}
function runtime.JSON.stringify(obj, indent)
    local function serialize(o, level)
        level = level or 0
        local indent_str = indent and string.rep("  ", level) or ""
        local next_indent_str = indent and string.rep("  ", level + 1) or ""
        if type(o) == "nil" then
            return "null"
        elseif type(o) == "boolean" then
            return tostring(o)
        elseif type(o) == "number" then
            return tostring(o)
        elseif type(o) == "string" then
            return '"' .. o:gsub('"', '\\"') .. '"'
        elseif type(o) == "table" then
            local is_array = true
            local max_index = 0
            -- Check if table is array-like
            for k, _ in pairs(o) do
                if type(k) ~= "number" or k <= 0 or k ~= math.floor(k) then
                    is_array = false
                    break
                end
                max_index = math.max(max_index, k)
            end
            if is_array then
                local arr = {}
                for i = 1, max_index do
                    arr[i] = serialize(o[i], level + 1)
                end
                if indent then
                    return "[\n" .. next_indent_str ..
                           table.concat(arr, ",\n" .. next_indent_str) ..
                           "\n" .. indent_str .. "]"
                else
                    return "[" .. table.concat(arr, ",") .. "]"
                end
            else
                local obj_parts = {}
                for k, v in pairs(o) do
                    local key = type(k) == "string" and ('"' .. k .. '"') or tostring(k)
                    table.insert(obj_parts, key .. ":" .. (indent and " " or "") .. serialize(v, level + 1))
                end
                if indent then
                    return "{\n" .. next_indent_str ..
                           table.concat(obj_parts, ",\n" .. next_indent_str) ..
                           "\n" .. indent_str .. "}"
                else
                    return "{" .. table.concat(obj_parts, ",") .. "}"
                end
            end
        else
            return '"' .. tostring(o) .. '"'
        end
    end
    return serialize(obj)
end
function runtime.JSON.parse(json_str)
    -- Simple JSON parser (basic implementation)
    -- For production use, consider using a proper JSON library
    local function parse_value(str, pos)
        pos = pos or 1
        -- Skip whitespace
        while pos <= #str and str:sub(pos, pos):match("%s") do
            pos = pos + 1
        end
        if pos > #str then
            return nil, pos
        end
        local char = str:sub(pos, pos)
        if char == '"' then
            -- Parse string
            local end_pos = pos + 1
            while end_pos <= #str and str:sub(end_pos, end_pos) ~= '"' do
                if str:sub(end_pos, end_pos) == '\\' then
                    end_pos = end_pos + 2
                else
                    end_pos = end_pos + 1
                end
            end
            return str:sub(pos + 1, end_pos - 1), end_pos + 1
        elseif char == '{' then
            -- Parse object
            local obj = {}
            pos = pos + 1
            -- Skip whitespace
            while pos <= #str and str:sub(pos, pos):match("%s") do
                pos = pos + 1
            end
            if pos <= #str and str:sub(pos, pos) == '}' then
                return obj, pos + 1
            end
            while pos <= #str do
                local key, new_pos = parse_value(str, pos)
                pos = new_pos
                -- Skip whitespace and colon
                while pos <= #str and (str:sub(pos, pos):match("%s") or str:sub(pos, pos) == ':') do
                    pos = pos + 1
                end
                local value
                value, pos = parse_value(str, pos)
                obj[key] = value
                -- Skip whitespace
                while pos <= #str and str:sub(pos, pos):match("%s") do
                    pos = pos + 1
                end
                if pos <= #str and str:sub(pos, pos) == ',' then
                    pos = pos + 1
                elseif pos <= #str and str:sub(pos, pos) == '}' then
                    return obj, pos + 1
                else
                    break
                end
            end
            return obj, pos
        elseif char == '[' then
            -- Parse array
            local arr = {}
            pos = pos + 1
            local index = 1
            -- Skip whitespace
            while pos <= #str and str:sub(pos, pos):match("%s") do
                pos = pos + 1
            end
            if pos <= #str and str:sub(pos, pos) == ']' then
                return arr, pos + 1
            end
            while pos <= #str do
                local value
                value, pos = parse_value(str, pos)
                arr[index] = value
                index = index + 1
                -- Skip whitespace
                while pos <= #str and str:sub(pos, pos):match("%s") do
                    pos = pos + 1
                end
                if pos <= #str and str:sub(pos, pos) == ',' then
                    pos = pos + 1
                elseif pos <= #str and str:sub(pos, pos) == ']' then
                    return arr, pos + 1
                else
                    break
                end
            end
            return arr, pos
        elseif char:match("[%d%-]") then
            -- Parse number
            local end_pos = pos
            while end_pos <= #str and str:sub(end_pos, end_pos):match("[%d%.%-eE+]") do
                end_pos = end_pos + 1
            end
            return tonumber(str:sub(pos, end_pos - 1)), end_pos
        elseif str:sub(pos, pos + 3) == "true" then
            return true, pos + 4
        elseif str:sub(pos, pos + 4) == "false" then
            return false, pos + 5
        elseif str:sub(pos, pos + 3) == "null" then
            return nil, pos + 4
        end
        return nil, pos
    end
    local result, _ = parse_value(json_str)
    return result
end
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

local function create_summation_impl()
    return function(...)
        local args = pack_arguments(...)
        if args.n == 0 then
            error("math.summation: expected at least one argument")
        end

        local first = args[1]

        if type(first) == "table" then
            -- Summation over a collection
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

        -- Product over a collection
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

        -- Numerical integration over discrete points using the trapezoidal rule
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

local summation_impl = create_summation_impl()
local product_impl = create_product_impl()
local integral_impl = create_integral_impl()

if not math.summation then
    math.summation = summation_impl
end
if not math.product then
    math.product = product_impl
end
if not math.integral then
    math.integral = integral_impl
end

-- Math object for JavaScript compatibility
runtime.Math = {}
runtime.Math.PI = math.pi
runtime.Math.E = math.exp(1)
runtime.Math.summation = math.summation
runtime.Math.product = math.product
runtime.Math.integral = math.integral
function runtime.Math.abs(x)
    return math.abs(x)
end
function runtime.Math.ceil(x)
    return math.ceil(x)
end
function runtime.Math.floor(x)
    return math.floor(x)
end
function runtime.Math.max(...)
    return math.max(...)
end
function runtime.Math.min(...)
    return math.min(...)
end
function runtime.Math.pow(x, y)
    return math.pow(x, y)
end
function runtime.Math.random()
    return math.random()
end
function runtime.Math.round(x)
    return math.floor(x + 0.5)
end
function runtime.Math.sqrt(x)
    return math.sqrt(x)
end
-- String prototype methods
runtime.String = {}
function runtime.String.charAt(str, index)
    return str:sub(index + 1, index + 1)
end
function runtime.String.indexOf(str, searchValue, fromIndex)
    fromIndex = fromIndex or 0
    local pos = str:find(searchValue, fromIndex + 1, true)
    return pos and (pos - 1) or -1
end
function runtime.String.substring(str, start, stop)
    start = start or 0
    stop = stop or #str
    return str:sub(start + 1, stop)
end
function runtime.String.toLowerCase(str)
    return str:lower()
end
function runtime.String.toUpperCase(str)
    return str:upper()
end
-- Array prototype methods
runtime.Array = {}
function runtime.Array.push(arr, ...)
    local args = {...}
    for _, v in ipairs(args) do
        table.insert(arr, v)
    end
    return #arr
end
function runtime.Array.pop(arr)
    return table.remove(arr)
end
function runtime.Array.shift(arr)
    return table.remove(arr, 1)
end
function runtime.Array.unshift(arr, ...)
    local args = {...}
    for i = #args, 1, -1 do
        table.insert(arr, 1, args[i])
    end
    return #arr
end
function runtime.Array.join(arr, separator)
    separator = separator or ","
    return table.concat(arr, separator)
end
-- Global functions
function runtime.parseInt(str, radix)
    radix = radix or 10
    return tonumber(str, radix)
end
function runtime.parseFloat(str)
    return tonumber(str)
end
function runtime.isNaN(value)
    return value ~= value
end
function runtime.isFinite(value)
    return type(value) == "number" and value == value and value ~= math.huge and value ~= -math.huge
end
-- setTimeout and setInterval (basic implementation)
runtime.timers = {}
runtime.timer_id = 0
function runtime.setTimeout(callback, delay)
    runtime.timer_id = runtime.timer_id + 1
    local id = runtime.timer_id
    -- In a real implementation, this would use proper async timers
    -- For now, this is a placeholder
    runtime.timers[id] = {
        callback = callback,
        delay = delay,
        type = "timeout"
    }
    return id
end
function runtime.clearTimeout(id)
    runtime.timers[id] = nil
end
return runtime
