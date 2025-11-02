
-- GSS Performance Benchmark Suite

package.path = package.path .. ";/home/ubuntu/github_repos/LUASCRIPT/gss/?.lua"

local gaussian = require("gss.runtime.gaussian")
local engine = require("gss.runtime.engine")
local ast = require("gss.parser.ast")
local lowering = require("gss.ir.lowering")

print("=================================")
print("   GSS Performance Benchmarks")
print("=================================")

-- Benchmark 1: Single Gaussian at 640x480
print("\n=== Benchmark 1: Single Gaussian (640x480) ===")

local w1, h1 = 640, 480
local buf1 = {}

local start1 = os.clock()
local frames1 = 0

while os.clock() - start1 < 2.0 do
    gaussian.gaussian_tile(buf1, 0, 0, w1, h1, 320, 240, 50)
    frames1 = frames1 + 1
end

local elapsed1 = os.clock() - start1
local fps1 = frames1 / elapsed1

print(string.format("Frames: %d", frames1))
print(string.format("Time: %.3f seconds", elapsed1))
print(string.format("FPS: %.1f", fps1))
print(string.format("Frame time: %.2f ms", (elapsed1 / frames1) * 1000))

if fps1 >= 60 then
    print("✅ PASSED: Target ≥60 FPS achieved")
else
    print("⚠ WARNING: Below target (60 FPS)")
end

-- Benchmark 2: Two Gaussians at 1280x720
print("\n=== Benchmark 2: Two Gaussians (1280x720) ===")

local w2, h2 = 1280, 720
local buf2a = {}
local buf2b = {}

local start2 = os.clock()
local frames2 = 0

while os.clock() - start2 < 2.0 do
    gaussian.gaussian_tile(buf2a, 0, 0, w2, h2, 400, 360, 80)
    gaussian.gaussian_tile(buf2b, 0, 0, w2, h2, 880, 360, 80)
    frames2 = frames2 + 1
end

local elapsed2 = os.clock() - start2
local fps2 = frames2 / elapsed2

print(string.format("Frames: %d", frames2))
print(string.format("Time: %.3f seconds", elapsed2))
print(string.format("FPS: %.1f", fps2))
print(string.format("Frame time: %.2f ms", (elapsed2 / frames2) * 1000))

if fps2 >= 30 then
    print("✅ PASSED: Target ≥30 FPS achieved")
else
    print("⚠ WARNING: Below target (30 FPS)")
end

-- Benchmark 3: First paint latency
print("\n=== Benchmark 3: First Paint Latency ===")

local w3, h3 = 640, 480
local buf3 = {}

local start3 = os.clock()
gaussian.gaussian_tile(buf3, 0, 0, w3, h3, 320, 240, 50)
local first_paint = (os.clock() - start3) * 1000

print(string.format("First paint: %.2f ms", first_paint))

if first_paint <= 300 then
    print("✅ PASSED: Target ≤300 ms achieved")
else
    print("⚠ WARNING: Above target (300 ms)")
end

-- Benchmark 4: Parameter update latency
print("\n=== Benchmark 4: Parameter Update Latency ===")

local test_engine = engine.Engine(640, 480)

-- Create simple graph
local gaussian_expr = ast.GaussianExpr(
    ast.CSSVar("--muX", ast.Literal(0, "px")),
    ast.CSSVar("--muY", ast.Literal(0, "px")),
    ast.CSSVar("--sigma", ast.Literal(20, "px"))
)

local field_stmt = ast.FieldStmt(gaussian_expr)
local block = ast.Block("bench", {field_stmt})
local stylesheet = ast.Stylesheet({block})
local graph = lowering.lower(stylesheet)

-- Initial render
engine.set_param(test_engine, "--muX", 320)
engine.set_param(test_engine, "--muY", 240)
engine.set_param(test_engine, "--sigma", 50)
engine.execute(test_engine, graph)

-- Measure parameter update
local start4 = os.clock()
engine.set_param(test_engine, "--sigma", 30)
engine.execute(test_engine, graph)
local update_latency = (os.clock() - start4) * 1000

print(string.format("Parameter update: %.2f ms", update_latency))

if update_latency <= 60 then
    print("✅ PASSED: Target ≤60 ms achieved")
else
    print("⚠ WARNING: Above target (60 ms)")
end

-- Benchmark 5: Cache effectiveness
print("\n=== Benchmark 5: Cache Effectiveness ===")

engine.reset_stats(test_engine)

-- Render same parameters multiple times
for i = 1, 100 do
    engine.execute(test_engine, graph)
end

local stats = engine.get_stats(test_engine)

print(string.format("Cache hits: %d", stats.cache_hits))
print(string.format("Cache misses: %d", stats.cache_misses))
print(string.format("Hit rate: %.1f%%", stats.cache_hit_rate * 100))

if stats.cache_hit_rate > 0.9 then
    print("✅ PASSED: Cache hit rate >90%")
else
    print("⚠ WARNING: Low cache hit rate")
end

-- Summary
print("\n=================================")
print("   Benchmark Summary")
print("=================================")
print(string.format("640x480 single blob: %.1f FPS %s", fps1, fps1 >= 60 and "✅" or "⚠"))
print(string.format("1280x720 two blobs: %.1f FPS %s", fps2, fps2 >= 30 and "✅" or "⚠"))
print(string.format("First paint: %.2f ms %s", first_paint, first_paint <= 300 and "✅" or "⚠"))
print(string.format("Param update: %.2f ms %s", update_latency, update_latency <= 60 and "✅" or "⚠"))
print(string.format(
    "Cache hit rate: %.1f%% %s",
    stats.cache_hit_rate * 100,
    stats.cache_hit_rate > 0.9 and "✅" or "⚠"
))
print("=================================")

-- Export results to CSV
local csv_file = "/tmp/gss_benchmark_results.csv"
local file = io.open(csv_file, "w")

if file then
    file:write("benchmark,metric,value,unit,status\n")
    file:write(string.format(
        "single_gaussian_640x480,fps,%.2f,fps,%s\n",
        fps1,
        fps1 >= 60 and "pass" or "warn"
    ))
    file:write(string.format(
        "two_gaussians_1280x720,fps,%.2f,fps,%s\n",
        fps2,
        fps2 >= 30 and "pass" or "warn"
    ))
    file:write(string.format(
        "first_paint,latency,%.2f,ms,%s\n",
        first_paint,
        first_paint <= 300 and "pass" or "warn"
    ))
    file:write(string.format(
        "param_update,latency,%.2f,ms,%s\n",
        update_latency,
        update_latency <= 60 and "pass" or "warn"
    ))
    file:write(string.format(
        "cache,hit_rate,%.2f,percent,%s\n",
        stats.cache_hit_rate * 100,
        stats.cache_hit_rate > 0.9 and "pass" or "warn"
    ))
    file:close()
    print("\n✓ Results exported to:", csv_file)
end
