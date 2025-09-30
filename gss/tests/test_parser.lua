
-- Test GSS Parser

local gss_grammar = require("gss.grammar.gss")
local agss_grammar = require("gss.grammar.agss")
local parser = require("gss.parser.parser")
local ast = require("gss.parser.ast")

local function test_basic_gss()
    print("\n=== Test: Basic GSS Parsing ===")
    
    local input = [[
        gss myGaussian {
            size: 640px x 480px;
            field: gaussian(0, 0, 20);
            ramp: viridis;
            blend: normal;
        }
    ]]
    
    local parse_tree, err = gss_grammar.parse(input)
    
    if not parse_tree then
        print("❌ FAILED: " .. err)
        return false
    end
    
    print("✓ Parse tree generated")
    
    local ast_tree = parser.to_ast(parse_tree)
    
    if not ast_tree then
        print("❌ FAILED: AST conversion failed")
        return false
    end
    
    print("✓ AST generated")
    print("✓ Blocks:", #ast_tree.blocks)
    
    return true
end

local function test_css_variables()
    print("\n=== Test: CSS Variables ===")
    
    local input = [[
        gss dynamic {
            field: gaussian(var(--muX, 0), var(--muY, 0), var(--sigma, 20));
            ramp: plasma;
        }
    ]]
    
    local parse_tree, err = gss_grammar.parse(input)
    
    if not parse_tree then
        print("❌ FAILED: " .. err)
        return false
    end
    
    print("✓ CSS variables parsed")
    
    return true
end

local function test_complex_expressions()
    print("\n=== Test: Complex Field Expressions ===")
    
    local input = [[
        gss complex {
            field: mix(
                gaussian(0, 0, 20),
                gaussian(100, 100, 30),
                0.5
            );
            ramp: viridis;
        }
    ]]
    
    local parse_tree, err = gss_grammar.parse(input)
    
    if not parse_tree then
        print("❌ FAILED: " .. err)
        return false
    end
    
    print("✓ Mix expression parsed")
    
    local input2 = [[
        gss summed {
            field: sum(
                gaussian(0, 0, 20),
                gaussian(50, 50, 15),
                gaussian(100, 100, 25)
            );
            ramp: magma;
        }
    ]]
    
    local parse_tree2, err2 = gss_grammar.parse(input2)
    
    if not parse_tree2 then
        print("❌ FAILED: " .. err2)
        return false
    end
    
    print("✓ Sum expression parsed")
    
    return true
end

local function test_iso_contours()
    print("\n=== Test: Iso Contours ===")
    
    local input = [[
        gss withIso {
            field: gaussian(0, 0, 30);
            ramp: inferno;
            iso: 50%, 2px;
        }
    ]]
    
    local parse_tree, err = gss_grammar.parse(input)
    
    if not parse_tree then
        print("❌ FAILED: " .. err)
        return false
    end
    
    print("✓ Iso contour parsed")
    
    return true
end

local function test_agss_agent()
    print("\n=== Test: AGSS Agent Block ===")
    
    local input = [[
        @agent tuner {
            optimize {
                target: fps: 60;
                vary: sigma ∈ [8, 40] step 4, muX ∈ [-120, 120] step 20;
                budget: trials: 64;
                strategy: grid;
                record: fps, sigma, muX, checksum;
            }
        }
    ]]
    
    local parse_tree, err = agss_grammar.parse(input)
    
    if not parse_tree then
        print("❌ FAILED: " .. err)
        return false
    end
    
    print("✓ AGSS agent block parsed")
    
    local ast_tree = parser.to_agss_ast(parse_tree)
    
    if not ast_tree then
        print("❌ FAILED: AGSS AST conversion failed")
        return false
    end
    
    print("✓ AGSS AST generated")
    
    return true
end

-- Run all tests
local function run_all_tests()
    print("=================================")
    print("   GSS Parser Test Suite")
    print("=================================")
    
    local tests = {
        test_basic_gss,
        test_css_variables,
        test_complex_expressions,
        test_iso_contours,
        test_agss_agent
    }
    
    local passed = 0
    local failed = 0
    
    for _, test in ipairs(tests) do
        local success = test()
        if success then
            passed = passed + 1
        else
            failed = failed + 1
        end
    end
    
    print("\n=================================")
    print(string.format("Results: %d passed, %d failed", passed, failed))
    print("=================================")
    
    return failed == 0
end

-- Run tests
if not pcall(run_all_tests) then
    print("\n❌ Test suite crashed!")
    print("This is expected if LPEG is not installed.")
    print("Install with: luarocks install lpeg")
end
