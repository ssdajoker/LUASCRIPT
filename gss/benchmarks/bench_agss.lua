
-- AGSS Agent Performance Benchmark

package.path = package.path .. ";/home/ubuntu/github_repos/LUASCRIPT/gss/?.lua"

local agent_module = require("gss.agss.agent")
local engine = require("gss.runtime.engine")
local ast = require("gss.parser.ast")
local lowering = require("gss.ir.lowering")

print("=================================")
print("   AGSS Agent Benchmarks")
print("=================================")

-- Setup test environment
local test_engine = engine.Engine(320, 240)

local gaussian_expr = ast.GaussianExpr(
    ast.CSSVar("--muX", ast.Literal(0, "px")),
    ast.CSSVar("--muY", ast.Literal(0, "px")),
    ast.CSSVar("--sigma", ast.Literal(20, "px"))
)

local field_stmt = ast.FieldStmt(gaussian_expr)
local block = ast.Block("agss_bench", {field_stmt})
local stylesheet = ast.Stylesheet({block})
local graph = lowering.lower(stylesheet)

-- Benchmark 1: Grid Search Performance
print("\n=== Benchmark 1: Grid Search (27 trials) ===")

local grid_config = {
    name = "grid_bench",
    target = {metric = "fps", value = 60},
    ranges = {
        ["--sigma"] = {min = 10, max = 30, step = 10},
        ["--muX"] = {min = 100, max = 200, step = 50},
        ["--muY"] = {min = 100, max = 200, step = 50}
    },
    budget = {type = "trials", value = 27},
    strategy = "grid",
    record_fields = {"fps", "latency_mean"}
}

local grid_agent = agent_module.Agent(grid_config)
agent_module.start(grid_agent, test_engine, graph)

local start1 = os.clock()

while grid_agent.state == "running" do
    local result = agent_module.step(grid_agent, test_engine, graph)
    if not result then break end
end

local elapsed1 = os.clock() - start1

print(string.format("Trials: %d", grid_agent.trial))
print(string.format("Time: %.3f seconds", elapsed1))
print(string.format("Time per trial: %.2f ms", (elapsed1 / grid_agent.trial) * 1000))
print(string.format("Best reward: %.2f", grid_agent.best_reward))

-- Benchmark 2: Random Search Performance
print("\n=== Benchmark 2: Random Search (50 trials) ===")

local random_config = {
    name = "random_bench",
    target = {metric = "fps", value = 60},
    ranges = {
        ["--sigma"] = {min = 10, max = 50},
        ["--muX"] = {min = 50, max = 250},
        ["--muY"] = {min = 50, max = 190}
    },
    budget = {type = "trials", value = 50},
    strategy = "random",
    record_fields = {"fps"}
}

local random_agent = agent_module.Agent(random_config)
agent_module.start(random_agent, test_engine, graph)

local start2 = os.clock()

while random_agent.state == "running" do
    local result = agent_module.step(random_agent, test_engine, graph)
    if not result then break end
end

local elapsed2 = os.clock() - start2

print(string.format("Trials: %d", random_agent.trial))
print(string.format("Time: %.3f seconds", elapsed2))
print(string.format("Time per trial: %.2f ms", (elapsed2 / random_agent.trial) * 1000))
print(string.format("Best reward: %.2f", random_agent.best_reward))

-- Benchmark 3: Bayesian Optimization Performance
print("\n=== Benchmark 3: Bayesian Optimization (20 trials) ===")

local bayes_config = {
    name = "bayes_bench",
    target = {metric = "fps", value = 60},
    ranges = {
        ["--sigma"] = {min = 10, max = 50}
    },
    budget = {type = "trials", value = 20},
    strategy = "bayes",
    record_fields = {"fps"}
}

local bayes_agent = agent_module.Agent(bayes_config)
agent_module.start(bayes_agent, test_engine, graph)

local start3 = os.clock()

while bayes_agent.state == "running" do
    local result = agent_module.step(bayes_agent, test_engine, graph)
    if not result then break end
end

local elapsed3 = os.clock() - start3

print(string.format("Trials: %d", bayes_agent.trial))
print(string.format("Time: %.3f seconds", elapsed3))
print(string.format("Time per trial: %.2f ms", (elapsed3 / bayes_agent.trial) * 1000))
print(string.format("Best reward: %.2f", bayes_agent.best_reward))

-- Benchmark 4: Reward Improvement
print("\n=== Benchmark 4: Reward Improvement (Grid) ===")

local rewards = {}
for _, entry in ipairs(grid_agent.log) do
    table.insert(rewards, entry.reward)
end

local initial_reward = rewards[1]
local final_reward = rewards[#rewards]
local improvement = final_reward - initial_reward

print(string.format("Initial reward: %.2f", initial_reward))
print(string.format("Final reward: %.2f", final_reward))
print(string.format("Improvement: %.2f", improvement))

-- Check for monotonic improvement (at least 10 iterations)
local improved_count = 0
for i = 2, #rewards do
    if rewards[i] > rewards[i-1] then
        improved_count = improved_count + 1
    end
end

print(string.format("Improved iterations: %d / %d", improved_count, #rewards - 1))

if improved_count >= 10 then
    print("✅ PASSED: ≥10 iterations with improvement")
else
    print("⚠ WARNING: <10 iterations with improvement")
end

-- Summary
print("\n=================================")
print("   AGSS Benchmark Summary")
print("=================================")
print(string.format("Grid search (27 trials): %.2f ms/trial", (elapsed1 / grid_agent.trial) * 1000))
print(string.format("Random search (50 trials): %.2f ms/trial", (elapsed2 / random_agent.trial) * 1000))
print(string.format("Bayesian opt (20 trials): %.2f ms/trial", (elapsed3 / bayes_agent.trial) * 1000))
print(string.format("Reward improvement: %.2f → %.2f", initial_reward, final_reward))
print("=================================")

-- Export results
local csv_file = "/tmp/agss_benchmark_results.csv"
local file = io.open(csv_file, "w")

if file then
    file:write("strategy,trials,total_time_s,time_per_trial_ms,best_reward\n")
    file:write(string.format("grid,%d,%.3f,%.2f,%.2f\n",
        grid_agent.trial, elapsed1, (elapsed1 / grid_agent.trial) * 1000, grid_agent.best_reward))
    file:write(string.format("random,%d,%.3f,%.2f,%.2f\n",
        random_agent.trial, elapsed2, (elapsed2 / random_agent.trial) * 1000, random_agent.best_reward))
    file:write(string.format("bayes,%d,%.3f,%.2f,%.2f\n",
        bayes_agent.trial, elapsed3, (elapsed3 / bayes_agent.trial) * 1000, bayes_agent.best_reward))
    file:close()
    print("\n✓ Results exported to:", csv_file)
end
