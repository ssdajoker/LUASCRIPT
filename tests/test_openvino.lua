
-- LUASCRIPT OpenVINO Integration Tests
-- Comprehensive test suite for AI inference capabilities

local openvino = require('src.openvino.bridge')

-- Test Configuration
local TEST_CONFIG = {
    test_model_path = "tests/models/test_model.xml", -- Placeholder path
    test_weights_path = "tests/models/test_model.bin", -- Placeholder path
    device_name = "CPU",
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

function tests.test_core_creation()
    local core = openvino.init()
    assert_not_nil(core, "OpenVINO core should be created successfully")
    assert_not_nil(core.core, "Core handle should not be nil")
    core:destroy()
end

function tests.test_tensor_creation()
    local dims = {1, 3, 224, 224} -- Typical image tensor shape
    local tensor = openvino.create_tensor(openvino.ELEMENT_TYPE.F32, dims)
    
    assert_not_nil(tensor, "Tensor should be created successfully")
    assert_equal(#tensor.dims, 4, "Tensor should have 4 dimensions")
    assert_equal(tensor.element_type, openvino.ELEMENT_TYPE.F32, "Element type should match")
    
    local data_ptr = tensor:get_data()
    assert_not_nil(data_ptr, "Tensor data pointer should not be nil")
    
    local size = tensor:get_size()
    assert_not_nil(size, "Tensor size should not be nil")
    assert_equal(type(size), "number", "Tensor size should be a number")
    
    local expected_size = 1 * 3 * 224 * 224 * 4 -- 4 bytes per F32
    assert_equal(size, expected_size, "Tensor size should match expected")
    
    tensor:destroy()
end

function tests.test_tensor_data_access()
    local ffi = require('ffi')
    local dims = {1, 10} -- Simple 1D tensor
    local tensor = openvino.create_tensor(openvino.ELEMENT_TYPE.F32, dims)
    
    local data_ptr = tensor:get_data()
    local float_ptr = ffi.cast("float*", data_ptr)
    
    -- Write test data
    for i = 0, 9 do
        float_ptr[i] = i * 0.5
    end
    
    -- Read back and verify
    for i = 0, 9 do
        assert_equal(float_ptr[i], i * 0.5, 
                    string.format("Data mismatch at index %d", i))
    end
    
    tensor:destroy()
end

function tests.test_multiple_tensor_types()
    local test_cases = {
        {openvino.ELEMENT_TYPE.F32, {1, 5}, 4}, -- 4 bytes per F32
        {openvino.ELEMENT_TYPE.F16, {1, 5}, 2}, -- 2 bytes per F16
        {openvino.ELEMENT_TYPE.I32, {1, 5}, 4}, -- 4 bytes per I32
        {openvino.ELEMENT_TYPE.U8, {1, 5}, 1}   -- 1 byte per U8
    }
    
    for i, case in ipairs(test_cases) do
        local element_type, dims, bytes_per_element = case[1], case[2], case[3]
        local tensor = openvino.create_tensor(element_type, dims)
        
        assert_not_nil(tensor, string.format("Tensor %d should be created", i))
        assert_equal(tensor.element_type, element_type, 
                    string.format("Element type should match for tensor %d", i))
        
        local expected_size = dims[1] * dims[2] * bytes_per_element
        local actual_size = tensor:get_size()
        assert_equal(actual_size, expected_size, 
                    string.format("Size should match for tensor %d", i))
        
        tensor:destroy()
    end
end

function tests.test_core_lifecycle()
    -- Test multiple core creation and destruction
    local cores = {}
    
    for i = 1, 3 do
        local core = openvino.init()
        assert_not_nil(core, string.format("Core %d should be created", i))
        table.insert(cores, core)
    end
    
    for i, core in ipairs(cores) do
        core:destroy()
    end
    
    print("  Multiple core lifecycle test completed")
end

function tests.test_error_handling()
    -- Test invalid tensor creation
    local success, error_msg = pcall(openvino.create_tensor, 999, {1, 1}) -- Invalid element type
    assert_equal(success, false, "Invalid element type should fail")
    assert_not_nil(error_msg, "Error message should be provided")
    print(string.format("  Expected error caught: %s", error_msg))
    
    -- Test invalid dimensions
    success, error_msg = pcall(openvino.create_tensor, openvino.ELEMENT_TYPE.F32, {}) -- Empty dims
    assert_equal(success, false, "Empty dimensions should fail")
    print(string.format("  Expected error caught: %s", error_msg))
end

function tests.test_memory_management()
    -- Test that tensors are properly cleaned up
    local tensors = {}
    
    for i = 1, 10 do
        local tensor = openvino.create_tensor(openvino.ELEMENT_TYPE.F32, {1, 1000})
        table.insert(tensors, tensor)
    end
    
    for _, tensor in ipairs(tensors) do
        tensor:destroy()
    end
    
    -- Force garbage collection
    collectgarbage("collect")
    print("  Memory management test completed")
end

-- Mock Model Tests (when actual model files are not available)
function tests.test_mock_model_workflow()
    print("  Note: Using mock model workflow (no actual model files)")
    
    local core = openvino.init()
    assert_not_nil(core, "Core should be created")
    
    -- Create mock input/output tensors
    local input_tensor = openvino.create_tensor(openvino.ELEMENT_TYPE.F32, {1, 3, 224, 224})
    local output_tensor = openvino.create_tensor(openvino.ELEMENT_TYPE.F32, {1, 1000})
    
    assert_not_nil(input_tensor, "Input tensor should be created")
    assert_not_nil(output_tensor, "Output tensor should be created")
    
    -- Fill input with test data
    local ffi = require('ffi')
    local input_data = ffi.cast("float*", input_tensor:get_data())
    local input_size = input_tensor:get_size() / 4 -- F32 = 4 bytes
    
    for i = 0, input_size - 1 do
        input_data[i] = math.sin(i * 0.01) -- Some test pattern
    end
    
    print("  Mock inference workflow completed")
    
    output_tensor:destroy()
    input_tensor:destroy()
    core:destroy()
end

-- Performance Tests
function tests.test_tensor_creation_performance()
    local iterations = 1000
    local start_time = os.clock()
    
    for i = 1, iterations do
        local tensor = openvino.create_tensor(openvino.ELEMENT_TYPE.F32, {1, 100})
        tensor:destroy()
    end
    
    local end_time = os.clock()
    local total_time = end_time - start_time
    local avg_time = total_time / iterations * 1000 -- Convert to ms
    
    print(string.format("  Average tensor creation time: %.3f ms", avg_time))
    assert_equal(avg_time < 1.0, true, "Tensor creation should be fast (<1ms)")
end

function tests.test_large_tensor_handling()
    -- Test with large tensors to check memory handling
    local large_dims = {1, 1000, 1000} -- 1M elements
    local tensor = openvino.create_tensor(openvino.ELEMENT_TYPE.F32, large_dims)
    
    assert_not_nil(tensor, "Large tensor should be created")
    
    local expected_size = 1 * 1000 * 1000 * 4 -- 4MB
    local actual_size = tensor:get_size()
    assert_equal(actual_size, expected_size, "Large tensor size should match")
    
    -- Test data access
    local data_ptr = tensor:get_data()
    assert_not_nil(data_ptr, "Large tensor data should be accessible")
    
    tensor:destroy()
    print("  Large tensor handling test completed")
end

-- Main Test Runner
local function run_all_tests()
    print("LUASCRIPT OpenVINO Integration Test Suite")
    print("=========================================")
    
    local total_tests = 0
    local passed_tests = 0
    
    -- Check if OpenVINO is available
    local ov_available, error_msg = pcall(openvino.init)
    if not ov_available then
        print("OpenVINO not available: " .. error_msg)
        print("Skipping OpenVINO tests")
        return
    else
        -- Clean up test core
        if type(error_msg) == "table" and error_msg.destroy then
            error_msg:destroy()
        end
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
