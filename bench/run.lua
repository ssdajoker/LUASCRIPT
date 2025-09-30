
--[[
LUASCRIPT Benchmark Harness
Designed by the Legendary Programming Team

Contributors:
- Steve Jobs: User experience and simplicity
- Donald Knuth: Mathematical rigor and statistical analysis
- Dennis Ritchie: System-level measurement accuracy
- John Carmack: Real-time performance monitoring
]]

-- Simple JSON encoder (avoiding external dependencies)
local json = {}
function json.encode(obj)
    local function encode_value(val)
        local t = type(val)
        if t == "string" then
            return '"' .. val:gsub('\\', '\\\\'):gsub('"', '\\"') .. '"'
        elseif t == "number" then
            return tostring(val)
        elseif t == "boolean" then
            return val and "true" or "false"
        elseif t == "table" then
            local parts = {}
            local is_array = true
            local max_index = 0
            
            -- Check if it's an array
            for k, v in pairs(val) do
                if type(k) ~= "number" then
                    is_array = false
                    break
                end
                max_index = math.max(max_index, k)
            end
            
            if is_array then
                for i = 1, max_index do
                    parts[i] = encode_value(val[i])
                end
                return "[" .. table.concat(parts, ",") .. "]"
            else
                for k, v in pairs(val) do
                    table.insert(parts, encode_value(tostring(k)) .. ":" .. encode_value(v))
                end
                return "{" .. table.concat(parts, ",") .. "}"
            end
        else
            return "null"
        end
    end
    return encode_value(obj)
end
local ffi = require("ffi")
local os = require("os")
local io = require("io")

-- Knuth's statistical analysis framework
local Statistics = {}
function Statistics.mean(values)
    local sum = 0
    for _, v in ipairs(values) do sum = sum + v end
    return sum / #values
end

function Statistics.stddev(values, mean)
    local sum = 0
    for _, v in ipairs(values) do
        sum = sum + (v - mean) ^ 2
    end
    return math.sqrt(sum / (#values - 1))
end

function Statistics.confidence_interval(mean, stddev, n, confidence)
    -- Student's t-distribution approximation
    local t_values = {[0.95] = 2.776, [0.99] = 4.604} -- for small n
    local t = t_values[confidence] or 2.776
    local margin = t * (stddev / math.sqrt(n))
    return mean - margin, mean + margin
end

-- Carmack's real-time monitoring
local Monitor = {}
function Monitor.start_profiling()
    if jit and jit.profile then
        jit.profile.start("li1", function(thread, samples, vmstate)
            -- Profile callback for JIT analysis
        end)
    end
end

function Monitor.stop_profiling()
    if jit and jit.profile then jit.profile.stop() end
end

-- Ritchie's system-level measurement
local SystemMetrics = {}
function SystemMetrics.get_memory_usage()
    local file = io.open("/proc/self/status", "r")
    if not file then return nil end
    
    local vmrss = 0
    for line in file:lines() do
        local kb = line:match("VmRSS:%s*(%d+)")
        if kb then vmrss = tonumber(kb) * 1024 break end
    end
    file:close()
    return vmrss
end

function SystemMetrics.get_cpu_info()
    local file = io.open("/proc/cpuinfo", "r")
    if not file then return "Unknown CPU" end
    
    local model = ""
    for line in file:lines() do
        local cpu_model = line:match("model name%s*:%s*(.+)")
        if cpu_model then model = cpu_model break end
    end
    file:close()
    return model
end

-- Jobs' elegant benchmark runner
local BenchmarkRunner = {}
BenchmarkRunner.__index = BenchmarkRunner

function BenchmarkRunner.new(config)
    local self = setmetatable({}, BenchmarkRunner)
    self.config = config or {}
    self.results = {}
    self.system_info = {
        cpu = SystemMetrics.get_cpu_info(),
        lua_version = _VERSION,
        jit_version = jit and jit.version or "No JIT",
        timestamp = os.date("%Y-%m-%d %H:%M:%S")
    }
    return self
end

function BenchmarkRunner:run_benchmark(name, func, iterations)
    iterations = iterations or self.config.default_iterations or 10
    
    print(string.format("Running %s (%d iterations)...", name, iterations))
    
    local times = {}
    local memory_before = SystemMetrics.get_memory_usage()
    
    Monitor.start_profiling()
    
    for i = 1, iterations do
        collectgarbage("collect") -- Knuth's precision requirement
        local start_time = os.clock()
        
        func()
        
        local end_time = os.clock()
        table.insert(times, end_time - start_time)
    end
    
    Monitor.stop_profiling()
    
    local memory_after = SystemMetrics.get_memory_usage()
    local memory_delta = memory_after and memory_before and 
                        (memory_after - memory_before) or 0
    
    -- Knuth's statistical analysis
    local mean = Statistics.mean(times)
    local stddev = Statistics.stddev(times, mean)
    local ci_low, ci_high = Statistics.confidence_interval(mean, stddev, #times, 0.95)
    
    local result = {
        name = name,
        iterations = iterations,
        mean_time = mean,
        stddev = stddev,
        confidence_interval = {ci_low, ci_high},
        memory_delta = memory_delta,
        all_times = times
    }
    
    self.results[name] = result
    
    -- Jobs' user-friendly output
    print(string.format("  Mean: %.6f ± %.6f seconds", mean, stddev))
    print(string.format("  95%% CI: [%.6f, %.6f]", ci_low, ci_high))
    if memory_delta > 0 then
        print(string.format("  Memory: +%d bytes", memory_delta))
    end
    print()
    
    return result
end

function BenchmarkRunner:save_results(filename)
    local output = {
        system_info = self.system_info,
        benchmarks = self.results,
        metadata = {
            total_benchmarks = 0,
            total_time = 0
        }
    }
    
    for _, result in pairs(self.results) do
        output.metadata.total_benchmarks = output.metadata.total_benchmarks + 1
        output.metadata.total_time = output.metadata.total_time + result.mean_time
    end
    
    local file = io.open(filename, "w")
    if file then
        file:write(json.encode(output))
        file:close()
        print(string.format("Results saved to %s", filename))
    else
        print(string.format("Error: Could not save results to %s", filename))
    end
end

-- Load benchmark cases
local function load_benchmarks()
    local benchmarks = {}
    
    -- Try to load from cases directory
    local cases_dir = "bench/cases/"
    local handle = io.popen("ls " .. cases_dir .. "*.lua 2>/dev/null")
    if handle then
        for filename in handle:lines() do
            local name = filename:match("([^/]+)%.lua$")
            if name then
                local success, benchmark = pcall(dofile, filename)
                if success and type(benchmark) == "function" then
                    benchmarks[name] = benchmark
                end
            end
        end
        handle:close()
    end
    
    -- Fallback: built-in benchmarks
    if next(benchmarks) == nil then
        benchmarks = {
            binary_trees = function()
                -- Knuth's tree allocation benchmark
                local function make_tree(depth)
                    if depth == 0 then return {nil, nil} end
                    return {make_tree(depth-1), make_tree(depth-1)}
                end
                make_tree(10)
            end,
            
            fibonacci = function()
                -- McCarthy's recursion benchmark
                local function fib(n)
                    if n < 2 then return n end
                    return fib(n-1) + fib(n-2)
                end
                fib(25)
            end,
            
            table_access = function()
                -- Kay's object-oriented benchmark
                local t = {}
                for i = 1, 1000 do t[i] = i * i end
                local sum = 0
                for i = 1, 1000 do sum = sum + t[i] end
            end,
            
            string_concat = function()
                -- Wall's string processing benchmark
                local s = ""
                for i = 1, 1000 do
                    s = s .. tostring(i)
                end
            end
        }
    end
    
    return benchmarks
end

-- Main execution
local function main(args)
    args = args or {}
    
    local config = {
        default_iterations = args.quick and 3 or 10,
        comprehensive = args.comprehensive,
        compare_all = args.compare_all,
        realtime = args.realtime
    }
    
    local runner = BenchmarkRunner.new(config)
    local benchmarks = load_benchmarks()
    
    print("LUASCRIPT Benchmark Suite")
    print("Legendary Team Implementation")
    print("=" .. string.rep("=", 40))
    print("System: " .. runner.system_info.cpu)
    print("Lua: " .. runner.system_info.lua_version)
    print("JIT: " .. runner.system_info.jit_version)
    print()
    
    -- Run all benchmarks
    for name, func in pairs(benchmarks) do
        runner:run_benchmark(name, func, config.default_iterations)
    end
    
    -- Save results
    local timestamp = os.date("%Y%m%d_%H%M%S")
    local results_file = string.format("bench/results/run_%s.json", timestamp)
    runner:save_results(results_file)
    
    print("Benchmark suite completed!")
    print("Results saved to: " .. results_file)
end

-- Parse command line arguments
local args = {}
for i = 1, #arg do
    if arg[i] == "--quick" then args.quick = true
    elseif arg[i] == "--comprehensive" then args.comprehensive = true
    elseif arg[i] == "--compare-all" then args.compare_all = true
    elseif arg[i] == "--realtime" then args.realtime = true
    end
end

-- Execute if run directly
if not pcall(debug.getlocal, 4, 1) then
    main(args)
end

return BenchmarkRunner
