# LUASCRIPT Mathematical Notation Core And Rehab V18

`examples/mathematical_notation_core.ls` is the first executable slice recovered from the older experimental mathematical showcase.

`examples/mathematical_notation_rehab_v1.ls` through `examples/mathematical_notation_rehab_v18.ls` are the executable rehabilitation slices. They bring back the higher-level mathematical expression style that made the old showcase worth preserving, but only where the parser, transpiler, runtime, and dogfood gates now prove real behavior.

The full showcase in `examples/experimental/mathematical_showcase.ls` remains experimental design material, but it now parses, emits Lua, and executes through the advanced FFT/filter section and final success message. It is covered as an experimental dogfood fixture, not promoted as broad full-DSL support.

## Supported In V0

- Mathematical function notation: `square(x) = x²`
- Unicode arithmetic operators: `×`, `÷`, and `−`
- Unicode comparisons: `≤`, `≥`, and `≠`
- Unary square root: `√value`
- Superscript integer powers on simple identifiers: `x²`, `radius³`
- Unicode constants: `π`, `ℯ`, `φ`, and `∞`
- Numeric subscript identifiers: `x₁`, `x₂`, normalized to valid emitted identifiers
- Standard JS-like runtime calls around mathematical expressions, such as `Math.floor(...)` and `console.log(...)`

## Supported In Rehab V1

- Unicode arrow lambdas in call arguments and pipelines: `x → x²`
- Pipeline expressions: `values |> map(...) |> reduce(...)`
- Inclusive range array literals: `[1..n]`
- Mixed array literals with range expansion: `[0, 2..n-2]`
- Mathematical `let ... in` expressions lowered to executable Lua local scopes
- Implicit multiplication for adjacent factors such as `2x`
- Plain `^` exponentiation after parenthesized expressions
- `mod` as mathematical modulo syntax
- Simple pattern-branch mathematical functions:
  ```ls
  factorial(n) =
    | n ≤ 1 → 1
    | _ → n × factorial(n - 1)
  ```

## Supported In Rehab V2/V3

- Function composition expressions and declarations: `double ∘ increment`, `(f ∘ g)(x) = ...`
- Binary composition expressions: `add ⊙ increment`
- Operator sections as callbacks: `reduce((+), 0)`
- Multiline arrow bodies, multiline call arguments, and multiline `let ... in` bindings
- Tuple callbacks over array-backed tuples: `map((x, y) → x + y)`
- Tuple-object return notation: `(average: μ, count: length(data))`
- Mathematical assignment form `:=` in expression sequences
- Set/collection notation for the tested slice: `∅`, `∪`, `∩`, `∈`, `∉`, `⊂`, `⊃`
- Default function parameters in mathematical declarations
- Bound symbolic identifiers such as `σ²` as parameters/bindings without confusing them with unbound powers like `x²`

## Supported In Rehab V4

- Bare unbound mathematical `i` as the imaginary unit, while bound callback parameters named `i` remain normal variables
- Complex arithmetic for numeric/complex `+`, `-`, `*`, `/`, unary minus, and exponentiation
- Complex helpers: `magnitude(...)`, `real_part(...)`, and `imag_part(...)`
- Runtime DFT helpers for `fft(...)` and `inverse_fft(...)`, including bare pipeline stages such as `signal |> fft |> inverse_fft`
- Euler identity and FFT round-trip coverage in `examples/mathematical_notation_rehab_v4.ls`
- The legacy experimental showcase now executes end to end under the dogfood harness

## Supported In Rehab V5

- Callable mathematical series helpers: `∑(...)`, `summation(...)`, `∏(...)`, and `product(...)`
- Callable calculus helpers: `∫(...)`, `integral(...)`, and `derivative(...)`
- `lim(n→∞, expression)` tolerance-checked against `ℯ` in the V5 fixture
- Deterministic correctness checks for summation, product, integral approximation, derivative approximation, and limit approximation

## Supported In Rehab V6

- Native symbolic binder forms:
  ```ls
  ∑[n = 1..5](n²)
  ∏[n = 1..5](n)
  ∫[x = 0..3, 800](x²)
  ```
- Optional step/resolution after the comma in the binder range: `∑[n = 1..5, 2](n)`
- Bound binder variables are scoped correctly, including `i` as an index instead of the imaginary unit
- Deterministic correctness checks for symbolic summation, stepped summation, product, integral approximation, and bound-index handling

## Supported In Rehab V7

- Braced math-native lower/upper binder forms:
  ```ls
  ∑_{n=1}^{5}(n²)
  ∏_{n=1}^{5}(n)
  ∫_{x=0}^{3, 800}(x²)
  ```
- Upper/lower clauses may appear in either order: `∑_{n=1}^{5}(n²)` and `∑^{5}_{n=1}(n²)`.
- Optional step/resolution is accepted inside the upper clause: `∑_{n=1}^{5, 2}(n)`.
- Math-native binders work inside pipeline callbacks, so `[1..4] |> map(x → ∑_{n=1}^{x}(n))` is executable.
- Math-native binders compose with existing pattern-branch functions, preserving the V1/V3 pipeline and pattern slices.
- Compact glyph-only placement such as `∑₁⁵(n)` is intentionally diagnostic-only for now because it does not declare the bound variable.

## Supported In Rehab V8

- Native derivative binder forms:
  ```ls
  ∂_{x=2}(x³)
  ∂_{x=2, 0.0001}(x³)
  ```
- Native limit binder forms:
  ```ls
  lim_{n→∞}((1 + 1/n)^n)
  ```
- Native derivative binders work inside pipeline callbacks, so `[1..3] |> map(x → abs(∂_{t=x}(t²) - 2*x) < 0.01)` is executable.
- Limit start values such as `lim_{n=10→∞}(...)` are intentionally diagnostic-only for now; V8 uses the runtime numeric approximation policy already proven by `lim(n→∞, expression)`.
- V8 composes with pattern-branch classification, preserving the current executable mathematical style rather than becoming a syntax-only surface.

## Supported In Rehab V9

- Definite integral shorthand with a trailing differential:
  ```ls
  ∫_{0}^{π}(sin(x)) dx
  ∫_{0}^{3, 800}(x²) dx
  ```
- The lower clause may be an expression instead of `x=lower`; the integration variable is taken from the required differential suffix.
- Definite integral shorthand works inside pipeline callbacks, so `[1..3] |> map(b → abs(∫_{0}^{b}(x) dx - (b² / 2)) < 0.001)` is executable.
- Missing differentials are intentionally diagnostic-only because anonymous definite integral syntax must declare the bound variable.

## Supported In Rehab V10

- Bare definite-integral bodies with a trailing differential:
  ```ls
  ∫_{0}^{π} sin(x) dx
  ∫_{0}^{2, 1000} x² + x dx
  ```
- Bare integral bodies still support the existing math expression slice, including implicit multiplication such as `∫_{1}^{4} 2t dt`.
- Bare definite-integral shorthand works inside pipeline callbacks, so `[1..3] |> map(b → abs(∫_{0}^{b} x dx - (b² / 2)) < 0.001)` is executable.
- Missing differentials remain explicit diagnostics; the bare syntax does not guess the integration variable.

## Supported In Rehab V11

- Physics/EE vector operations:
  ```ls
  E · E
  E ⨯ B
  E ⊗ [1, 2]
  ```
- Runtime vector helpers: `vector(...)`, `vec(...)`, `dot(...)`, `cross(...)`, `tensor_product(...)`, `outer(...)`, `norm(...)`, and `unit(...)`.
- Numerical vector-calculus helpers:
  ```ls
  ∇(potential, [1, 2, 3])
  gradient(potential, [1, 2, 3])
  divergence(vector_field, [1, 2, 3])
  curl(vector_field, [1, 2, 3])
  ```
- `∇` is currently an executable alias for numerical `gradient`, not a broad symbolic nabla algebra system.
- Cross product and curl are intentionally strict 3D operations and fail clearly for non-3D vectors.
- V11 composes with pattern branches, Unicode unary minus, arrays, table indexing, and existing runtime numerical helpers.

## Supported In Rehab V12

- Dimension-aware quantity helpers for the tested SI slice:
  ```ls
  unit_add(meters(2), meters(3))
  unit_div(meters(10), seconds(2), "m/s")
  unit_mul(volts(12), amps(2), "W")
  unit_compatible(unit_div(volts(12), amps(2), "Ω"), ohms(1))
  ```
- Unit helpers: `quantity(...)`, `unit_value(...)`, `unit_symbol(...)`, `unit_dimensions(...)`, `unit_compatible(...)`, `unit_add(...)`, `unit_sub(...)`, `unit_mul(...)`, `unit_div(...)`, `unit_pow(...)`, and `unit_convert(...)`.
- SI convenience helpers for the tested slice: `meters`, `seconds`, `kilograms`, `amps`, `volts`, `ohms`, `watts`, `joules`, `coulombs`, `farads`, `henries`, `teslas`, and `newtons`.
- Electrical-engineering phasor and impedance helpers:
  ```ls
  phasor(120, -30)
  phase(source)
  impedance_R(10)
  impedance_L(60, 0.05)
  impedance_C(60, 0.001)
  series_impedance([z_R, z_L, z_C])
  parallel_impedance([impedance_R(10), impedance_R(10)])
  ```
- Additional scalar helpers: `reactance_L(...)`, `reactance_C(...)`, `rms(...)`, and `peak(...)`.
- Incompatible unit addition/subtraction fails clearly at runtime, for example `unit_add(meters(1), seconds(1))` reports `math.unit_add: incompatible dimensions`.
- V12 is executable unit/phasor arithmetic, not a full symbolic dimensional-analysis, Maxwell-equation, or circuit-operator DSL.

## Supported In Rehab V13

- Operator-level quantity arithmetic for the tested unit slice:
  ```ls
  meters(2) + meters(3)
  volts(12) / amps(2)
  watts(24) * seconds(2)
  meters(10) / (seconds(2) ^ 2)
  ```
- Quantity operators reuse the V12 dimension checks. Incompatible additions such as `meters(1) + seconds(1)` fail with `math.unit_add: incompatible dimensions`.
- Matrix and linear-algebra helpers for executable physics/EE calculations:
  ```ls
  matrix([[2, 0], [0, 3]])
  transpose(matrix_value)
  matmul(left, right)
  matrix_vector(transform, state)
  determinant2([[4, 7], [2, 6]])
  solve2([[2, 1], [1, 3]], [8, 13])
  identity(3)
  trace(identity(3))
  ```
- Vector physics helper: `lorentz_force(charge, electric_field, velocity, magnetic_field)` for the tested 3D numeric slice.
- Matrix dimension mismatches fail clearly at runtime, for example `matmul([[1, 2, 3]], [[1, 2, 3]])` reports `math.matmul: inner dimensions must match`.
- V13 is executable operator-unit and matrix physics support; symbolic matrix algebra, eigen systems, PDE solvers, Maxwell-equation syntax, and circuit equation solving remain future slices.

## Supported In Rehab V14

- Symbolic physics expression objects for the tested formula slice:
  ```ls
  m = sym("m")
  a = sym("a")
  symbolic_format(symbolic_simplify((m * 1) + 0))
  symbolic_evaluate((m * a) + 2, {m: 3, a: 4})
  ```
- Runtime symbolic helpers: `sym`, `symbol`, `symbolic`, `symbolic_format`, `symbolic_simplify`, `symbolic_evaluate`, `equation`, `solve_linear`, and `symbolic_solve_linear`.
- Symbolic vector/operator helpers for formula rendering: `symbolic_dot`, `symbolic_cross`, `symbolic_gradient`, `symbolic_divergence`, and `symbolic_curl`.
- Named physics/EE formula registry for the tested slice:
  ```ls
  physics_formula("newton2")
  physics_formula("ohm")
  physics_formula("lorentz_force")
  physics_formula("gauss_electric")
  physics_formula("faraday")
  physics_formula("ampere_maxwell")
  physics_formula("poynting")
  ```
- Linear symbolic equation solving for single-variable algebraic forms such as Ohm's law:
  ```ls
  solve_linear(formula_equation(physics_formula("ohm")), "I")
  ```
- Formula helpers: `formula_name`, `formula_equation`, `formula_lhs`, `formula_rhs`, and `formula_render`.
- Unknown formula names fail clearly at runtime, for example `physics_formula("maxwell_everything")` reports `math.physics_formula: unknown formula maxwell_everything`.
- V14 is the first executable symbolic physics seed. It proves symbolic variables, expression rendering, simplification, numeric evaluation under an environment, named formula rendering, and linear equation solving. It is not yet a full CAS, symbolic tensor calculus, PDE solver, symbolic matrix algebra, or full Maxwell/circuit manipulation engine.

## Supported In Rehab V15

- Dimension-aware symbolic variables:
  ```ls
  V = sym("V", physics_dimensions("voltage"))
  I = sym("I", physics_dimensions("current"))
  R = sym("R", physics_dimensions("resistance"))
  P = sym("P", physics_dimensions("power"))
  ```
- Symbolic dimension propagation and assertions:
  ```ls
  ohm_eq = equation(V, I * R)
  symbolic_dimension_format(I * R)
  symbolic_assert_dimensions(I * R, physics_dimensions("voltage"))
  ```
- Small linear equation-system solving for circuit-style laws:
  ```ls
  power_eq = equation(P, V * I)
  solution = solve_linear_system([ohm_eq, power_eq], ["V", "P"])
  solution_get(solution, "V")
  solution_format(solution, ["V", "P"])
  ```
- The V15 fixture proves `V = I * R` and `P = V * I` as a two-equation symbolic system when `I` and `R` are treated as known symbolic parameters. It renders and evaluates the solved `V` and `P` expressions while preserving voltage and power dimensions.
- Incompatible symbolic dimensions fail clearly at runtime, for example adding voltage and current reports `math.symbolic: incompatible dimensions for add`.
- V15 is still a narrow executable slice. It is not yet arbitrary nonlinear solving, symbolic circuit topology analysis, eigen solving, Laplace-domain transfer functions, PDE manipulation, or full unit-dimensional CAS behavior.

## Supported In Rehab V16

- Symbolic derivatives for the tested algebraic and intrinsic-function slice:
  ```ls
  t = sym("t", physics_dimensions("time"))
  x = sym("x", physics_dimensions("length"))
  symbolic_derivative(x * (t ^ 2), "t")
  symbolic_derivative(symbolic_sin(theta ^ 2), "theta")
  ```
- Symbolic substitution:
  ```ls
  symbolic_substitute(rc_lowpass_transfer(s, R, C), {R: 1000, C: 0.000001})
  ```
- Symbolic intrinsic helpers for dimensionless arguments: `symbolic_sin`, `symbolic_cos`, `symbolic_exp`, and `symbolic_log`.
- Electrical-engineering transfer-function helpers for the tested symbolic Laplace-domain slice: `rc_lowpass_transfer`, `rc_highpass_transfer`, `rl_lowpass_transfer`, and `rl_highpass_transfer`.
- Symbolic impedance helpers and voltage-divider support: `symbolic_impedance_R`, `symbolic_impedance_L`, `symbolic_impedance_C`, and `symbolic_voltage_divider`.
- The V16 fixture proves dimension-aware symbolic derivative output for simple motion expressions, chain-rule output for a trigonometric expression, RC/RL symbolic transfer-function rendering, symbolic capacitor/inductor impedance dimensions, symbolic voltage-divider rendering, and numeric symbolic substitution into a transfer function.
- Unsupported symbolic derivative functions fail clearly at runtime, for example `symbolic_derivative(symbolic_func("tan", x), "x")` reports `math.symbolic_derivative: unsupported function tan`.
- V16 is still a narrow executable slice. It is not a general nonlinear CAS, arbitrary ODE/PDE solver, Bode plotting system, SPICE-like circuit-topology solver, or full symbolic units engine.

## Supported In Rehab V17

- Executable frequency-response evaluation for symbolic transfer functions:
  ```ls
  rc_low = rc_lowpass_transfer(s, R, C)
  response = frequency_response(rc_low, {R: 1000, C: 0.000001}, rc_cutoff_frequency(1000, 0.000001))
  response_magnitude(response)
  response_db(response)
  response_phase(response)
  ```
- RC/RL time constants and cutoff-frequency helpers: `rc_time_constant`, `rl_time_constant`, `rc_cutoff_frequency`, and `rl_cutoff_frequency`.
- Series-RLC numeric design helpers: `rlc_resonant_frequency`, `rlc_quality_series`, and `rlc_bandwidth_series`.
- Symbolic series-RLC impedance rendering:
  ```ls
  rlc_series_impedance(s, R, L, C)
  ```
- The V17 fixture proves the RC low-pass and high-pass -3 dB cutoff point, expected +/-45 degree phase behavior, RL low-pass cutoff behavior, series-RLC resonance magnitude/phase, RLC Q, bandwidth, and symbolic series impedance shape.
- Invalid frequency-response parameters and non-positive RLC values fail clearly at runtime instead of producing partial or misleading results.
- V17 is not a full Bode plotting package, SPICE-like topology solver, arbitrary filter-synthesis engine, or broad symbolic network-analysis system.

## Supported In Rehab V18

- Frequency sweep generation for Bode-style analysis:
  ```ls
  frequency_sweep(10, 100000, 5, "log")
  frequency_sweep(0.1, 0.5, 5, "linear")
  ```
- Swept response execution over symbolic transfer functions:
  ```ls
  responses = frequency_response_sweep(rc_low, {R: 1000, C: 0.000001}, freqs)
  ```
- Bode column extraction helpers: `response_magnitudes`, `response_db_values`, and `response_phases`.
- Response lookup and analysis helpers: `response_peak`, `response_trough`, `response_nearest`, `response_is_monotonic_db`, and `response_crossing_frequency`.
- The V18 fixture proves log/linear sweep generation, monotonic low-pass/high-pass dB behavior, magnitude and phase column extraction, peak/trough response lookup, nearest-frequency lookup, and -3 dB crossing estimation for the tested RC transfer-function slice.
- Invalid sweep counts and missing dB crossings fail clearly at runtime.
- V18 is executable Bode-data support, not a full plotting/reporting engine, optimizer, filter-synthesis package, or SPICE-like network solver.

## Still Experimental

- Full complex-analysis semantics beyond the tested arithmetic/DFT helper slice
- Full set algebra beyond array-backed runtime helpers
- Full tuple/record typing and destructuring beyond array-backed tuple callbacks
- Full symbolic limit semantics; callable `lim(n→∞, expression)` and native `lim_{n→∞}(expression)` currently use numeric approximation for executable cases
- Richer symbolic summation/product/integral notation such as compact lower/upper glyph placement and multi-variable binders
- Broader symbolic calculus notation, derivative/limit variants, PDE operators, tensor calculus, symbolic dimensional unit algebra, full Maxwell-equation manipulation, symbolic circuit equations, eigen systems, Bode plotting/reporting, circuit topology solving, and differential forms
- Parenthesized and bare definite-integral bodies are supported for the tested anonymous shorthand forms; richer integral variants remain future syntax.
- V11/V12/V13 physics and electrical-engineering support is numerical and executable for the tested vector, unit, phasor, impedance, matrix, and Lorentz-force slices. V14 adds a tested symbolic formula/equation seed. V15 adds a tested dimension-aware symbolic equation-system slice. V16 adds tested symbolic derivatives, substitution, and RC/RL transfer-function helpers. V17 adds tested frequency-response, cutoff, resonance, Q, bandwidth, and series-RLC impedance helpers. V18 adds tested swept Bode-data helpers; full symbolic physics/EE manipulation remains future work.

Unsupported mathematical DSL features should remain explicit parser or unsupported-feature diagnostics until they have executable tests.

## Gate

The V0/V1/V2/V3/V4/V5/V6/V7/V8/V9/V10/V11/V12/V13/V14/V15/V16/V17/V18 slices are covered by:

- `npm run test:actual-programs`
- `npm run clarity:dogfood`
- `node tests/examples_integration.test.js`
