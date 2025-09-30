
-- Test AGSS Agent System

local strategies = require("gss.agss.strategies")
local metrics = require("gss.agss.metrics")
local agent = require("gss.agss.agent")

local function test_grid_search()
    print("\n=== Test: Grid Search Strategy ===")
    
    local ranges = {
        sigma = {min = 10, max = 30},
        muX = {min = -50, max = 50}
    }
    
    local step_sizes = {
        sigma = 10,
        muX = 50
    }
    
    local next_sample = strategies.grid_search(ranges, step_sizes)
    
    local samples = {}
    local sample = next_sample()
    
    while sample do
        table.insert(samples, sample)
        sample = next_sample()
    end
    
    print("✓ Generated", #samples, "samples")
    
    -- Should generate 3 * 3 = 9 samples
    if #samples ~= 9 then
        print("❌ FAILED: Expected 9 samples, got", #samples)
        return false
    end
    
    print("✓ Grid search working correctly")
    
    return true
end

local function test_random_search()
    print("\n=== Test: Random Search Strategy ===")
    
    local ranges = {
        sigma = {min = 10, max = 30},
        muX = {min = -50, max = 50}
    }
    
    local next_sample = strategies.random_search(ranges, 20)
    
    local samples = {}
    local sample = next_sample()
    
    while sample do
        table.insert(samples, sample)
        sample = next_sample()
    end
    
    print("✓ Generated", #samples, "samples")
    
    if #samples ~= 20 then
        print("❌ FAILED: Expected 20 samples, got", #samples)
        return false
    end
    
    -- Check ranges
    for _, s in ipairs(samples) do
        if s.sigma < 10 or s.sigma > 30 then
            print("❌ FAILED: sigma out of range:", s.sigma)
            return false
        end
        if s.muX < -50 or s.muX > 50 then
            print("❌ FAILED: muX out of range:", s.muX)
            return false
        end
    end
    
    print("✓ Random search working correctly")
    
    return true
end

local function test_bayesian_search()
    print("\n=== Test: Bayesian Search Strategy ===")
    
    local ranges = {
        sigma = {min = 10, max = 30}
    }
    
    local next_sample, observe = strategies.bayesian_search(ranges, 10)
    
    local samples = {}
    
    for i = 1, 10 do
        local sample = next_sample()
        if not sample then break end
        
        table.insert(samples, sample)
        
        -- Simulate reward (higher for sigma near 20)
        local reward = -math.abs(sample.sigma - 20)
        observe(sample, reward)
    end
    
    print("✓ Generated", #samples, "samples with Bayesian optimization")
    
    if #samples ~= 10 then
        print("❌ FAILED: Expected 10 samples, got", #samples)
        return false
    end
    
    print("✓ Bayesian search working correctly")
    
    return true
end

local function test_metrics()
    print("\n=== Test: Performance Metrics ===")
    
    -- Test FPS measurement
    local frame_count = 0
    local render_fn = function()
        frame_count = frame_count + 1
        -- Simulate 16ms frame time
        local start = os.clock()
        while os.clock() - start < 0.016 do end
    end
    
    local fps_result = metrics.measure_fps(render_fn, 0.5)
    
    print(string.format("✓ FPS: %.1f", fps_result.fps))
    print(string.format("✓ Frames: %d", fps_result.frames))
    
    -- Test checksum
    local params = {sigma = 20, muX = 100, muY = 50}
    local checksum = metrics.compute_checksum(params)
    
    print("✓ Checksum:", checksum)
    
    if #checksum ~= 8 then
        print("❌ FAILED: Invalid checksum format")
        return false
    end
    
    print("✓ Metrics working correctly")
    
    return true
end

local function test_agent_lifecycle()
    print("\n=== Test: Agent Lifecycle ===")
    
    local config = {
        name = "test_agent",
        target = {metric = "fps", value = 60},
        ranges = {
            sigma = {min = 10, max = 30, step = 10}
        },
        budget = {type = "trials", value = 5},
        strategy = "grid",
        record_fields = {"fps"}
    }
    
    local test_agent = agent.Agent(config)
    
    print("✓ Agent created:", test_agent.name)
    
    -- Mock engine and graph
    local mock_engine = {
        width = 100,
        height = 100,
        params = {},
        execute = function(self, g)
            return {}
        end
    }
    
    local mock_graph = {}
    
    -- Start agent
    local success = agent.start(test_agent, mock_engine, mock_graph)
    
    if not success then
        print("❌ FAILED: Could not start agent")
        return false
    end
    
    print("✓ Agent started")
    
    -- Run a few steps
    for i = 1, 3 do
        local result = agent.step(test_agent, mock_engine, mock_graph)
        if result then
            print(string.format("✓ Step %d completed, trial %d", i, result.trial))
        end
    end
    
    -- Pause agent
    agent.pause(test_agent)
    print("✓ Agent paused")
    
    -- Resume agent
    agent.resume(test_agent)
    print("✓ Agent resumed")
    
    -- Stop agent
    agent.stop(test_agent)
    print("✓ Agent stopped")
    
    print("✓ Agent lifecycle working correctly")
    
    return true
end

-- Run all tests
local function run_all_tests()
    print("=================================")
    print("   AGSS Agent Test Suite")
    print("=================================")
    
    local tests = {
        test_grid_search,
        test_random_search,
        test_bayesian_search,
        test_metrics,
        test_agent_lifecycle
    }
    
    local passed = 0
    local failed = 0
    
    for _, test in ipairs(tests) do
        local success, err = pcall(test)
        if success and err ~= false then
            passed = passed + 1
        else
            failed = failed + 1
            if not success then
                print("❌ Test crashed:", err)
            end
        end
    end
    
    print("\n=================================")
    print(string.format("Results: %d passed, %d failed", passed, failed))
    print("=================================")
    
    return failed == 0
end

-- Run tests
run_all_tests()
