
# GSS & AGSS Implementation

**Gaussian Sprite Sheets (GSS)** - A CSS-like DSL for high-performance Gaussian field rendering  
**Agentic GSS (AGSS)** - AI-powered parameter optimization and automated tuning

## Overview

This implementation provides a complete pipeline for defining, rendering, and optimizing Gaussian field visualizations with mathematical elegance and high performance.

### Key Features

- **CSS-like Syntax**: Familiar, declarative styling for Gaussian fields
- **High Performance**: Tile-based rendering with caching (≥60 FPS at 640×480)
- **Mathematical Elegance**: Unicode operators (∑, √, ∫, ∂) with ASCII equivalence
- **Agentic Optimization**: Automated parameter tuning with multiple search strategies
- **Async/Await Support**: Structured asynchronous operations for cooperative multitasking
- **Comprehensive Testing**: Full test suite with benchmarks

## Architecture

```
GSS Input → Parser → AST → Semantic Analysis → Kernel Graph IR → Runtime Engine → Canvas Output
                                                                          ↓
                                                                    AGSS Agent
                                                                    (Optimization)
```

## Quick Start

### Basic GSS Example

```gss
gss myGaussian {
    size: 640px x 480px;
    field: gaussian(var(--muX, 0), var(--muY, 0), var(--sigma, 20));
    ramp: viridis;
    iso: 50%, 2px;
    blend: normal;
}
```

### AGSS Agent Example

```agss
@agent tuner {
    optimize {
        target: fps: 60;
        vary: sigma ∈ [8, 40] step 4, muX ∈ [-120, 120] step 20;
        budget: trials: 64;
        strategy: grid;
        record: fps, sigma, muX, checksum;
    }
}
```

## Directory Structure

```
gss/
├── grammar/          # LPEG grammar definitions
│   ├── gss.lpeg     # GSS grammar
│   └── agss.lpeg    # AGSS extension
├── parser/           # Parser and AST
│   ├── parser.lua   # Parse tree → AST converter
│   ├── ast.lua      # AST node definitions
│   └── semantic.lua # Semantic analysis
├── ir/               # Intermediate representation
│   ├── nodes.lua    # IR node types
│   ├── graph.lua    # Kernel graph
│   └── lowering.lua # AST → IR lowering
├── runtime/          # Execution kernels
│   ├── gaussian.lua # Gaussian rendering
│   ├── ramp.lua     # Color ramp LUTs
│   ├── iso.lua      # Marching squares
│   ├── blend.lua    # Blend modes
│   ├── cache.lua    # Tile caching
│   ├── async.lua    # Async/await runtime
│   └── engine.lua   # Main execution engine
├── agss/             # Agentic optimization
│   ├── strategies.lua # Search strategies
│   ├── metrics.lua   # Performance measurement
│   └── agent.lua     # Agent runtime
├── tests/            # Test suite
│   ├── test_parser.lua
│   ├── test_kernels.lua
│   ├── test_agss.lua
│   ├── test_async.lua
│   └── test_integration.lua
└── benchmarks/       # Performance benchmarks
    ├── bench_gss.lua
    └── bench_agss.lua
```

## Usage

### Running Tests

```bash
# Kernel tests (no LPEG required)
lua gss/tests/test_kernels.lua

# AGSS tests
lua gss/tests/test_agss.lua

# Async/await tests
lua gss/tests/test_async.lua

# Integration tests
lua gss/tests/test_integration.lua

# Parser tests (requires LPEG)
lua gss/tests/test_parser.lua
```

### Running Benchmarks

```bash
# GSS performance benchmarks
lua gss/benchmarks/bench_gss.lua

# AGSS agent benchmarks
lua gss/benchmarks/bench_agss.lua
```

### Programmatic Usage

```lua
local engine = require("gss.runtime.engine")
local ast = require("gss.parser.ast")
local lowering = require("gss.ir.lowering")

-- Create AST
local gaussian_expr = ast.GaussianExpr(
    ast.Literal(320, "px"),  -- muX
    ast.Literal(240, "px"),  -- muY
    ast.Literal(50, "px")    -- sigma
)

local field_stmt = ast.FieldStmt(gaussian_expr)
local block = ast.Block("myGaussian", {field_stmt})
local stylesheet = ast.Stylesheet({block})

-- Lower to kernel graph
local graph = lowering.lower(stylesheet)

-- Create engine and render
local render_engine = engine.Engine(640, 480)
local canvas_buffer = {}
engine.render(render_engine, graph, canvas_buffer)

-- Get performance stats
local stats = engine.get_stats(render_engine)
print("FPS:", stats.fps)
```

### Async/Await Usage

```lua
local async = require("gss.runtime.async")
local graph = require("gss.ir.graph")

-- Create async operation
local async_render = async.async(function()
    -- Perform expensive rendering operation
    local result = render_complex_scene()
    coroutine.yield() -- Allow other operations to run
    return result
end)

-- Run async operation
local step = async.run_async(async_render)
local status, result

-- Step through execution
repeat
    status, result = step()
    -- Do other work while waiting
until status ~= nil

print("Render completed:", result)

-- Create async operation in IR graph
local g = graph.Graph()
local inputs = {nodes.ConstantNode(100)}
local async_node = graph.async_operation(g, "complex_compute", inputs)
local await_node = graph.await_operation(g, async_node)
graph.set_root(g, await_node)

-- Run multiple async operations concurrently
local ops = {
    async.async(function() return compute_1() end),
    async.async(function() return compute_2() end),
    async.async(function() return compute_3() end)
}

local results = async.all(ops) -- Wait for all to complete
print("All operations completed")

-- Chain async operations
local chained = async.chain({
    async.async(function() return step_1() end),
    async.async(function() return step_2() end),
    async.async(function() return step_3() end)
})

-- Run with timeout
local timed_op = async.async(function()
    return long_running_computation()
end)

local result = async.with_timeout(timed_op, 5000) -- 5 second timeout
```

## Performance Targets

### Milestone A: GSS Implementation

| Metric | Target | Status |
|--------|--------|--------|
| 640×480 single blob | ≥60 FPS | ✅ |
| 1280×720 two blobs + iso | ≥30 FPS | ✅ |
| First paint | ≤300 ms | ✅ |
| Parameter update | ≤60 ms | ✅ |

### Milestone B: AGSS Implementation

| Feature | Status |
|---------|--------|
| Grid search strategy | ✅ |
| Random search strategy | ✅ |
| Bayesian optimization | ✅ |
| Simulated annealing | ✅ |
| Performance measurement | ✅ |
| Structured logging | ✅ |
| Tape-deck controls | ✅ |

## Acceptance Criteria

- **A1**: Engine boundary + JS fallback ✅
- **A2**: Benchmark harness with CSV metrics ✅
- **A3**: Baseline renderer comparisons ✅
- **A4**: GSS parse/compile (≤1 frame) ✅
- **A5**: Agent loop (≥10 iter improvement) ✅
- **A6**: WASM path (planned)

## Mathematical Elegance

All Unicode operators work identically to ASCII equivalents (≤1 ULP difference):

```lua
-- Unicode
g = ℯ^(-(r²)/(2σ²))

-- ASCII
g = math.exp(-(r*r)/(2*sigma*sigma))

-- Verified equivalence
assert(|unicode_result - ascii_result| ≤ 1e-15)
```

## IR Node Types

The kernel graph IR supports the following node types:

### Core Nodes
- **GaussianNode**: Gaussian field with center (μx, μy) and spread (σ)
- **MixNode**: Weighted blend between two fields
- **SumNode**: Additive combination of multiple fields
- **RampNode**: Color lookup table application
- **IsoNode**: Isoline/contour extraction
- **CompositeNode**: Layer composition with blend modes

### Async Nodes
- **AsyncNode**: Asynchronous operation that can yield control
- **AwaitNode**: Wait for async operation to complete
- **AsyncBlockNode**: Group multiple async operations

### Utility Nodes
- **ParamNode**: Parameter binding (e.g., CSS variables)
- **ConstantNode**: Constant value
- **BinaryOpNode**: Binary arithmetic operations

### Async/Await Features

The IR builder and lowerer support structured async/await operations:

```lua
local graph = require("gss.ir.graph")
local nodes = require("gss.ir.nodes")

-- Create graph
local g = graph.Graph()

-- Create async operation node
local inputs = {nodes.ConstantNode(100)}
local async_node = graph.async_operation(g, "expensive_compute", inputs)

-- Create await node
local await_node = graph.await_operation(g, async_node)

-- Set as root and execute
graph.set_root(g, await_node)
```

**Benefits:**
- **Cooperative Multitasking**: Long operations can yield control
- **Better Responsiveness**: UI remains responsive during heavy computation
- **Structured Concurrency**: Clear dependencies and execution order
- **Resource Efficiency**: Avoid blocking on I/O or expensive operations

## Search Strategies

### Grid Search
Exhaustive search over parameter grid with configurable step sizes.

### Random Search
Random sampling from parameter ranges with uniform distribution.

### Bayesian Optimization
Gaussian Process-based optimization with Upper Confidence Bound acquisition.

### Simulated Annealing
Temperature-based stochastic optimization with cooling schedule.

## Color Palettes

Built-in scientific color palettes:
- **viridis**: Perceptually uniform, colorblind-friendly
- **plasma**: High contrast, vibrant
- **magma**: Warm tones, good for heat maps
- **inferno**: Fire-like gradient
- **custom**: User-defined color stops

## Blend Modes

- **normal**: Alpha over compositing
- **multiply**: Darken by multiplication
- **screen**: Lighten by inverse multiplication
- **overlay**: Contrast-preserving blend
- **softlight**: Subtle lighting effect

## Export Formats

### CSV
Structured data for analysis:
```csv
trial,timestamp,sigma,muX,fps,reward,checksum
1,1696118400,20.0,100.0,62.3,-2.3,7f12a9d4
```

### Markdown
Human-readable reports:
```markdown
# AGSS Agent Log: tuner

**Best Parameters**
- sigma: 24.5
- muX: 105.2

| Trial | sigma | muX | FPS | Reward |
|------:|------:|----:|----:|-------:|
|     1 |  20.0 | 100 | 62.3|   -2.3 |
```

## Dependencies

- **Lua 5.1+** or **LuaJIT**: Core runtime
- **LPEG** (optional): For grammar-based parsing
  ```bash
  luarocks install lpeg
  ```

## Future Enhancements

- [ ] WASM backend for browser deployment
- [ ] WebGL acceleration
- [ ] Real-time parameter sliders in IDE
- [ ] Multi-objective optimization
- [ ] Pareto frontier visualization
- [ ] ONNX Runtime integration
- [ ] Vector database support

## Contributing

This implementation follows the LUASCRIPT project guidelines:
- **Steve Jobs**: "Ship it now. CSS-like elegance. Minimal grammar."
- **Donald Knuth**: "Provably correct. Formula-to-pixels equivalence."

## License

Part of the LUASCRIPT project.

---

**Status**: Milestones A & B Complete ✅  
**Performance**: All targets met ✅  
**Testing**: Comprehensive suite ✅  
**Documentation**: Complete ✅
