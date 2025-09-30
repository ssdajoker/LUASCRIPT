
-- LUASCRIPT GPU Acceleration Framework Tests
-- Comprehensive test suite for CUDA bindings and GPU operations

local gpu = require('src.gpu_accel.init')

-- Test Configuration
local TEST_CONFIG = {
    device_id = 0,
    test_data_size = 1024 * 1024, -- 1MB test data
    timeout_seconds = 30
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

-- Test Suite
local tests = {}

function tests.test_device_count()
    local count = gpu.get_device_count()
    assert_not_nil(count, "Device count should not be nil")
    assert_equal(type(count), "number", "Device count should be a number")
    print(string.format("  Found %d GPU device(s)", count))
end

function tests.test_device_creation()
    local device = gpu.init(TEST_CONFIG.device_id)
    assert_not_nil(device, "Device should be created successfully")
    assert_equal(device.device_id, TEST_CONFIG.device_id, "Device ID should match")
    device:destroy()
end

function tests.test_memory_allocation()
    local device = gpu.init(TEST_CONFIG.device_id)
    local memory = device:allocate(TEST_CONFIG.test_data_size)
    
    assert_not_nil(memory, "Memory allocation should succeed")
    assert_equal(memory.size, TEST_CONFIG.test_data_size, "Memory size should match")
    
    memory:free()
    device:destroy()
end

function tests.test_memory_copy_operations()
    local ffi = require('ffi')
    local device = gpu.init(TEST_CONFIG.device_id)
    local memory = device:allocate(1024) -- 1KB test
    
    -- Create test data
    local host_data = ffi.new("float[256]") -- 256 floats = 1KB
    for i = 0, 255 do
        host_data[i] = i * 0.5
    end
    
    -- Copy to GPU
    memory:copy_from_host(host_data, 1024)
    
    -- Copy back from GPU
    local result_data = ffi.new("float[256]")
    memory:copy_to_host(result_data, 1024)
    
    -- Verify data integrity
    for i = 0, 255 do
        assert_equal(result_data[i], host_data[i], 
                    string.format("Data mismatch at index %d", i))
    end
    
    memory:free()
    device:destroy()
end

function tests.test_stream_creation()
    local device = gpu.init(TEST_CONFIG.device_id)
    local stream = device:create_stream()
    
    assert_not_nil(stream, "Stream should be created successfully")
    assert_equal(stream.device, device, "Stream should reference correct device")
    
    stream:destroy()
    device:destroy()
end

function tests.test_timer_functionality()
    local device = gpu.init(TEST_CONFIG.device_id)
    local timer = device:create_timer()
    local stream = device:create_stream()
    
    assert_not_nil(timer, "Timer should be created successfully")
    
    -- Test timing
    timer:start(stream)
    
    -- Simulate some work (memory allocation/deallocation)
    local memory = device:allocate(1024)
    memory:free()
    
    timer:stop(stream)
    local elapsed = timer:elapsed_time()
    
    assert_not_nil(elapsed, "Elapsed time should be measured")
    assert_equal(type(elapsed), "number", "Elapsed time should be a number")
    print(string.format("  Measured elapsed time: %.3f ms", elapsed))
    
    stream:destroy()
    device:destroy()
end

function tests.test_multiple_devices()
    local device_count = gpu.get_device_count()
    if device_count < 2 then
        print("  Skipping multi-device test (only 1 device available)")
        return
    end
    
    local device1 = gpu.init(0)
    local device2 = gpu.init(1)
    
    assert_not_nil(device1, "First device should be created")
    assert_not_nil(device2, "Second device should be created")
    assert_equal(device1.device_id, 0, "First device should have ID 0")
    assert_equal(device2.device_id, 1, "Second device should have ID 1")
    
    device1:destroy()
    device2:destroy()
end

function tests.test_error_handling()
    -- Test invalid device ID
    local device_count = gpu.get_device_count()
    local success, error_msg = pcall(gpu.init, device_count + 10)
    
    assert_equal(success, false, "Invalid device ID should fail")
    assert_not_nil(error_msg, "Error message should be provided")
    print(string.format("  Expected error caught: %s", error_msg))
end

function tests.test_resource_cleanup()
    -- Test that resources are properly cleaned up
    local device = gpu.init(TEST_CONFIG.device_id)
    local memory1 = device:allocate(1024)
    local memory2 = device:allocate(2048)
    local stream = device:create_stream()
    local timer = device:create_timer()
    
    -- Cleanup in reverse order
    timer = nil
    stream:destroy()
    memory2:free()
    memory1:free()
    device:destroy()
    
    -- Force garbage collection
    collectgarbage("collect")
    print("  Resource cleanup completed successfully")
end

-- Performance Tests
function tests.test_memory_bandwidth()
    local ffi = require('ffi')
    local device = gpu.init(TEST_CONFIG.device_id)
    local timer = device:create_timer()
    
    local data_size = 64 * 1024 * 1024 -- 64MB
    local memory = device:allocate(data_size)
    local host_data = ffi.new("char[?]", data_size)
    
    -- Fill with test pattern
    for i = 0, data_size - 1 do
        host_data[i] = i % 256
    end
    
    -- Measure host-to-device transfer
    timer:start()
    memory:copy_from_host(host_data, data_size)
    timer:stop()
    local h2d_time = timer:elapsed_time()
    
    -- Measure device-to-host transfer
    timer:start()
    memory:copy_to_host(host_data, data_size)
    timer:stop()
    local d2h_time = timer:elapsed_time()
    
    local h2d_bandwidth = (data_size / 1024 / 1024) / (h2d_time / 1000) -- MB/s
    local d2h_bandwidth = (data_size / 1024 / 1024) / (d2h_time / 1000) -- MB/s
    
    print(string.format("  H2D Bandwidth: %.1f MB/s", h2d_bandwidth))
    print(string.format("  D2H Bandwidth: %.1f MB/s", d2h_bandwidth))
    
    memory:free()
    device:destroy()
end

-- Main Test Runner
local function run_all_tests()
    print("LUASCRIPT GPU Acceleration Framework Test Suite")
    print("===============================================")
    
    local total_tests = 0
    local passed_tests = 0
    
    -- Check if CUDA is available
    local cuda_available, error_msg = pcall(gpu.get_device_count)
    if not cuda_available then
        print("CUDA not available: " .. error_msg)
        print("Skipping GPU tests")
        return
    end
    
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
