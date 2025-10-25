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
-- Math object for JavaScript compatibility
runtime.Math = {}
runtime.Math.PI = math.pi
runtime.Math.E = math.exp(1)
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

-- Extended Lua math helpers for Unicode operators
local function ensure_callback(callback, name)
    if type(callback) ~= "function" then
        error(name .. " expects a function as the first argument", 2)
    end
    return callback
end

local function normalize_step(lower, upper, step)
    if step == nil then
        if lower <= upper then
            return 1
        else
            return -1
        end
    end
    if step == 0 then
        error("step must not be zero", 2)
    end
    return step
end

if type(math.product) ~= "function" then
    function math.product(callback, lower, upper, step)
        callback = ensure_callback(callback, "math.product")
        if type(lower) ~= "number" or type(upper) ~= "number" then
            error("math.product expects numeric bounds", 2)
        end

        step = normalize_step(lower, upper, step)
        local result = 1

        if (step > 0 and lower > upper) or (step < 0 and lower < upper) then
            return result
        end

        for value = lower, upper, step do
            local term = callback(value)
            if type(term) ~= "number" then
                error("math.product callback must return a number", 2)
            end
            result = result * term
        end

        return result
    end
end

if type(math.summation) ~= "function" then
    function math.summation(callback, lower, upper, step)
        callback = ensure_callback(callback, "math.summation")
        if type(lower) ~= "number" or type(upper) ~= "number" then
            error("math.summation expects numeric bounds", 2)
        end

        step = normalize_step(lower, upper, step)
        local result = 0

        if (step > 0 and lower > upper) or (step < 0 and lower < upper) then
            return result
        end

        for value = lower, upper, step do
            local term = callback(value)
            if type(term) ~= "number" then
                error("math.summation callback must return a number", 2)
            end
            result = result + term
        end

        return result
    end
end

if type(math.integral) ~= "function" then
    function math.integral(callback, lower, upper, steps)
        callback = ensure_callback(callback, "math.integral")
        if type(lower) ~= "number" or type(upper) ~= "number" then
            error("math.integral expects numeric bounds", 2)
        end

        steps = steps or 1000
        if type(steps) ~= "number" or steps <= 0 then
            error("math.integral expects a positive number of steps", 2)
        end

        if lower == upper then
            return 0
        end

        local direction = lower < upper and 1 or -1
        local range = math.abs(upper - lower)
        local step_size = range / steps
        local start = lower
        local finish = upper

        if direction < 0 then
            start = upper
            finish = lower
        end

        local sum = 0
        -- Trapezoidal rule integration: evaluate at steps+1 points
        for i = 0, steps do
            local x = start + i * step_size * direction
            -- Ensure last point is exactly finish
            if (direction > 0 and x > finish) or (direction < 0 and x < finish) then
                x = finish
            end
            local value = callback(x)
            if type(value) ~= "number" then
                error("math.integral callback must return a number", 2)
            end
            if i == 0 or i == steps then
                sum = sum + value
            else
                sum = sum + 2 * value
            end
        end
        sum = sum * (step_size / 2)
        return sum * direction
    end
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
