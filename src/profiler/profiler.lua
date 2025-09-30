
-- LUASCRIPT Performance Profiling Suite
-- Statistical Sampling with Flame Graph Generation
-- Steve Jobs: "You can't optimize what you can't measure"
-- Donald Knuth: "Measurement must be algorithmically sound and efficient"

local jit = require('jit')
local profile = require('jit.profile')
local ffi = require('ffi')

local M = {}

-- Profiler State Management
local profiler_state = {
    active = false,
    samples = {},
    start_time = 0,
    end_time = 0,
    sample_count = 0,
    zones = {},
    memory_tracking = false,
    memory_samples = {}
}

-- Memory Tracking FFI Declarations
ffi.cdef[[
    typedef struct {
        size_t total_allocated;
        size_t total_freed;
        size_t current_usage;
        size_t peak_usage;
        uint64_t allocation_count;
        uint64_t free_count;
    } memory_stats_t;
]]

-- Sample Data Structure
local function create_sample(thread, samples, vmstate)
    return {
        timestamp = os.clock(),
        thread = thread,
        samples = samples,
        vmstate = vmstate,
        stack = {},
        zone = profiler_state.current_zone or "default"
    }
end

-- Profiler Callback Function
local function profiler_callback(thread, samples, vmstate)
    if not profiler_state.active then return end
    
    profiler_state.sample_count = profiler_state.sample_count + 1
    local sample = create_sample(thread, samples, vmstate)
    
    -- Capture stack trace with minimal overhead
    local stack_depth = 0
    local info = debug.getinfo(2, "nSl")
    while info and stack_depth < 50 do -- Limit stack depth for performance
        table.insert(sample.stack, {
            name = info.name or "<anonymous>",
            source = info.source or "<unknown>",
            line = info.currentline or 0,
            what = info.what or "Lua"
        })
        stack_depth = stack_depth + 1
        info = debug.getinfo(stack_depth + 2, "nSl")
    end
    
    table.insert(profiler_state.samples, sample)
    
    -- Memory tracking if enabled
    if profiler_state.memory_tracking then
        local mem_usage = collectgarbage("count") * 1024 -- Convert KB to bytes
        table.insert(profiler_state.memory_samples, {
            timestamp = sample.timestamp,
            usage = mem_usage,
            zone = sample.zone
        })
    end
end

-- Zone Management for Categorized Profiling
M.Zone = {}
M.Zone.__index = M.Zone

function M.Zone.new(name)
    return setmetatable({
        name = name,
        start_time = 0,
        total_time = 0,
        call_count = 0
    }, M.Zone)
end

function M.zone_enter(zone_name)
    profiler_state.current_zone = zone_name
    if not profiler_state.zones[zone_name] then
        profiler_state.zones[zone_name] = M.Zone.new(zone_name)
    end
    profiler_state.zones[zone_name].start_time = os.clock()
end

function M.zone_exit(zone_name)
    if profiler_state.zones[zone_name] then
        local zone = profiler_state.zones[zone_name]
        zone.total_time = zone.total_time + (os.clock() - zone.start_time)
        zone.call_count = zone.call_count + 1
    end
    profiler_state.current_zone = nil
end

-- Core Profiling Functions
function M.start(options)
    options = options or {}
    
    if profiler_state.active then
        error("Profiler is already active")
    end
    
    -- Reset state
    profiler_state.samples = {}
    profiler_state.zones = {}
    profiler_state.memory_samples = {}
    profiler_state.sample_count = 0
    profiler_state.memory_tracking = options.memory or false
    
    -- Configure sampling
    local sample_interval = options.interval or "i1"  -- Sample every 1ms
    local stack_depth = options.stack_depth or 10
    
    profiler_state.start_time = os.clock()
    profiler_state.active = true
    
    -- Start LuaJIT profiler with callback
    profile.start(sample_interval, profiler_callback)
end

function M.stop()
    if not profiler_state.active then
        error("Profiler is not active")
    end
    
    profile.stop()
    profiler_state.end_time = os.clock()
    profiler_state.active = false
    
    return M.get_results()
end

function M.get_results()
    local total_time = profiler_state.end_time - profiler_state.start_time
    
    return {
        total_time = total_time,
        sample_count = profiler_state.sample_count,
        samples = profiler_state.samples,
        zones = profiler_state.zones,
        memory_samples = profiler_state.memory_samples,
        sampling_rate = profiler_state.sample_count / total_time
    }
end

-- Analysis Functions
function M.analyze_hotspots(results, top_n)
    top_n = top_n or 10
    local function_stats = {}
    
    -- Aggregate samples by function
    for _, sample in ipairs(results.samples) do
        for _, frame in ipairs(sample.stack) do
            local key = frame.source .. ":" .. frame.name
            if not function_stats[key] then
                function_stats[key] = {
                    name = frame.name,
                    source = frame.source,
                    samples = 0,
                    percentage = 0
                }
            end
            function_stats[key].samples = function_stats[key].samples + 1
        end
    end
    
    -- Calculate percentages and sort
    local hotspots = {}
    for key, stats in pairs(function_stats) do
        stats.percentage = (stats.samples / results.sample_count) * 100
        table.insert(hotspots, stats)
    end
    
    table.sort(hotspots, function(a, b) return a.samples > b.samples end)
    
    -- Return top N
    local result = {}
    for i = 1, math.min(top_n, #hotspots) do
        table.insert(result, hotspots[i])
    end
    
    return result
end

function M.generate_flame_graph_data(results)
    local flame_data = {}
    
    for _, sample in ipairs(results.samples) do
        local stack_trace = {}
        for i = #sample.stack, 1, -1 do  -- Reverse for flame graph format
            local frame = sample.stack[i]
            table.insert(stack_trace, frame.name or "<anonymous>")
        end
        
        local stack_key = table.concat(stack_trace, ";")
        flame_data[stack_key] = (flame_data[stack_key] or 0) + 1
    end
    
    -- Convert to flame graph format
    local flame_lines = {}
    for stack, count in pairs(flame_data) do
        table.insert(flame_lines, stack .. " " .. count)
    end
    
    return table.concat(flame_lines, "\n")
end

function M.analyze_memory_usage(results)
    if #results.memory_samples == 0 then
        return nil
    end
    
    local min_usage = math.huge
    local max_usage = 0
    local total_usage = 0
    
    for _, sample in ipairs(results.memory_samples) do
        min_usage = math.min(min_usage, sample.usage)
        max_usage = math.max(max_usage, sample.usage)
        total_usage = total_usage + sample.usage
    end
    
    return {
        min_usage = min_usage,
        max_usage = max_usage,
        avg_usage = total_usage / #results.memory_samples,
        peak_usage = max_usage,
        samples = results.memory_samples
    }
end

-- Report Generation
function M.generate_report(results, options)
    options = options or {}
    local report = {}
    
    -- Header
    table.insert(report, "LUASCRIPT Performance Profile Report")
    table.insert(report, "=====================================")
    table.insert(report, string.format("Total Time: %.3f seconds", results.total_time))
    table.insert(report, string.format("Samples: %d", results.sample_count))
    table.insert(report, string.format("Sampling Rate: %.1f Hz", results.sampling_rate))
    table.insert(report, "")
    
    -- Hotspots
    local hotspots = M.analyze_hotspots(results, options.top_functions or 10)
    table.insert(report, "Top Functions by Sample Count:")
    table.insert(report, "------------------------------")
    for _, hotspot in ipairs(hotspots) do
        table.insert(report, string.format("%.2f%% (%d samples) %s [%s]",
            hotspot.percentage, hotspot.samples, hotspot.name, hotspot.source))
    end
    table.insert(report, "")
    
    -- Zone Analysis
    if next(results.zones) then
        table.insert(report, "Zone Performance:")
        table.insert(report, "----------------")
        for name, zone in pairs(results.zones) do
            local avg_time = zone.call_count > 0 and (zone.total_time / zone.call_count) or 0
            table.insert(report, string.format("%s: %.3fs total, %d calls, %.3fs avg",
                name, zone.total_time, zone.call_count, avg_time))
        end
        table.insert(report, "")
    end
    
    -- Memory Analysis
    local memory_analysis = M.analyze_memory_usage(results)
    if memory_analysis then
        table.insert(report, "Memory Usage:")
        table.insert(report, "------------")
        table.insert(report, string.format("Peak: %.2f MB", memory_analysis.peak_usage / 1024 / 1024))
        table.insert(report, string.format("Average: %.2f MB", memory_analysis.avg_usage / 1024 / 1024))
        table.insert(report, string.format("Min: %.2f MB", memory_analysis.min_usage / 1024 / 1024))
        table.insert(report, "")
    end
    
    return table.concat(report, "\n")
end

-- High-Level Convenience Functions
function M.profile_function(func, ...)
    M.start({memory = true})
    local results = {pcall(func, ...)}
    local profile_results = M.stop()
    
    if not results[1] then
        error("Function failed during profiling: " .. tostring(results[2]))
    end
    
    return profile_results, unpack(results, 2)
end

function M.benchmark(name, func, iterations)
    iterations = iterations or 1000
    local times = {}
    
    for i = 1, iterations do
        local start_time = os.clock()
        func()
        local end_time = os.clock()
        table.insert(times, end_time - start_time)
    end
    
    -- Calculate statistics
    table.sort(times)
    local total = 0
    for _, time in ipairs(times) do
        total = total + time
    end
    
    return {
        name = name,
        iterations = iterations,
        total_time = total,
        avg_time = total / iterations,
        min_time = times[1],
        max_time = times[#times],
        median_time = times[math.floor(#times / 2)],
        p95_time = times[math.floor(#times * 0.95)],
        p99_time = times[math.floor(#times * 0.99)]
    }
end

-- TODO: Implement GPU profiling integration
-- TODO: Add call graph visualization
-- TODO: Implement performance regression detection
-- TODO: Add sampling bias correction algorithms
-- TODO: Implement distributed profiling for multi-process applications

return M
