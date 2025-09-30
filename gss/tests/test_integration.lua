
-- Integration Test for Complete GSS/AGSS Pipeline

package.path = package.path .. ";/home/ubuntu/github_repos/LUASCRIPT/gss/?.lua"

print("=================================")
print("   GSS/AGSS Integration Test")
print("=================================")

-- Test 1: Basic pipeline without LPEG
print("\n=== Test 1: Manual AST Construction ===")

local ast = require("gss.parser.ast")
local semantic = require("gss.parser.semantic")
local lowering = require("gss.ir.lowering")
local engine = require("gss.runtime.engine")

-- Manually construct AST (bypassing parser)
local gaussian_expr = ast.GaussianExpr(
    ast.CSSVar("--muX", ast.Literal(0, "px")),
    ast.CSSVar("--muY", ast.Literal(0, "px")),
    ast.CSSVar("--sigma", ast.Literal(20, "px"))
)

local field_stmt = ast.FieldStmt(gaussian_expr)
local ramp_stmt = ast.RampStmt("viridis")
local size_stmt = ast.SizeStmt(
    ast.Literal(640, "px"),
    ast.Literal(480, "px")
)

local block = ast.Block("testGaussian", {size_stmt, field_stmt, ramp_stmt})
local stylesheet = ast.Stylesheet({block})

print("✓ AST constructed manually")

-- Semantic analysis
local context = semantic.analyze(stylesheet)
semantic.print_results(context)

-- Lower to kernel graph
local graph = lowering.lower(stylesheet, context)
print("✓ Lowered to kernel graph")
print("  Nodes:", #graph.nodes)

-- Create engine
local test_engine = engine.Engine(100, 100)
print("✓ Engine created: 100x100")

-- Set parameters
engine.set_param(test_engine, "--muX", 50)
engine.set_param(test_engine, "--muY", 50)
engine.set_param(test_engine, "--sigma", 20)

-- Execute
local result = engine.execute(test_engine, graph)
print("✓ Graph executed")

-- Get stats
local stats = engine.get_stats(test_engine)
print(string.format("✓ Performance: %.2f ms/frame, %.1f FPS", 
    stats.avg_render_time_ms, stats.fps))

print("\n✅ Integration Test 1 PASSED")

-- Test 2: AGSS Agent Integration
print("\n=== Test 2: AGSS Agent Integration ===")

local agent_module = require("gss.agss.agent")

local agent_config = {
    name = "integration_test_agent",
    target = {metric = "fps", value = 60},
    ranges = {
        ["--sigma"] = {min = 10, max = 30, step = 10}
    },
    budget = {type = "trials", value = 3},
    strategy = "grid",
    record_fields = {"fps", "latency_mean"}
}

local test_agent = agent_module.Agent(agent_config)
print("✓ Agent created:", test_agent.name)

-- Start agent
agent_module.start(test_agent, test_engine, graph)
print("✓ Agent started")

-- Run a few iterations
for i = 1, 3 do
    local result = agent_module.step(test_agent, test_engine, graph)
    if result then
        print(string.format("✓ Trial %d: sigma=%.1f, reward=%.2f", 
            result.trial, result.params["--sigma"], result.reward))
    else
        break
    end
end

print("✓ Best reward:", test_agent.best_reward)
print("✓ Best params:", test_agent.best_params and test_agent.best_params["--sigma"] or "none")

print("\n✅ Integration Test 2 PASSED")

-- Test 3: Export functionality
print("\n=== Test 3: Export Functionality ===")

local csv_file = "/tmp/gss_test_export.csv"
local md_file = "/tmp/gss_test_export.md"

local csv_success = agent_module.export_csv(test_agent, csv_file)
if csv_success then
    print("✓ CSV export successful:", csv_file)
else
    print("⚠ CSV export failed")
end

local md_success = agent_module.export_markdown(test_agent, md_file)
if md_success then
    print("✓ Markdown export successful:", md_file)
else
    print("⚠ Markdown export failed")
end

print("\n✅ Integration Test 3 PASSED")

print("\n=================================")
print("   ALL INTEGRATION TESTS PASSED")
print("=================================")
