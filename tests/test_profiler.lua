
-- LUASCRIPT Performance Profiling Suite Tests
-- Comprehensive test suite for profiling capabilities

local profiler = require('src.profiler.profiler')

-- Test Configuration
local TEST_CONFIG = {
    sample_duration = 0.1, -- 100ms test duration
    benchmark_iterations = 1000,
    memory_test_size = 1024 * 1024 -- 1MB
}

-- Test Utilities
local function assert_equal(actual, expected, message)
    if actual ~= expected then
        error(string.format("Assertion failed: %s. Expected %s, got %s", 
              message or "values not equal", tostring(expected), tostring(actual)))
    end
end

local function assert_not_nil(value, message)
    if value == nil then
        error(string.format("Assertion failed: %s", message or "value is nil"))
    end
end

local function assert_greater_than(actual, threshold, message)
    if actual <= threshold then
        error(string.format("Assertion failed: %s. Expected > %s, got %s", 
              message or "value not greater", tostring(threshold), tostring(actual)))
    end
end

local function run_test(name, test_func)
    print(string.format("Running test: %s", name))
    local start_time = os.clock()
    
    local success, error_msg = pcall(test_func)
    local end_time = os.clock()
    
    if success then
        print(string.format("✓ %s (%.3fs)", name, end_time - start_time))
        return true
    else
        print(string.format("✗ %s: %s", name, error_msg))
        return false
    end
end

-- Test Helper Functions
local function cpu_intensive_work(duration)
    local start_time = os.clock()
    local x = 0
    while (os.clock() - start_time) < duration do
        x = x + math.sin(x) * math.cos(x)
    end
    return x
end

local function memory_intensive_work()
    local tables = {}
    for i = 1, 1000 do
        local t = {}
        for j = 1, 100 do
            t[j] = string.rep("test", 10)
        end
        table.insert(tables, t)
    end
    return tables
end

local function recursive_function(depth)
    if depth <= 0 then
        return cpu_intensive_work(0.001) -- 1ms work
    end
    return recursive_function(depth - 1) + 1
end

-- Test Suite
local tests = {}

function tests.test_basic_profiling()
    profiler.start()
    
    -- Do some work
    cpu_intensive_work(TEST_CONFIG.sample_duration)
    
    local results = profiler.stop()
    
    assert_not_nil(results, "Results should not be nil")
    assert_not_nil(results.total_time, "Total time should be recorded")
    assert_not_nil(results.sample_count, "Sample count should be recorded")
    assert_not_nil(results.samples, "Samples should be recorded")
    
    assert_greater_than(results.total_time, 0, "Total time should be positive")
    assert_greater_than(results.sample_count, 0, "Should have collected samples")
    
    print(string.format("  Collected %d samples in %.3fs", 
          results.sample_count, results.total_time))
end

function tests.test_memory_profiling()
    profiler.start({memory = true})
    
    -- Do memory-intensive work
    local data = memory_intensive_work()
    
    local results = profiler.stop()
    
    assert_not_nil(results.memory_samples, "Memory samples should be recorded")
    assert_greater_than(#results.memory_samples, 0, "Should have memory samples")
    
    local memory_analysis = profiler.analyze_memory_usage(results)
    assert_not_nil(memory_analysis, "Memory analysis should not be nil")
    assert_not_nil(memory_analysis.peak_usage, "Peak usage should be recorded")
    assert_not_nil(memory_analysis.avg_usage, "Average usage should be recorded")
    
    print(string.format("  Peak memory usage: %.2f MB", 
          memory_analysis.peak_usage / 1024 / 1024))
end

function tests.test_zone_profiling()
    profiler.start()
    
    profiler.zone_enter("zone1")
    cpu_intensive_work(0.02) -- 20ms
    profiler.zone_exit("zone1")
    
    profiler.zone_enter("zone2")
    cpu_intensive_work(0.03) -- 30ms
    profiler.zone_exit("zone2")
    
    profiler.zone_enter("zone1")
    cpu_intensive_work(0.01) -- 10ms
    profiler.zone_exit("zone1")
    
    local results = profiler.stop()
    
    assert_not_nil(results.zones, "Zones should be recorded")
    assert_not_nil(results.zones.zone1, "Zone1 should be recorded")
    assert_not_nil(results.zones.zone2, "Zone2 should be recorded")
    
    local zone1 = results.zones.zone1
    assert_equal(zone1.call_count, 2, "Zone1 should have 2 calls")
    assert_greater_than(zone1.total_time, 0.025, "Zone1 should have >25ms total time")
    
    local zone2 = results.zones.zone2
    assert_equal(zone2.call_count, 1, "Zone2 should have 1 call")
    assert_greater_than(zone2.total_time, 0.025, "Zone2 should have >25ms total time")
    
    print(string.format("  Zone1: %.3fs (%d calls), Zone2: %.3fs (%d calls)",
          zone1.total_time, zone1.call_count, zone2.total_time, zone2.call_count))
end

function tests.test_hotspot_analysis()
    profiler.start()
    
    -- Create different functions with different call patterns
    local function hot_function()
        for i = 1, 100 do
            math.sin(i)
        end
    end
    
    local function warm_function()
        for i = 1, 50 do
            math.cos(i)
        end
    end
    
    -- Call functions with different frequencies
    for i = 1, 20 do
        hot_function()
    end
    
    for i = 1, 10 do
        warm_function()
    end
    
    local results = profiler.stop()
    local hotspots = profiler.analyze_hotspots(results, 5)
    
    assert_not_nil(hotspots, "Hotspots should be analyzed")
    assert_greater_than(#hotspots, 0, "Should find hotspots")
    
    for i, hotspot in ipairs(hotspots) do
        assert_not_nil(hotspot.name, "Hotspot should have name")
        assert_not_nil(hotspot.samples, "Hotspot should have sample count")
        assert_not_nil(hotspot.percentage, "Hotspot should have percentage")
        print(string.format("  Hotspot %d: %s (%.1f%%, %d samples)",
              i, hotspot.name, hotspot.percentage, hotspot.samples))
    end
end

function tests.test_flame_graph_generation()
    profiler.start()
    
    -- Create nested function calls
    recursive_function(5)
    
    local results = profiler.stop()
    local flame_data = profiler.generate_flame_graph_data(results)
    
    assert_not_nil(flame_data, "Flame graph data should be generated")
    assert_equal(type(flame_data), "string", "Flame graph data should be string")
    assert_greater_than(#flame_data, 0, "Flame graph data should not be empty")
    
    -- Check format (should contain stack traces with counts)
    local lines = {}
    for line in flame_data:gmatch("[^\n]+") do
        table.insert(lines, line)
    end
    
    assert_greater_than(#lines, 0, "Should have flame graph lines")
    
    print(string.format("  Generated %d flame graph lines", #lines))
    print(string.format("  Sample line: %s", lines[1] or "none"))
end

function tests.test_report_generation()
    profiler.start({memory = true})
    
    profiler.zone_enter("test_zone")
    cpu_intensive_work(0.05)
    profiler.zone_exit("test_zone")
    
    local results = profiler.stop()
    local report = profiler.generate_report(results, {top_functions = 3})
    
    assert_not_nil(report, "Report should be generated")
    assert_equal(type(report), "string", "Report should be string")
    assert_greater_than(#report, 0, "Report should not be empty")
    
    -- Check that report contains expected sections
    assert_equal(report:find("Performance Profile Report") ~= nil, true, 
                "Report should contain title")
    assert_equal(report:find("Total Time:") ~= nil, true, 
                "Report should contain total time")
    assert_equal(report:find("Top Functions") ~= nil, true, 
                "Report should contain hotspots")
    assert_equal(report:find("Zone Performance") ~= nil, true, 
                "Report should contain zone analysis")
    
    print("  Report generated successfully")
    print(string.format("  Report length: %d characters", #report))
end

function tests.test_function_profiling()
    local function test_function(n)
        local sum = 0
        for i = 1, n do
            sum = sum + math.sqrt(i)
        end
        return sum
    end
    
    local profile_results, function_result = profiler.profile_function(test_function, 10000)
    
    assert_not_nil(profile_results, "Profile results should not be nil")
    assert_not_nil(function_result, "Function result should not be nil")
    assert_greater_than(function_result, 0, "Function should return positive result")
    
    assert_greater_than(profile_results.sample_count, 0, "Should collect samples")
    assert_greater_than(profile_results.total_time, 0, "Should measure time")
    
    print(string.format("  Function result: %.2f", function_result))
    print(string.format("  Profile: %d samples in %.3fs", 
          profile_results.sample_count, profile_results.total_time))
end

function tests.test_benchmark_functionality()
    local function simple_math()
        local x = 0
        for i = 1, 100 do
            x = x + math.sin(i) * math.cos(i)
        end
        return x
    end
    
    local benchmark_results = profiler.benchmark("simple_math", simple_math, 100)
    
    assert_not_nil(benchmark_results, "Benchmark results should not be nil")
    assert_equal(benchmark_results.name, "simple_math", "Name should match")
    assert_equal(benchmark_results.iterations, 100, "Iterations should match")
    
    assert_not_nil(benchmark_results.avg_time, "Average time should be recorded")
    assert_not_nil(benchmark_results.min_time, "Min time should be recorded")
    assert_not_nil(benchmark_results.max_time, "Max time should be recorded")
    assert_not_nil(benchmark_results.median_time, "Median time should be recorded")
    
    assert_greater_than(benchmark_results.avg_time, 0, "Average time should be positive")
    assert_greater_than(benchmark_results.max_time, benchmark_results.min_time, 
                       "Max time should be greater than min time")
    
    print(string.format("  Benchmark: avg=%.3fms, min=%.3fms, max=%.3fms",
          benchmark_results.avg_time * 1000, benchmark_results.min_time * 1000, 
          benchmark_results.max_time * 1000))
end

function tests.test_error_handling()
    -- Test double start
    profiler.start()
    local success, error_msg = pcall(profiler.start)
    profiler.stop()
    
    assert_equal(success, false, "Double start should fail")
    assert_not_nil(error_msg, "Error message should be provided")
    print(string.format("  Expected error caught: %s", error_msg))
    
    -- Test stop without start
    success, error_msg = pcall(profiler.stop)
    assert_equal(success, false, "Stop without start should fail")
    print(string.format("  Expected error caught: %s", error_msg))
end

function tests.test_profiler_overhead()
    -- Measure overhead of profiling
    local function work_function()
        cpu_intensive_work(0.01) -- 10ms of work
    end
    
    -- Measure without profiling
    local start_time = os.clock()
    work_function()
    local no_profile_time = os.clock() - start_time
    
    -- Measure with profiling
    profiler.start()
    start_time = os.clock()
    work_function()
    local with_profile_time = os.clock() - start_time
    profiler.stop()
    
    local overhead = with_profile_time - no_profile_time
    local overhead_percentage = (overhead / no_profile_time) * 100
    
    print(string.format("  Profiling overhead: %.3fms (%.1f%%)", 
          overhead * 1000, overhead_percentage))
    
    -- Overhead should be reasonable (<50%)
    assert_equal(overhead_percentage < 50, true, "Profiling overhead should be <50%")
end

-- Main Test Runner
local function run_all_tests()
    print("LUASCRIPT Performance Profiling Suite Test Suite")
    print("================================================")
    
    local total_tests = 0
    local passed_tests = 0
    
    -- Run all tests
    for test_name, test_func in pairs(tests) do
        total_tests = total_tests + 1
        if run_test(test_name, test_func) then
            passed_tests = passed_tests + 1
        end
    end
    
    print("\nTest Results:")
    print(string.format("Passed: %d/%d", passed_tests, total_tests))
    
    if passed_tests == total_tests then
        print("All tests passed! ✓")
        return true
    else
        print(string.format("%d tests failed! ✗", total_tests - passed_tests))
        return false
    end
end

-- Export test runner
return {
    run_all_tests = run_all_tests,
    run_test = run_test,
    tests = tests
}
