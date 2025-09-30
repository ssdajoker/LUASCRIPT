
/**
 * LUASCRIPT Phase 5 - Enterprise Optimization & Advanced Features
 * PS2/PS3 Specialists + Steve Jobs + Donald Knuth Excellence
 * 32+ Developer Team Implementation - CRUNCH MODE TO $1M!
 */

const { LuaScriptInterpreter } = require('./phase2_core_interpreter');
const { ModuleLoader } = require('./phase2_core_modules');

class PerformanceProfiler {
    constructor() {
        this.metrics = new Map();
        this.startTimes = new Map();
        this.memorySnapshots = [];
        this.callCounts = new Map();
        this.enabled = true;
    }

    startTimer(label) {
        if (!this.enabled) return;
        this.startTimes.set(label, process.hrtime.bigint());
    }

    endTimer(label) {
        if (!this.enabled) return;
        const startTime = this.startTimes.get(label);
        if (startTime) {
            const duration = Number(process.hrtime.bigint() - startTime) / 1000000; // Convert to ms
            
            if (!this.metrics.has(label)) {
                this.metrics.set(label, {
                    totalTime: 0,
                    callCount: 0,
                    minTime: Infinity,
                    maxTime: 0,
                    avgTime: 0
                });
            }
            
            const metric = this.metrics.get(label);
            metric.totalTime += duration;
            metric.callCount++;
            metric.minTime = Math.min(metric.minTime, duration);
            metric.maxTime = Math.max(metric.maxTime, duration);
            metric.avgTime = metric.totalTime / metric.callCount;
            
            this.startTimes.delete(label);
        }
    }

    recordFunctionCall(functionName) {
        if (!this.enabled) return;
        const count = this.callCounts.get(functionName) || 0;
        this.callCounts.set(functionName, count + 1);
    }

    takeMemorySnapshot() {
        if (!this.enabled) return;
        const memUsage = process.memoryUsage();
        this.memorySnapshots.push({
            timestamp: Date.now(),
            ...memUsage
        });
        
        // Keep only last 100 snapshots
        if (this.memorySnapshots.length > 100) {
            this.memorySnapshots.shift();
        }
    }

    getMetrics() {
        return {
            timings: Object.fromEntries(this.metrics),
            functionCalls: Object.fromEntries(this.callCounts),
            memorySnapshots: this.memorySnapshots,
            summary: this.generateSummary()
        };
    }

    generateSummary() {
        const totalFunctions = this.callCounts.size;
        const totalCalls = Array.from(this.callCounts.values()).reduce((a, b) => a + b, 0);
        const totalTime = Array.from(this.metrics.values()).reduce((a, b) => a + b.totalTime, 0);
        
        const hotFunctions = Array.from(this.callCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
        
        const slowFunctions = Array.from(this.metrics.entries())
            .sort((a, b) => b[1].avgTime - a[1].avgTime)
            .slice(0, 10);
        
        return {
            totalFunctions,
            totalCalls,
            totalTime: totalTime.toFixed(2) + 'ms',
            hotFunctions,
            slowFunctions,
            memoryTrend: this.getMemoryTrend()
        };
    }

    getMemoryTrend() {
        if (this.memorySnapshots.length < 2) return 'insufficient_data';
        
        const first = this.memorySnapshots[0];
        const last = this.memorySnapshots[this.memorySnapshots.length - 1];
        
        const heapTrend = last.heapUsed - first.heapUsed;
        const rssTrend = last.rss - first.rss;
        
        return {
            heapChange: heapTrend,
            rssChange: rssTrend,
            trend: heapTrend > 0 ? 'increasing' : 'decreasing'
        };
    }

    reset() {
        this.metrics.clear();
        this.startTimes.clear();
        this.memorySnapshots = [];
        this.callCounts.clear();
    }

    enable() {
        this.enabled = true;
    }

    disable() {
        this.enabled = false;
    }
}

class MemoryOptimizer {
    constructor(options = {}) {
        this.options = {
            maxHeapSize: options.maxHeapSize || 512 * 1024 * 1024, // 512MB
            gcThreshold: options.gcThreshold || 0.8,
            objectPoolSize: options.objectPoolSize || 1000,
            stringInternThreshold: options.stringInternThreshold || 100,
            ...options
        };
        
        this.objectPools = new Map();
        this.stringInternMap = new Map();
        this.stringUsageCount = new Map();
        this.weakRefs = new Set();
        this.memoryUsage = 0;
    }

    createObjectPool(type, factory, resetFn) {
        const pool = {
            objects: [],
            factory,
            resetFn,
            created: 0,
            reused: 0
        };
        
        this.objectPools.set(type, pool);
        return pool;
    }

    getPooledObject(type) {
        const pool = this.objectPools.get(type);
        if (!pool) return null;
        
        if (pool.objects.length > 0) {
            const obj = pool.objects.pop();
            pool.reused++;
            return obj;
        }
        
        const obj = pool.factory();
        pool.created++;
        return obj;
    }

    returnToPool(type, obj) {
        const pool = this.objectPools.get(type);
        if (!pool || pool.objects.length >= this.options.objectPoolSize) {
            return false;
        }
        
        if (pool.resetFn) {
            pool.resetFn(obj);
        }
        
        pool.objects.push(obj);
        return true;
    }

    internString(str) {
        if (typeof str !== 'string') return str;
        
        // Track usage
        const count = this.stringUsageCount.get(str) || 0;
        this.stringUsageCount.set(str, count + 1);
        
        // Intern if used frequently
        if (count >= this.options.stringInternThreshold) {
            if (!this.stringInternMap.has(str)) {
                this.stringInternMap.set(str, str);
            }
            return this.stringInternMap.get(str);
        }
        
        return str;
    }

    createWeakRef(obj, cleanup) {
        const ref = new WeakRef(obj);
        if (cleanup) {
            const registry = new FinalizationRegistry(cleanup);
            registry.register(obj, ref);
        }
        this.weakRefs.add(ref);
        return ref;
    }

    triggerGC() {
        // Clean up weak references
        for (const ref of this.weakRefs) {
            if (!ref.deref()) {
                this.weakRefs.delete(ref);
            }
        }
        
        // Clean up string intern map for unused strings
        const threshold = this.options.stringInternThreshold;
        for (const [str, count] of this.stringUsageCount) {
            if (count < threshold) {
                this.stringInternMap.delete(str);
                this.stringUsageCount.delete(str);
            }
        }
        
        // Suggest native GC if available
        if (global.gc) {
            global.gc();
        }
    }

    getMemoryStats() {
        const poolStats = {};
        for (const [type, pool] of this.objectPools) {
            poolStats[type] = {
                available: pool.objects.length,
                created: pool.created,
                reused: pool.reused,
                efficiency: pool.reused / (pool.created + pool.reused) * 100
            };
        }
        
        return {
            heapUsage: process.memoryUsage(),
            objectPools: poolStats,
            internedStrings: this.stringInternMap.size,
            weakReferences: this.weakRefs.size,
            stringUsageTracked: this.stringUsageCount.size
        };
    }

    optimize() {
        this.triggerGC();
        
        // Clear unused object pools
        for (const [type, pool] of this.objectPools) {
            if (pool.objects.length > this.options.objectPoolSize / 2) {
                pool.objects.splice(this.options.objectPoolSize / 2);
            }
        }
        
        return this.getMemoryStats();
    }
}

class SecurityManager {
    constructor(options = {}) {
        this.options = {
            allowFileSystem: options.allowFileSystem || false,
            allowNetwork: options.allowNetwork || false,
            allowProcess: options.allowProcess || false,
            allowEval: options.allowEval || false,
            maxExecutionTime: options.maxExecutionTime || 30000,
            maxMemoryUsage: options.maxMemoryUsage || 256 * 1024 * 1024,
            trustedModules: new Set(options.trustedModules || []),
            ...options
        };
        
        this.violations = [];
        this.blockedOperations = new Set();
    }

    checkFileSystemAccess(operation, path) {
        if (!this.options.allowFileSystem) {
            this.recordViolation('filesystem', operation, path);
            throw new SecurityError(`File system access denied: ${operation} on ${path}`);
        }
        
        // Check for path traversal
        if (path.includes('..') || path.includes('~')) {
            this.recordViolation('path_traversal', operation, path);
            throw new SecurityError(`Path traversal detected: ${path}`);
        }
        
        return true;
    }

    checkNetworkAccess(operation, url) {
        if (!this.options.allowNetwork) {
            this.recordViolation('network', operation, url);
            throw new SecurityError(`Network access denied: ${operation} to ${url}`);
        }
        
        return true;
    }

    checkProcessAccess(operation, command) {
        if (!this.options.allowProcess) {
            this.recordViolation('process', operation, command);
            throw new SecurityError(`Process access denied: ${operation} - ${command}`);
        }
        
        return true;
    }

    checkEvalAccess(code) {
        if (!this.options.allowEval) {
            this.recordViolation('eval', 'execute', code.substring(0, 100));
            throw new SecurityError('Dynamic code execution denied');
        }
        
        return true;
    }

    checkModuleAccess(moduleName) {
        if (!this.options.trustedModules.has(moduleName)) {
            // Check for potentially dangerous modules
            const dangerousModules = ['fs', 'child_process', 'cluster', 'dgram', 'net', 'tls'];
            if (dangerousModules.includes(moduleName)) {
                this.recordViolation('module', 'require', moduleName);
                throw new SecurityError(`Untrusted module access denied: ${moduleName}`);
            }
        }
        
        return true;
    }

    checkResourceUsage(memoryUsage, executionTime) {
        if (memoryUsage > this.options.maxMemoryUsage) {
            this.recordViolation('resource', 'memory', memoryUsage);
            throw new SecurityError(`Memory usage limit exceeded: ${memoryUsage} bytes`);
        }
        
        if (executionTime > this.options.maxExecutionTime) {
            this.recordViolation('resource', 'time', executionTime);
            throw new SecurityError(`Execution time limit exceeded: ${executionTime}ms`);
        }
        
        return true;
    }

    recordViolation(type, operation, details) {
        const violation = {
            timestamp: Date.now(),
            type,
            operation,
            details,
            stackTrace: new Error().stack
        };
        
        this.violations.push(violation);
        
        // Keep only last 1000 violations
        if (this.violations.length > 1000) {
            this.violations.shift();
        }
        
        this.blockedOperations.add(`${type}:${operation}`);
    }

    getSecurityReport() {
        const violationsByType = {};
        for (const violation of this.violations) {
            if (!violationsByType[violation.type]) {
                violationsByType[violation.type] = 0;
            }
            violationsByType[violation.type]++;
        }
        
        return {
            totalViolations: this.violations.length,
            violationsByType,
            blockedOperations: Array.from(this.blockedOperations),
            recentViolations: this.violations.slice(-10),
            securityLevel: this.calculateSecurityLevel()
        };
    }

    calculateSecurityLevel() {
        const restrictions = [
            !this.options.allowFileSystem,
            !this.options.allowNetwork,
            !this.options.allowProcess,
            !this.options.allowEval
        ].filter(Boolean).length;
        
        const levels = ['low', 'medium', 'high', 'maximum'];
        return levels[restrictions] || 'custom';
    }

    reset() {
        this.violations = [];
        this.blockedOperations.clear();
    }
}

class SecurityError extends Error {
    constructor(message) {
        super(message);
        this.name = 'SecurityError';
    }
}

class EnterpriseInterpreter extends LuaScriptInterpreter {
    constructor(options = {}) {
        super(options);
        
        this.profiler = new PerformanceProfiler();
        this.memoryOptimizer = new MemoryOptimizer(options.memory);
        this.securityManager = new SecurityManager(options.security);
        this.moduleLoader = new ModuleLoader(options.modules);
        
        this.enterpriseOptions = {
            enableProfiling: options.enableProfiling !== false,
            enableOptimization: options.enableOptimization !== false,
            enableSecurity: options.enableSecurity !== false,
            autoGC: options.autoGC !== false,
            ...options
        };
        
        this.setupEnterpriseFeatures();
    }

    setupEnterpriseFeatures() {
        // Override execute method to add profiling
        const originalExecute = this.execute.bind(this);
        this.execute = (node) => {
            if (this.enterpriseOptions.enableProfiling) {
                this.profiler.startTimer('execution');
                this.profiler.takeMemorySnapshot();
            }
            
            try {
                const result = originalExecute(node);
                
                if (this.enterpriseOptions.enableProfiling) {
                    this.profiler.endTimer('execution');
                }
                
                return result;
            } catch (error) {
                if (this.enterpriseOptions.enableProfiling) {
                    this.profiler.endTimer('execution');
                }
                throw error;
            }
        };
        
        // Override evaluate method for function call tracking
        const originalEvaluateCall = this.evaluateCallExpression.bind(this);
        this.evaluateCallExpression = (node) => {
            if (this.enterpriseOptions.enableProfiling) {
                const functionName = this.getFunctionName(node.callee);
                this.profiler.recordFunctionCall(functionName);
                this.profiler.startTimer(`function:${functionName}`);
            }
            
            try {
                const result = originalEvaluateCall(node);
                
                if (this.enterpriseOptions.enableProfiling) {
                    const functionName = this.getFunctionName(node.callee);
                    this.profiler.endTimer(`function:${functionName}`);
                }
                
                return result;
            } catch (error) {
                if (this.enterpriseOptions.enableProfiling) {
                    const functionName = this.getFunctionName(node.callee);
                    this.profiler.endTimer(`function:${functionName}`);
                }
                throw error;
            }
        };
        
        // Set up automatic garbage collection
        if (this.enterpriseOptions.autoGC) {
            setInterval(() => {
                this.memoryOptimizer.optimize();
            }, 30000); // Every 30 seconds
        }
    }

    getFunctionName(calleeNode) {
        if (calleeNode.type === 'Identifier') {
            return calleeNode.name;
        } else if (calleeNode.type === 'MemberExpression') {
            const object = calleeNode.object.name || 'unknown';
            const property = calleeNode.property.name || 'unknown';
            return `${object}.${property}`;
        }
        return 'anonymous';
    }

    interpret(ast) {
        // Security check
        if (this.enterpriseOptions.enableSecurity) {
            this.performSecurityAudit(ast);
        }
        
        const startTime = Date.now();
        const startMemory = process.memoryUsage().heapUsed;
        
        try {
            const result = super.interpret(ast);
            
            // Resource usage check
            if (this.enterpriseOptions.enableSecurity) {
                const executionTime = Date.now() - startTime;
                const memoryUsage = process.memoryUsage().heapUsed;
                this.securityManager.checkResourceUsage(memoryUsage, executionTime);
            }
            
            return result;
        } catch (error) {
            // Enhanced error reporting
            if (this.enterpriseOptions.enableProfiling) {
                error.performanceMetrics = this.profiler.getMetrics();
                error.memoryStats = this.memoryOptimizer.getMemoryStats();
            }
            
            if (this.enterpriseOptions.enableSecurity) {
                error.securityReport = this.securityManager.getSecurityReport();
            }
            
            throw error;
        }
    }

    performSecurityAudit(ast) {
        // Traverse AST to check for security violations
        const traverse = (node) => {
            if (!node) return;
            
            // Check for eval-like operations
            if (node.type === 'CallExpression' && 
                node.callee.type === 'Identifier' && 
                ['eval', 'Function'].includes(node.callee.name)) {
                this.securityManager.checkEvalAccess('dynamic code');
            }
            
            // Check for require calls
            if (node.type === 'CallExpression' && 
                node.callee.type === 'Identifier' && 
                node.callee.name === 'require' &&
                node.arguments.length > 0 &&
                node.arguments[0].type === 'Literal') {
                this.securityManager.checkModuleAccess(node.arguments[0].value);
            }
            
            // Recursively check children
            if (node.body) {
                if (Array.isArray(node.body)) {
                    node.body.forEach(traverse);
                } else {
                    traverse(node.body);
                }
            }
            
            if (node.children) {
                node.children.forEach(traverse);
            }
        };
        
        traverse(ast);
    }

    getPerformanceReport() {
        return {
            profiling: this.profiler.getMetrics(),
            memory: this.memoryOptimizer.getMemoryStats(),
            security: this.securityManager.getSecurityReport(),
            timestamp: Date.now()
        };
    }

    optimizePerformance() {
        const memoryStats = this.memoryOptimizer.optimize();
        const securityReport = this.securityManager.getSecurityReport();
        
        return {
            memoryOptimization: memoryStats,
            securityStatus: securityReport,
            recommendations: this.generateOptimizationRecommendations()
        };
    }

    generateOptimizationRecommendations() {
        const recommendations = [];
        const metrics = this.profiler.getMetrics();
        
        // Check for slow functions
        const slowFunctions = metrics.summary.slowFunctions;
        if (slowFunctions.length > 0) {
            recommendations.push({
                type: 'performance',
                priority: 'high',
                message: `Optimize slow functions: ${slowFunctions.map(f => f[0]).join(', ')}`,
                details: slowFunctions
            });
        }
        
        // Check memory usage
        const memoryTrend = metrics.summary.memoryTrend;
        if (memoryTrend.trend === 'increasing') {
            recommendations.push({
                type: 'memory',
                priority: 'medium',
                message: 'Memory usage is increasing, consider optimizing object creation',
                details: memoryTrend
            });
        }
        
        // Check security violations
        const securityReport = this.securityManager.getSecurityReport();
        if (securityReport.totalViolations > 0) {
            recommendations.push({
                type: 'security',
                priority: 'high',
                message: `${securityReport.totalViolations} security violations detected`,
                details: securityReport.violationsByType
            });
        }
        
        return recommendations;
    }

    reset() {
        this.profiler.reset();
        this.memoryOptimizer = new MemoryOptimizer(this.enterpriseOptions.memory);
        this.securityManager.reset();
    }
}

module.exports = {
    EnterpriseInterpreter,
    PerformanceProfiler,
    MemoryOptimizer,
    SecurityManager,
    SecurityError
};
