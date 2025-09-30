
-- LUASCRIPT Ternary Computing Tests
-- Comprehensive test suite for ternary computing research

-- Test Configuration
local TEST_CONFIG = {
    max_test_value = 1000,
    precision_tolerance = 1e-10,
    performance_iterations = 10000
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

local function assert_close(actual, expected, tolerance, message)
    tolerance = tolerance or TEST_CONFIG.precision_tolerance
    if math.abs(actual - expected) > tolerance then
        error(string.format("Assertion failed: %s. Expected %s ± %s, got %s", 
              message or "values not close", tostring(expected), tostring(tolerance), tostring(actual)))
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

-- Ternary Computing Implementation (Research Prototypes)
local Ternary = {}

-- Balanced Ternary Representation
-- Uses table of trits: {-1, 0, 1}
function Ternary.from_decimal(n)
    if n == 0 then return {0} end
    
    local trits = {}
    local abs_n = math.abs(n)
    
    while abs_n > 0 do
        local remainder = abs_n % 3
        abs_n = math.floor(abs_n / 3)
        
        if remainder == 0 then
            table.insert(trits, 1, 0)
        elseif remainder == 1 then
            table.insert(trits, 1, 1)
        else -- remainder == 2
            table.insert(trits, 1, -1)
            abs_n = abs_n + 1
        end
    end
    
    -- Handle negative numbers
    if n < 0 then
        for i = 1, #trits do
            trits[i] = -trits[i]
        end
    end
    
    return trits
end

function Ternary.to_decimal(trits)
    local result = 0
    local power = 1
    
    for i = #trits, 1, -1 do
        result = result + trits[i] * power
        power = power * 3
    end
    
    return result
end

function Ternary.add(a_trits, b_trits)
    local max_len = math.max(#a_trits, #b_trits)
    local result = {}
    local carry = 0
    
    for i = 1, max_len + 1 do
        local a_trit = (i <= #a_trits) and a_trits[#a_trits - i + 1] or 0
        local b_trit = (i <= #b_trits) and b_trits[#b_trits - i + 1] or 0
        
        local sum = a_trit + b_trit + carry
        
        if sum >= -1 and sum <= 1 then
            table.insert(result, 1, sum)
            carry = 0
        elseif sum == 2 then
            table.insert(result, 1, -1)
            carry = 1
        elseif sum == 3 then
            table.insert(result, 1, 0)
            carry = 1
        elseif sum == -2 then
            table.insert(result, 1, 1)
            carry = -1
        elseif sum == -3 then
            table.insert(result, 1, 0)
            carry = -1
        end
    end
    
    -- Remove leading zeros
    while #result > 1 and result[1] == 0 do
        table.remove(result, 1)
    end
    
    return result
end

function Ternary.negate(trits)
    local result = {}
    for i = 1, #trits do
        table.insert(result, -trits[i])
    end
    return result
end

function Ternary.subtract(a_trits, b_trits)
    return Ternary.add(a_trits, Ternary.negate(b_trits))
end

-- Ternary Search Implementation
function Ternary.search(func, left, right, epsilon)
    epsilon = epsilon or 1e-6
    
    while (right - left) > epsilon do
        local m1 = left + (right - left) / 3
        local m2 = right - (right - left) / 3
        
        if func(m1) > func(m2) then
            right = m2
        else
            left = m1
        end
    end
    
    return (left + right) / 2
end

-- Test Suite
local tests = {}

function tests.test_decimal_to_ternary_conversion()
    local test_cases = {
        {0, {0}},
        {1, {1}},
        {2, {1, -1}},
        {3, {1, 0}},
        {4, {1, 1}},
        {5, {1, -1, -1}},
        {9, {1, 0, 0}},
        {13, {1, 1, 1}},
        {-1, {-1}},
        {-2, {-1, 1}},
        {-5, {-1, 1, 1}}
    }
    
    for _, case in ipairs(test_cases) do
        local decimal, expected_trits = case[1], case[2]
        local actual_trits = Ternary.from_decimal(decimal)
        
        assert_equal(#actual_trits, #expected_trits, 
                    string.format("Length mismatch for %d", decimal))
        
        for i = 1, #expected_trits do
            assert_equal(actual_trits[i], expected_trits[i], 
                        string.format("Trit mismatch at position %d for %d", i, decimal))
        end
    end
    
    print("  Tested decimal to ternary conversion for multiple values")
end

function tests.test_ternary_to_decimal_conversion()
    local test_cases = {
        {{0}, 0},
        {{1}, 1},
        {{1, -1}, 2},
        {{1, 0}, 3},
        {{1, 1}, 4},
        {{1, -1, -1}, 5},
        {{1, 0, 0}, 9},
        {{1, 1, 1}, 13},
        {{-1}, -1},
        {{-1, 1}, -2},
        {{-1, 1, 1}, -5}
    }
    
    for _, case in ipairs(test_cases) do
        local trits, expected_decimal = case[1], case[2]
        local actual_decimal = Ternary.to_decimal(trits)
        
        assert_equal(actual_decimal, expected_decimal, 
                    string.format("Conversion mismatch for trits %s", table.concat(trits, ",")))
    end
    
    print("  Tested ternary to decimal conversion for multiple values")
end

function tests.test_round_trip_conversion()
    -- Test that decimal -> ternary -> decimal gives original value
    for i = -50, 50 do
        local trits = Ternary.from_decimal(i)
        local recovered = Ternary.to_decimal(trits)
        
        assert_equal(recovered, i, string.format("Round trip failed for %d", i))
    end
    
    print("  Tested round-trip conversion for values -50 to 50")
end

function tests.test_ternary_addition()
    local test_cases = {
        {1, 2, 3},
        {5, 7, 12},
        {-3, 5, 2},
        {-8, -4, -12},
        {0, 15, 15},
        {13, -13, 0}
    }
    
    for _, case in ipairs(test_cases) do
        local a, b, expected = case[1], case[2], case[3]
        
        local a_trits = Ternary.from_decimal(a)
        local b_trits = Ternary.from_decimal(b)
        local result_trits = Ternary.add(a_trits, b_trits)
        local result = Ternary.to_decimal(result_trits)
        
        assert_equal(result, expected, 
                    string.format("Addition failed: %d + %d = %d (got %d)", a, b, expected, result))
    end
    
    print("  Tested ternary addition for multiple cases")
end

function tests.test_ternary_subtraction()
    local test_cases = {
        {5, 3, 2},
        {10, 7, 3},
        {3, 5, -2},
        {0, 8, -8},
        {-5, -3, -2},
        {-3, -5, 2}
    }
    
    for _, case in ipairs(test_cases) do
        local a, b, expected = case[1], case[2], case[3]
        
        local a_trits = Ternary.from_decimal(a)
        local b_trits = Ternary.from_decimal(b)
        local result_trits = Ternary.subtract(a_trits, b_trits)
        local result = Ternary.to_decimal(result_trits)
        
        assert_equal(result, expected, 
                    string.format("Subtraction failed: %d - %d = %d (got %d)", a, b, expected, result))
    end
    
    print("  Tested ternary subtraction for multiple cases")
end

function tests.test_ternary_negation()
    for i = -20, 20 do
        local trits = Ternary.from_decimal(i)
        local neg_trits = Ternary.negate(trits)
        local result = Ternary.to_decimal(neg_trits)
        
        assert_equal(result, -i, string.format("Negation failed for %d", i))
    end
    
    print("  Tested ternary negation for values -20 to 20")
end

function tests.test_ternary_search_algorithm()
    -- Test with quadratic function: f(x) = (x-5)^2 + 3
    -- Minimum at x = 5
    local function quadratic(x)
        return (x - 5) * (x - 5) + 3
    end
    
    local result = Ternary.search(quadratic, 0, 10, 1e-6)
    assert_close(result, 5.0, 1e-5, "Ternary search should find minimum at x=5")
    
    -- Test with another function: f(x) = -x^2 + 4x + 1
    -- Maximum at x = 2
    local function inverted_quadratic(x)
        return -(x * x) + 4 * x + 1
    end
    
    result = Ternary.search(function(x) return -inverted_quadratic(x) end, -1, 5, 1e-6)
    assert_close(result, 2.0, 1e-5, "Ternary search should find maximum at x=2")
    
    print("  Tested ternary search algorithm on quadratic functions")
end

function tests.test_ternary_search_performance()
    local function test_function(x)
        return x * x * x - 6 * x * x + 9 * x + 1
    end
    
    local iterations = 1000
    local start_time = os.clock()
    
    for i = 1, iterations do
        Ternary.search(test_function, 0, 5, 1e-6)
    end
    
    local end_time = os.clock()
    local avg_time = (end_time - start_time) / iterations * 1000 -- ms
    
    print(string.format("  Average ternary search time: %.3f ms", avg_time))
    assert_equal(avg_time < 1.0, true, "Ternary search should be fast (<1ms)")
end

function tests.test_ternary_arithmetic_performance()
    local iterations = TEST_CONFIG.performance_iterations
    
    -- Test addition performance
    local start_time = os.clock()
    for i = 1, iterations do
        local a_trits = Ternary.from_decimal(i % 100)
        local b_trits = Ternary.from_decimal((i * 2) % 100)
        Ternary.add(a_trits, b_trits)
    end
    local add_time = os.clock() - start_time
    
    -- Test conversion performance
    start_time = os.clock()
    for i = 1, iterations do
        local trits = Ternary.from_decimal(i % 1000)
        Ternary.to_decimal(trits)
    end
    local convert_time = os.clock() - start_time
    
    print(string.format("  Addition: %.3f ms/op, Conversion: %.3f ms/op",
          (add_time / iterations) * 1000, (convert_time / iterations) * 1000))
end

function tests.test_large_number_handling()
    -- Test with larger numbers to check scalability
    local large_numbers = {100, 500, 1000, 2500, 5000}
    
    for _, n in ipairs(large_numbers) do
        local trits = Ternary.from_decimal(n)
        local recovered = Ternary.to_decimal(trits)
        
        assert_equal(recovered, n, string.format("Large number handling failed for %d", n))
        
        -- Test arithmetic with large numbers
        local double_trits = Ternary.add(trits, trits)
        local double_result = Ternary.to_decimal(double_trits)
        
        assert_equal(double_result, n * 2, 
                    string.format("Large number arithmetic failed for %d", n))
    end
    
    print("  Tested large number handling up to 5000")
end

function tests.test_edge_cases()
    -- Test zero handling
    local zero_trits = Ternary.from_decimal(0)
    assert_equal(#zero_trits, 1, "Zero should have one trit")
    assert_equal(zero_trits[1], 0, "Zero trit should be 0")
    
    -- Test adding zero
    local five_trits = Ternary.from_decimal(5)
    local result_trits = Ternary.add(five_trits, zero_trits)
    local result = Ternary.to_decimal(result_trits)
    assert_equal(result, 5, "Adding zero should not change value")
    
    -- Test subtracting from itself
    result_trits = Ternary.subtract(five_trits, five_trits)
    result = Ternary.to_decimal(result_trits)
    assert_equal(result, 0, "Subtracting from itself should give zero")
    
    print("  Tested edge cases (zero, identity operations)")
end

function tests.test_ternary_representation_efficiency()
    -- Compare ternary vs binary representation efficiency
    local test_values = {10, 50, 100, 500, 1000}
    
    for _, value in ipairs(test_values) do
        local trits = Ternary.from_decimal(value)
        local binary_bits = math.floor(math.log(value) / math.log(2)) + 1
        local ternary_trits = #trits
        
        -- Calculate information density
        local binary_info = binary_bits * 1.0 -- 1 bit per bit
        local ternary_info = ternary_trits * math.log(3) / math.log(2) -- log2(3) bits per trit
        
        print(string.format("  Value %d: Binary=%d bits, Ternary=%d trits (%.1f effective bits)",
              value, binary_bits, ternary_trits, ternary_info))
    end
end

-- Main Test Runner
local function run_all_tests()
    print("LUASCRIPT Ternary Computing Research Test Suite")
    print("===============================================")
    
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
        print("\nTernary Computing Research Status:")
        print("- Balanced ternary arithmetic: ✓ Implemented")
        print("- Ternary search algorithm: ✓ Implemented")
        print("- Performance benchmarking: ✓ Completed")
        print("- Large number handling: ✓ Verified")
        print("- Edge case testing: ✓ Passed")
        return true
    else
        print(string.format("%d tests failed! ✗", total_tests - passed_tests))
        return false
    end
end

-- Export test runner and ternary implementation
return {
    run_all_tests = run_all_tests,
    run_test = run_test,
    tests = tests,
    Ternary = Ternary
}
