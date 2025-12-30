
/**
 * LUASCRIPT Performance Tools - GPU Acceleration, Profiling, Optimization
 * Tony Yoka's Unified Team Implementation
 * 
 * Advanced performance tools with GPU acceleration and real-time monitoring
 */

const { EventEmitter } = require("events");
// Removed unused worker_threads imports to reduce warnings

/**
 * A comprehensive suite of performance tools for profiling, optimizing, and monitoring LuaScript code.
 * @extends EventEmitter
 */
class PerformanceTools extends EventEmitter {
    /**
     * Creates an instance of the PerformanceTools suite.
     * @param {object} [options={}] - Configuration options for the performance tools.
     * @param {boolean} [options.enableGPU=true] - Whether to enable GPU acceleration.
     * @param {boolean} [options.enableProfiling=false] - Whether to enable detailed profiling.
     * @param {boolean} [options.enableOptimization=true] - Whether to enable code optimization.
     * @param {boolean} [options.enableMonitoring=false] - Whether to enable real-time monitoring.
     */
    constructor(options = {}) {
        super();
        
        this.options = {
            enableGPU: options.enableGPU !== false,
            enableProfiling: options.enableProfiling !== false,
            enableOptimization: options.enableOptimization !== false,
            enableMonitoring: options.enableMonitoring !== false,
            ...options
        };
        
        this.profiler = new AdvancedProfiler();
        this.optimizer = new CodeOptimizer();
        this.gpuAccelerator = new GPUAccelerator();
        this.monitor = new RealTimeMonitor();
        
        this.metrics = new Map();
        this.benchmarks = new Map();
    }

    /**
     * Initializes the performance tools, including the GPU accelerator and real-time monitor.
     * @returns {Promise<void>}
     */
    async initialize() {
        this.emit("initStart");
        
        if (this.options.enableGPU) {
            await this.gpuAccelerator.initialize();
        }
        
        if (this.options.enableMonitoring) {
            this.monitor.start();
        }
        
        this.emit("initComplete");
    }

    /**
     * Cleanly shuts down all performance tooling subsystems.
     */
    shutdown() {
        if (this.monitor && typeof this.monitor.stop === "function") {
            this.monitor.stop();
        }

        if (this.gpuAccelerator && typeof this.gpuAccelerator.shutdown === "function") {
            this.gpuAccelerator.shutdown();
        }

        if (this.profiler && typeof this.profiler.shutdown === "function") {
            this.profiler.shutdown();
        }

        if (this.optimizer && typeof this.optimizer.shutdown === "function") {
            this.optimizer.shutdown();
        }
    }

    /**
     * Profiles a given piece of code to analyze its performance.
     * @param {string} code - The code to profile.
     * @param {object} [options={}] - Profiling options.
     * @returns {Promise<object>} A promise that resolves with the profiling report.
     */
    async profile(code, options = {}) {
        return this.profiler.profile(code, options);
    }

    /**
     * Optimizes a given piece of code.
     * @param {string} code - The code to optimize.
     * @param {object} [options={}] - Optimization options.
     * @returns {Promise<object>} A promise that resolves with the optimization results.
     */
    async optimize(code, options = {}) {
        return this.optimizer.optimize(code, options);
    }

    /**
     * Benchmarks a given piece of code by running it multiple times.
     * @param {string} code - The code to benchmark.
     * @param {number} [iterations=1000] - The number of iterations to run.
     * @returns {Promise<object>} A promise that resolves with the benchmark analysis.
     */
    async benchmark(code, iterations = 1000) {
        const results = [];
        
        for (let i = 0; i < iterations; i++) {
            const start = process.hrtime.bigint();
            await this.executeCode(code);
            const end = process.hrtime.bigint();
            
            results.push(Number(end - start) / 1e6); // Convert to milliseconds
        }
        
        return this.analyzeBenchmarkResults(results);
    }

    /**
     * Simulates the execution of a piece of code for benchmarking purposes.
     * @param {string} code - The code to execute.
     * @returns {Promise<number>} A promise that resolves with a random number.
     * @private
     */
    async executeCode(_code) {
        // Simulate code execution
        return new Promise(resolve => {
            setTimeout(() => resolve(Math.random()), Math.random() * 10);
        });
    }

    /**
     * Analyzes the results of a benchmark run.
     * @param {number[]} results - An array of execution times in milliseconds.
     * @returns {object} An object containing the analysis of the benchmark results.
     * @private
     */
    analyzeBenchmarkResults(results) {
        const sorted = results.sort((a, b) => a - b);
        const mean = results.reduce((a, b) => a + b, 0) / results.length;
        const median = sorted[Math.floor(sorted.length / 2)];
        const min = sorted[0];
        const max = sorted[sorted.length - 1];
        const stdDev = Math.sqrt(results.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / results.length);
        
        return {
            iterations: results.length,
            mean,
            median,
            min,
            max,
            stdDev,
            p95: sorted[Math.floor(sorted.length * 0.95)],
            p99: sorted[Math.floor(sorted.length * 0.99)]
        };
    }

    /**
     * Generates a comprehensive performance report from all tools.
     * @returns {object} The performance report.
     */
    getPerformanceReport() {
        return {
            profiler: this.profiler.getReport(),
            optimizer: this.optimizer.getReport(),
            gpu: this.gpuAccelerator.getReport(),
            monitor: this.monitor.getReport(),
            metrics: Object.fromEntries(this.metrics),
            benchmarks: Object.fromEntries(this.benchmarks)
        };
    }
}

/**
 * An advanced profiler that collects detailed information about code execution, including memory usage and CPU samples.
 */
class AdvancedProfiler {
    constructor() {
        this.profiles = new Map();
        this.callStack = [];
        this.memorySnapshots = [];
        this.cpuSamples = [];
    }

    /**
     * Cleanly shuts down profiler resources and clears collected state.
     */
    shutdown() {
        this.stopCPUSampling();
        this.callStack = [];
        this.memorySnapshots = [];
        this.cpuSamples = [];
    }

    /**
     * Profiles a given piece of code.
     * @param {string} code - The code to profile.
     * @param {object} [options={}] - Profiling options.
     * @returns {Promise<object>} A promise that resolves with the detailed profile report.
     */
    async profile(code, _options = {}) {
        const profileId = this.generateProfileId();
        const startTime = process.hrtime.bigint();
        const startMemory = process.memoryUsage();
        
        try {
            // Start CPU sampling
            this.startCPUSampling();
            
            // Execute code with profiling
            const result = await this.executeWithProfiling(code);
            
            // Stop CPU sampling
            this.stopCPUSampling();
            
            const endTime = process.hrtime.bigint();
            const endMemory = process.memoryUsage();
            
            const profile = {
                id: profileId,
                duration: Number(endTime - startTime) / 1e6,
                memory: {
                    start: startMemory,
                    end: endMemory,
                    peak: this.getPeakMemory(),
                    allocations: this.getAllocations()
                },
                cpu: {
                    samples: this.cpuSamples.length,
                    hotFunctions: this.getHotFunctions(),
                    callGraph: this.buildCallGraph()
                },
                result
            };
            
            this.profiles.set(profileId, profile);
            return profile;
            
        } catch (error) {
            throw new Error(`Profiling failed: ${error.message}`);
        }
    }

    /**
     * Simulates the execution of code with profiling hooks.
     * @param {string} code - The code to execute.
     * @returns {Promise<object>} A promise that resolves with the execution result.
     * @private
     */
    async executeWithProfiling(_code) {
        // Simulate code execution with profiling hooks
        this.recordFunctionCall("main", 0);
        
        // Simulate various function calls
        for (let i = 0; i < 10; i++) {
            this.recordFunctionCall(`func_${i}`, i * 100);
            await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
            this.recordFunctionReturn(`func_${i}`, i * 100 + Math.random() * 50);
        }
        
        this.recordFunctionReturn("main", 1000);
        return { success: true, executedLines: 100 };
    }

    /**
     * Records a function call event.
     * @param {string} name - The name of the function.
     * @param {number} timestamp - The timestamp of the call.
     * @private
     */
    recordFunctionCall(name, timestamp) {
        this.callStack.push({ name, timestamp, type: "call" });
    }

    /**
     * Records a function return event.
     * @param {string} name - The name of the function.
     * @param {number} timestamp - The timestamp of the return.
     * @private
     */
    recordFunctionReturn(name, timestamp) {
        this.callStack.push({ name, timestamp, type: "return" });
    }

    /**
     * Starts CPU sampling.
     * @private
     */
    startCPUSampling() {
        this.cpuSamples = [];
        this.samplingInterval = setInterval(() => {
            this.cpuSamples.push({
                timestamp: Date.now(),
                usage: process.cpuUsage()
            });
        }, 10);
    }

    /**
     * Stops CPU sampling.
     * @private
     */
    stopCPUSampling() {
        if (this.samplingInterval) {
            clearInterval(this.samplingInterval);
        }
    }

    /**
     * Gets the peak memory usage during profiling.
     * @returns {number} The peak memory usage in bytes.
     * @private
     */
    getPeakMemory() {
        return Math.max(...this.memorySnapshots.map(s => s.heapUsed));
    }

    /**
     * Gets the total number of memory allocations.
     * @returns {number} The number of allocations.
     * @private
     */
    getAllocations() {
        return this.memorySnapshots.length;
    }

    /**
     * Identifies the "hot" functions that are called most frequently.
     * @returns {[string, number][]} An array of hot functions and their call counts.
     * @private
     */
    getHotFunctions() {
        const functionCounts = new Map();
        
        for (const call of this.callStack) {
            if (call.type === "call") {
                functionCounts.set(call.name, (functionCounts.get(call.name) || 0) + 1);
            }
        }
        
        return Array.from(functionCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
    }

    /**
     * Builds a call graph from the recorded call stack.
     * @returns {object} The call graph.
     * @private
     */
    buildCallGraph() {
        const graph = new Map();
        const stack = [];
        
        for (const event of this.callStack) {
            if (event.type === "call") {
                if (stack.length > 0) {
                    const parent = stack[stack.length - 1];
                    if (!graph.has(parent)) graph.set(parent, new Set());
                    graph.get(parent).add(event.name);
                }
                stack.push(event.name);
            } else if (event.type === "return") {
                stack.pop();
            }
        }
        
        return Object.fromEntries(
            Array.from(graph.entries()).map(([k, v]) => [k, Array.from(v)])
        );
    }

    /**
     * Generates a unique ID for a profile session.
     * @returns {string} The unique profile ID.
     * @private
     */
    generateProfileId() {
        return `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Gets a summary report of all profiling sessions.
     * @returns {object} The profiling report.
     */
    getReport() {
        return {
            totalProfiles: this.profiles.size,
            profiles: Array.from(this.profiles.values()).slice(-5), // Last 5 profiles
            averageDuration: this.calculateAverageDuration(),
            memoryTrend: this.getMemoryTrend()
        };
    }

    /**
     * Calculates the average duration of all profiling sessions.
     * @returns {number} The average duration in milliseconds.
     * @private
     */
    calculateAverageDuration() {
        const profiles = Array.from(this.profiles.values());
        if (profiles.length === 0) return 0;
        return profiles.reduce((sum, p) => sum + p.duration, 0) / profiles.length;
    }

    /**
     * Gets the recent memory usage trend.
     * @returns {object[]} An array of recent memory snapshots.
     * @private
     */
    getMemoryTrend() {
        return this.memorySnapshots.slice(-10);
    }
}

class CodeOptimizer {
    constructor() {
        this.optimizations = new Map();
        this.patterns = new Map();
        this.stats = {
            optimized: 0,
            bytesReduced: 0,
            performanceGain: 0
        };
        
        this.initializeOptimizations();
    }

    initializeOptimizations() {
        this.optimizations.set("deadCodeElimination", this.eliminateDeadCode.bind(this));
        this.optimizations.set("constantFolding", this.foldConstants.bind(this));
        this.optimizations.set("functionInlining", this.inlineFunctions.bind(this));
        this.optimizations.set("loopOptimization", this.optimizeLoops.bind(this));
        this.optimizations.set("memoryOptimization", this.optimizeMemory.bind(this));
    }

    async optimize(code, options = {}) {
        const originalSize = code.length;
        let optimizedCode = code;
        let appliedOptimizations = [];
        
        for (const [name, optimizer] of this.optimizations) {
            if (options[name] !== false) {
                const before = optimizedCode;
                optimizedCode = optimizer(optimizedCode);
                
                if (before !== optimizedCode) {
                    appliedOptimizations.push(name);
                }
            }
        }
        
        const optimizedSize = optimizedCode.length;
        const reduction = originalSize - optimizedSize;
        
        this.stats.optimized++;
        this.stats.bytesReduced += reduction;
        
        return {
            code: optimizedCode,
            originalSize,
            optimizedSize,
            reduction,
            reductionPercentage: (reduction / originalSize) * 100,
            appliedOptimizations
        };
    }

    eliminateDeadCode(code) {
        // Remove unused variables
        const usedVars = new Set();
        const declaredVars = new Set();
        
        // Find all variable usages
        code.replace(/\b(\w+)\b/g, (match, varName) => {
            if (!varName.match(/^(local|function|if|then|else|end|for|while|do|return)$/)) {
                usedVars.add(varName);
            }
            return match;
        });
        
        // Find all variable declarations
        code.replace(/local\s+(\w+)/g, (match, varName) => {
            declaredVars.add(varName);
            return match;
        });
        
        // Remove unused declarations
        for (const declared of declaredVars) {
            if (!usedVars.has(declared)) {
                const regex = new RegExp(`local\\s+${declared}\\s*=\\s*[^\\n]*\\n?`, "g");
                code = code.replace(regex, "");
            }
        }
        
        return code;
    }

    foldConstants(code) {
        // Fold arithmetic constants
        code = code.replace(/(\d+)\s*\+\s*(\d+)/g, (match, a, b) => {
            return String(parseInt(a) + parseInt(b));
        });
        
        code = code.replace(/(\d+)\s*\*\s*(\d+)/g, (match, a, b) => {
            return String(parseInt(a) * parseInt(b));
        });
        
        // Fold string concatenations
        code = code.replace(/"([^"]*)"\s*\.\.\s*"([^"]*)"/g, "\"$1$2\"");
        
        return code;
    }

    inlineFunctions(code) {
        // Find small functions suitable for inlining
        const functions = new Map();
        
        code.replace(/local\s+function\s+(\w+)\s*\(\s*\)\s*return\s+([^\\n]+)\s+end/g, 
            (match, name, body) => {
                functions.set(name, body);
                return match;
            });
        
        // Inline function calls
        for (const [name, body] of functions) {
            const callRegex = new RegExp(`\\b${name}\\s*\\(\\s*\\)`, "g");
            code = code.replace(callRegex, `(${body})`);
        }
        
        // Remove inlined function definitions
        for (const name of functions.keys()) {
            const defRegex = new RegExp(`local\\s+function\\s+${name}\\s*\\(\\s*\\)\\s*return\\s+[^\\n]+\\s+end\\n?`, "g");
            code = code.replace(defRegex, "");
        }
        
        return code;
    }

    optimizeLoops(code) {
        // Loop unrolling for small constant loops
        code = code.replace(
            /for\s+(\w+)\s*=\s*1,\s*(\d+)\s+do\s*([^\\n]+)\s*end/g,
            (match, var_, count, body) => {
                const iterations = parseInt(count);
                if (iterations <= 5) {
                    let unrolled = "";
                    for (let i = 1; i <= iterations; i++) {
                        unrolled += body.replace(new RegExp(`\\b${var_}\\b`, "g"), String(i)) + "\n";
                    }
                    return unrolled.trim();
                }
                return match;
            }
        );
        
        return code;
    }

    optimizeMemory(code) {
        // Reuse temporary variables
        let tempCounter = 0;
        const tempVars = new Map();
        
        code = code.replace(/local\s+(\w+)\s*=\s*([^\\n]+)/g, (match, varName, value) => {
            if (varName.startsWith("temp_") || varName.startsWith("_")) {
                const key = value.trim();
                if (tempVars.has(key)) {
                    return `local ${varName} = ${tempVars.get(key)}`;
                } else {
                    const tempVar = `_temp${tempCounter++}`;
                    tempVars.set(key, tempVar);
                    return `local ${tempVar} = ${value}; local ${varName} = ${tempVar}`;
                }
            }
            return match;
        });
        
        return code;
    }

    getReport() {
        return {
            ...this.stats,
            availableOptimizations: Array.from(this.optimizations.keys()),
            averageReduction: this.stats.optimized > 0 ? this.stats.bytesReduced / this.stats.optimized : 0
        };
    }
}

class GPUAccelerator {
    constructor() {
        this.available = false;
        this.initialized = false;
        this.computeShaders = new Map();
        this.buffers = new Map();
        this.stats = {
            operations: 0,
            accelerated: 0,
            fallbacks: 0,
            totalTime: 0
        };
    }

        async initialize() {
            try {
                // Simulate GPU initialization
                this.available = await this.checkGPUAvailability();
                if (this.available) {
                    await this.initializeComputeShaders();
                    this.initialized = true;
                }
            } catch {
                this.available = false;
                this.initialized = false;
            }
        }

    async checkGPUAvailability() {
        // Simulate GPU availability check
        return new Promise(resolve => {
            setTimeout(() => resolve(Math.random() > 0.3), 100);
        });
    }

    async initializeComputeShaders() {
        // Initialize compute shaders for common operations
        this.computeShaders.set("vectorAdd", this.createVectorAddShader());
        this.computeShaders.set("matrixMultiply", this.createMatrixMultiplyShader());
        this.computeShaders.set("convolution", this.createConvolutionShader());
        this.computeShaders.set("fft", this.createFFTShader());
    }

    async accelerate(operation, data, options = {}) {
        const startTime = process.hrtime.bigint();
        this.stats.operations++;
        
            try {
                if (!this.available || !this.computeShaders.has(operation)) {
                    this.stats.fallbacks++;
                    return this.fallbackCompute(operation, data);
                }
                
                const result = await this.gpuCompute(operation, data, options);
                this.stats.accelerated++;
                
                const endTime = process.hrtime.bigint();
                this.stats.totalTime += Number(endTime - startTime) / 1e6;
                
                return result;
                
            } catch {
                this.stats.fallbacks++;
                return this.fallbackCompute(operation, data);
            }
        }

    async gpuCompute(operation, data, options) {
        const shader = this.computeShaders.get(operation);
        
        // Simulate GPU computation
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(shader.compute(data, options));
            }, Math.random() * 50);
        });
    }

    fallbackCompute(operation, data) {
        // CPU fallback implementations
        switch (operation) {
        case "vectorAdd":
            return data.map((x, i) => x + (data[i + data.length / 2] || 0));
            
        case "matrixMultiply":
            return this.cpuMatrixMultiply(data.a, data.b);
            
        case "convolution":
            return this.cpuConvolution(data.input, data.kernel);
            
        case "fft":
            return this.cpuFFT(data);
            
        default:
            return data;
        }
    }

    shutdown() {
        this.computeShaders.clear();
        this.buffers.clear();
        this.available = false;
        this.initialized = false;
    }

    createVectorAddShader() {
        return {
            compute: (data, _options) => {
                const { a, b } = data;
                return a.map((x, i) => x + (b[i] || 0));
            }
        };
    }

    createMatrixMultiplyShader() {
        return {
            compute: (data, _options) => {
                return this.cpuMatrixMultiply(data.a, data.b);
            }
        };
    }

    createConvolutionShader() {
        return {
            compute: (data, _options) => {
                return this.cpuConvolution(data.input, data.kernel);
            }
        };
    }

    createFFTShader() {
        return {
            compute: (data, _options) => {
                return this.cpuFFT(data);
            }
        };
    }

    cpuMatrixMultiply(a, b) {
        const result = [];
        for (let i = 0; i < a.length; i++) {
            result[i] = [];
            for (let j = 0; j < b[0].length; j++) {
                let sum = 0;
                for (let k = 0; k < b.length; k++) {
                    sum += a[i][k] * b[k][j];
                }
                result[i][j] = sum;
            }
        }
        return result;
    }

    cpuConvolution(input, kernel) {
        const result = [];
        const kSize = kernel.length;
        const kCenter = Math.floor(kSize / 2);
        
        for (let i = 0; i < input.length; i++) {
            let sum = 0;
            for (let j = 0; j < kSize; j++) {
                const idx = i - kCenter + j;
                if (idx >= 0 && idx < input.length) {
                    sum += input[idx] * kernel[j];
                }
            }
            result[i] = sum;
        }
        
        return result;
    }

    cpuFFT(data) {
        // Simplified FFT implementation
        const n = data.length;
        if (n <= 1) return data;
        
        const even = this.cpuFFT(data.filter((_, i) => i % 2 === 0));
        const odd = this.cpuFFT(data.filter((_, i) => i % 2 === 1));
        
        const result = new Array(n);
        for (let i = 0; i < n / 2; i++) {
            const t = { re: Math.cos(-2 * Math.PI * i / n), im: Math.sin(-2 * Math.PI * i / n) };
            const oddT = { re: odd[i].re * t.re - odd[i].im * t.im, im: odd[i].re * t.im + odd[i].im * t.re };
            
            result[i] = { re: even[i].re + oddT.re, im: even[i].im + oddT.im };
            result[i + n / 2] = { re: even[i].re - oddT.re, im: even[i].im - oddT.im };
        }
        
        return result;
    }

    getReport() {
        return {
            ...this.stats,
            available: this.available,
            initialized: this.initialized,
            shaders: Array.from(this.computeShaders.keys()),
            averageTime: this.stats.operations > 0 ? this.stats.totalTime / this.stats.operations : 0,
            accelerationRate: this.stats.operations > 0 ? (this.stats.accelerated / this.stats.operations) * 100 : 0
        };
    }
}

class RealTimeMonitor {
    constructor() {
        this.metrics = new Map();
        this.alerts = [];
        this.thresholds = new Map([
            ["memory", 80], // 80% memory usage
            ["cpu", 90],    // 90% CPU usage
            ["errors", 10]  // 10 errors per minute
        ]);
        this.monitoring = false;
        this.interval = null;
    }

    start() {
        if (this.monitoring) return;
        
        this.monitoring = true;
        this.interval = setInterval(() => {
            this.collectMetrics();
            this.checkThresholds();
        }, 1000);
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        this.monitoring = false;
    }

    collectMetrics() {
        const timestamp = Date.now();
        const memory = process.memoryUsage();
        const cpu = process.cpuUsage();
        
        this.recordMetric("memory", {
            timestamp,
            heapUsed: memory.heapUsed,
            heapTotal: memory.heapTotal,
            external: memory.external,
            percentage: (memory.heapUsed / memory.heapTotal) * 100
        });
        
        this.recordMetric("cpu", {
            timestamp,
            user: cpu.user,
            system: cpu.system,
            percentage: this.calculateCPUPercentage(cpu)
        });
    }

    recordMetric(name, value) {
        if (!this.metrics.has(name)) {
            this.metrics.set(name, []);
        }
        
        const values = this.metrics.get(name);
        values.push(value);
        
        // Keep only last 100 measurements
        if (values.length > 100) {
            values.shift();
        }
    }

    checkThresholds() {
        for (const [metric, threshold] of this.thresholds) {
            const values = this.metrics.get(metric);
            if (values && values.length > 0) {
                const latest = values[values.length - 1];
                
                if (latest.percentage > threshold) {
                    this.createAlert(metric, latest.percentage, threshold);
                }
            }
        }
    }

    createAlert(metric, value, threshold) {
        const alert = {
            timestamp: Date.now(),
            metric,
            value,
            threshold,
            severity: value > threshold * 1.2 ? "critical" : "warning",
            message: `${metric} usage (${value.toFixed(2)}%) exceeds threshold (${threshold}%)`
        };
        
        this.alerts.push(alert);
        
        // Keep only last 50 alerts
        if (this.alerts.length > 50) {
            this.alerts.shift();
        }
    }

    calculateCPUPercentage(cpu) {
        // Simplified CPU percentage calculation
        return Math.min(100, (cpu.user + cpu.system) / 1000000 * 100);
    }

    getReport() {
        return {
            monitoring: this.monitoring,
            metrics: Object.fromEntries(
                Array.from(this.metrics.entries()).map(([k, v]) => [k, v.slice(-10)])
            ),
            alerts: this.alerts.slice(-10),
            thresholds: Object.fromEntries(this.thresholds)
        };
    }
}

module.exports = {
    PerformanceTools,
    AdvancedProfiler,
    CodeOptimizer,
    GPUAccelerator,
    RealTimeMonitor
};
