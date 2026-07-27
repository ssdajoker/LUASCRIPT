-- Deterministic GSS/AGSS dogfood probe.
-- The Node harness supplies the report boundary; this script supplies the
-- executable LuaJIT reference-runtime evidence.

package.path = "?.lua;?/init.lua;?.lpeg;" .. package.path

local function fail(message)
    io.stderr:write("GSS_DOGFOOD_FAIL " .. message .. "\n")
    os.exit(1)
end

local function check(condition, message)
    if not condition then fail(message) end
end

local function near(actual, expected, epsilon, message)
    check(math.abs(actual - expected) <= epsilon,
        string.format("%s: expected %.12f got %.12f", message, expected, actual))
end

local function module(name)
    local ok, value = pcall(require, name)
    return ok, value
end

-- Parser evidence is optional until LPEG is installed, but the boundary is
-- explicit in the generated report rather than silently treated as a pass.
local parser_ok, gss_grammar = module("gss.grammar.gss")
if parser_ok then
    local parser = require("gss.parser.parser")
    local parsed, err = gss_grammar.parse([[gss dogfood {
        field: gaussian(0, 0, 20);
        ramp: viridis;
    }]])
    check(parsed ~= nil, "GSS parser failed: " .. tostring(err))
    local parsed_ast = parser.to_ast(parsed)
    check(parsed_ast and #parsed_ast.blocks == 1, "GSS AST conversion failed")
    print("GSS_DOGFOOD_PARSER pass")
else
    print("GSS_DOGFOOD_PARSER setup-blocked:lpeg-unavailable")
end

local ast = require("gss.parser.ast")
local semantic = require("gss.parser.semantic")
local lowering = require("gss.ir.lowering")
local engine = require("gss.runtime.engine")
local gaussian = require("gss.runtime.gaussian")
local ramp = require("gss.runtime.ramp")
local iso = require("gss.runtime.iso")
local blend = require("gss.runtime.blend")
local agent = require("gss.agss.agent")

local function gaussian_ast(mu_x, mu_y, sigma)
    return ast.GaussianExpr(ast.Literal(mu_x, "px"), ast.Literal(mu_y, "px"), ast.Literal(sigma, "px"))
end

local field_a = {}
local field_b = {}
gaussian.gaussian_tile(field_a, 0, 0, 16, 16, 8, 8, 4)
gaussian.gaussian_tile(field_b, 0, 0, 16, 16, 4, 4, 3)
near(field_a[8 * 16 + 8], 1, 1e-12, "Gaussian center")
check(field_a[0] < field_a[8 * 16 + 8], "Gaussian falloff")

local mixed = gaussian.mix_fields(field_a, field_b, 0.25, 16, 16)
local summed = gaussian.sum_fields({field_a, field_b}, 16, 16, true)
check(mixed[0] ~= nil and summed[0] ~= nil, "mix/sum output")

local lut = lowering.viridis_lut()
local colored = ramp.apply_ramp_interpolated(field_a, 16, 16, lut)
check(colored[0] ~= nil and colored[1] ~= nil, "ramp output")

local downsampled, down_w, down_h = iso.downsample_field(field_a, 16, 16, 2)
local contours = iso.marching_squares(downsampled, down_w, down_h, 0.5)
check(#contours > 0, "iso contours")

local composited = blend.composite_layers({colored}, 16, 16, {"normal"})
check(composited[0] ~= nil, "composite output")

local stylesheet = ast.Stylesheet({
    ast.Block("dogfood", {
        ast.FieldStmt(gaussian_ast(8, 8, 4)),
        ast.RampStmt("viridis")
    })
})
local context = semantic.analyze(stylesheet)
check(#context.errors == 0, "semantic analysis")
local graph = lowering.lower(stylesheet, context)
check(graph.root ~= nil and #graph.nodes >= 1, "kernel graph lowering")
local render_engine = engine.Engine(16, 16)
local rendered = engine.execute(render_engine, graph)
check(rendered ~= nil and rendered[0] ~= nil, "engine execution")

local config = {
    name = "gss-dogfood-agent",
    target = {metric = "fps", value = 60},
    ranges = {sigma = {min = 3, max = 5, step = 1}},
    budget = {type = "trials", value = 3},
    strategy = "grid",
    record_fields = {"fps", "latency_mean", "checksum"}
}
local optimization_agent = agent.Agent(config)
check(agent.start(optimization_agent, render_engine, graph), "agent start")
local first = agent.step(optimization_agent, render_engine, graph)
check(first and optimization_agent.trial == 1, "agent step")
check(agent.pause(optimization_agent), "agent pause")
check(agent.resume(optimization_agent), "agent resume")
local second = agent.step(optimization_agent, render_engine, graph)
check(second and optimization_agent.trial == 2, "agent resumed step")
agent.stop(optimization_agent)
check(optimization_agent.state == agent.State.STOPPED, "agent stop")

local export_path = os.getenv("GSS_DOGFOOD_EXPORT")
if export_path then
    check(agent.export_csv(optimization_agent, export_path), "agent CSV receipt export")
end

print(string.format("GSS_DOGFOOD_CORE pass nodes=%d contours=%d", #graph.nodes, #contours))
print(string.format("GSS_DOGFOOD_AGENT pass trials=%d", optimization_agent.trial))
print("GSS_DOGFOOD_PASS")
