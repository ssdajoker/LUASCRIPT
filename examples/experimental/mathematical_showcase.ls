// LUASCRIPT Mathematical Masterpiece - Donald Knuth's Dream Language
// Showcasing why developers will fall in love with mathematical programming

// ═══════════════════════════════════════════════════════════════════════════════
// I. PURE MATHEMATICAL FUNCTION DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

// Mathematical constants with infinite precision beauty
e = lim(n→∞, (1 + 1/n)^n)
φ = (1 + √5) / 2  // Golden ratio
π = 4 × atan(1)

// Calculus expressed as pure mathematics
derivative(f, x, h=1e-10) = (f(x + h) - f(x - h)) / (2h)
integral(f, a, b, n=10000) = 
  let Δx = (b - a) / n in
  [0..n-1]
    |> map(i → f(a + i × Δx + Δx/2) × Δx)
    |> reduce((∑, area) → ∑ + area, 0)

// Series expansions with mathematical elegance
taylor_sin(x, terms=10) = [0..terms-1]
  |> filter(n → n mod 2 = 1)  // Odd terms only
  |> map(n → (-1)^((n-1)/2) × x^n / factorial(n))
  |> reduce((∑, term) → ∑ + term, 0)

factorial(n) = 
  | n ≤ 1 → 1
  | _ → n × factorial(n - 1)

// ═══════════════════════════════════════════════════════════════════════════════
// II. FUNCTIONAL COMPOSITION AND HIGHER-ORDER MATHEMATICS
// ═══════════════════════════════════════════════════════════════════════════════

// Beautiful function composition operators
(f ∘ g)(x) = f(g(x))
(f ⊙ g)(x) = λx. f(x, g(x))  // Binary composition

// Mathematical transformations as pure functions
fourier_coefficient(f, n, period=2π) = 
  (2/period) × integral(t → f(t) × cos(2π × n × t / period), 0, period)

// Optimization using mathematical descent
gradient_descent(f, x₀, α=0.01, ε=1e-6) = 
  let grad = x → derivative(f, x) in
  iterate_until(
    x → x - α × grad(x),
    x₀,
    x → abs(grad(x)) < ε
  )

// ═══════════════════════════════════════════════════════════════════════════════
// III. STATISTICAL ANALYSIS WITH MATHEMATICAL BEAUTY
// ═══════════════════════════════════════════════════════════════════════════════

// Statistical moments with functional elegance
mean(data) = data |> reduce((+), 0) / length(data)
variance(data) = 
  let μ = mean(data) in
  data |> map(x → (x - μ)²) |> mean
std_dev(data) = √(variance(data))

// Probability distributions as mathematical functions
normal_pdf(μ, σ²) = x → 
  (1 / √(2π × σ²)) × e^(-(x - μ)² / (2 × σ²))

// Regression analysis with linear algebra beauty
linear_regression(points) =
  let n = length(points),
      Σx = points |> map((x, y) → x) |> reduce((+), 0),
      Σy = points |> map((x, y) → y) |> reduce((+), 0),
      Σxy = points |> map((x, y) → x × y) |> reduce((+), 0),
      Σx² = points |> map((x, y) → x²) |> reduce((+), 0) in
  slope = (n × Σxy - Σx × Σy) / (n × Σx² - Σx²),
  intercept = (Σy - slope × Σx) / n,
  (slope: slope, intercept: intercept)

// ═══════════════════════════════════════════════════════════════════════════════
// IV. ADVANCED ALGORITHMS AS MATHEMATICAL EXPRESSIONS
// ═══════════════════════════════════════════════════════════════════════════════

// Fast Fourier Transform with mathematical recursion.
// Preserved as design material; executable filters use the runtime FFT helper
// until this reference sketch gets a dedicated zero-based indexing slice.
reference_fft(signal) = 
  | length(signal) = 1 → signal
  | _ → 
      let n = length(signal),
          even = [0, 2..n-2] |> map(i → signal[i]),
          odd = [1, 3..n-1] |> map(i → signal[i]),
          fft_even = reference_fft(even),
          fft_odd = reference_fft(odd) in
      [0..n-1] |> map(k →
        let ω = e^(-2π × i × k / n),
            t = ω × fft_odd[k mod (n/2)] in
        | k < n/2 → fft_even[k] + t
        | _ → fft_even[k - n/2] - t)

// Graph algorithms with functional beauty
dijkstra(graph, start) = 
  let vertices = keys(graph),
      distances = vertices |> map(v → (v, ∞)) |> dict,
      visited = ∅ in
  distances[start] := 0,
  iterate_until(
    state → 
      let current = unvisited_min(distances, visited) in
      visited := visited ∪ {current},
      neighbors(graph, current)
        |> filter(v → v ∉ visited)
        |> map(v → distances[v] := min(
            distances[v], 
            distances[current] + weight(graph, current, v)
          )),
    (distances, visited),
    (dist, vis) → vis = vertices
  )

// ═══════════════════════════════════════════════════════════════════════════════
// V. REAL-WORLD MATHEMATICAL APPLICATIONS
// ═══════════════════════════════════════════════════════════════════════════════

// Financial mathematics with compound elegance
compound_interest(principal, rate, periods, time) =
  principal × (1 + rate/periods)^(periods × time)

black_scholes(S, K, T, r, σ) =
  let d₁ = (ln(S/K) + (r + σ²/2) × T) / (σ × √T),
      d₂ = d₁ - σ × √T,
      N = normal_cdf in  // Standard normal CDF
  call_price = S × N(d₁) - K × e^(-r × T) × N(d₂),
  put_price = K × e^(-r × T) × N(-d₂) - S × N(-d₁),
  (call: call_price, put: put_price)

// Signal processing with mathematical transforms
butterworth_filter(signal, cutoff, order=4) =
  signal 
    |> fft 
    |> map_indexed((f, i) → 
        let ω = 2π × i / length(signal),
            H = 1 / √(1 + (ω/cutoff)^(2×order)) in
        f × H)
    |> inverse_fft

// ═══════════════════════════════════════════════════════════════════════════════
// VI. DEMONSTRATION OF MATHEMATICAL ELEGANCE
// ═══════════════════════════════════════════════════════════════════════════════

main() =
  "🎯 LUASCRIPT Mathematical Showcase - The Future of Programming" |> console.log,
  "═".repeat(80) |> console.log,
  
  // Calculus demonstrations
  "📐 CALCULUS & ANALYSIS:" |> console.log,
  let f = x → x³ - 2×x² + x - 1 in
  derivative(f, 2) |> (d → "f'(2) = " + d) |> console.log,
  integral(sin, 0, π) |> (i → "∫₀^π sin(x)dx = " + i) |> console.log,
  
  // Series convergence
  taylor_sin(π/6, 15) |> (s → "sin(π/6) ≈ " + s) |> console.log,
  
  // Statistical analysis with pipeline beauty
  "📊 STATISTICAL ANALYSIS:" |> console.log,
  dataset = [1..100] |> map(x → x + random_normal(0, 5)),
  dataset 
    |> (data → (
        mean: mean(data),
        std: std_dev(data),
        size: length(data)
      )) 
    |> (stats → "Dataset statistics: " + stats) |> console.log,
  
  // Financial mathematics
  "💰 FINANCIAL MATHEMATICS:" |> console.log,
  compound_interest(1000, 0.05, 12, 10) 
    |> (amount → "$1000 @ 5% for 10 years = $" + amount) |> console.log,
    
  // Optimization demonstration
  "🎯 OPTIMIZATION:" |> console.log,
  let objective = x → (x - 3)² + 5 in
  gradient_descent(objective, 0)
    |> (min → "Minimum of f(x) = (x-3)² + 5 at x = " + min) |> console.log,
  
  // Advanced data analysis pipeline
  "🔬 ADVANCED DATA ANALYSIS:" |> console.log,
  experimental_data = [(1,2.1), (2,3.9), (3,6.2), (4,7.8), (5,10.1)],
  experimental_data
    |> linear_regression
    |> (reg → "Linear regression: y = " + reg.slope + "x + " + reg.intercept)
    |> console.log,
  
  // Complex mathematical composition
  "🌟 FUNCTIONAL COMPOSITION MASTERPIECE:" |> console.log,
  [1..10]
    |> map(x → x / 10.0)                    // Normalize to [0,1]
    |> map(normal_pdf(0.5, 0.1))           // Apply normal distribution
    |> map(x → x × sin(20 × π × x))        // Modulate with sine wave
    |> (signal → butterworth_filter(signal, 0.3))  // Apply filter
    |> map(x → x²)                         // Square the signal
    |> reduce((∑, x) → ∑ + x, 0)           // Compute energy
    |> (energy → "Signal energy: " + energy) |> console.log,
    
  "🎉 Mathematical programming has never been more beautiful!" |> console.log

// Execute the mathematical showcase
main()

// ═══════════════════════════════════════════════════════════════════════════════
// VII. WHY DEVELOPERS WILL LOVE LUASCRIPT
// ═══════════════════════════════════════════════════════════════════════════════

/*
🌟 LUASCRIPT ADVANTAGES OVER TRADITIONAL LANGUAGES:

1. MATHEMATICAL ELEGANCE:
   - Functions defined as f(x) = expression (pure mathematics)
   - Pipeline operators |> create readable data flow
   - Pattern matching replaces verbose conditionals
   - Mathematical symbols (∑, π, ∞) are first-class

2. FUNCTIONAL BEAUTY:
   - Function composition with ∘ operator
   - Immutable data structures by default
   - Higher-order functions are natural
   - No side effects unless explicitly requested

3. PERFORMANCE THROUGH CLARITY:
   - Mathematical expressions compile to optimal code
   - Pattern matching generates efficient branches
   - Pipeline operations optimize to SIMD when possible
   - Type inference eliminates runtime checks

4. DOMAIN-SPECIFIC POWER:
   - Scientific computing feels natural
   - Financial mathematics is expressive
   - Data science becomes poetry
   - Algorithm implementation matches mathematical literature

5. READABILITY REVOLUTION:
   - Code reads like mathematical papers
   - Complex algorithms are self-documenting  
   - Functional pipelines eliminate cognitive load
   - Mathematical notation is universally understood

Compare traditional imperative code to LUASCRIPT mathematical elegance:
The difference is night and day! 🌙➡️☀️
*/
