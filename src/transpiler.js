
/**
 * LUASCRIPT Transpiler - JavaScript to Lua Transpiler
 * Phase 1B: Runtime Compatibility Fixes + Tony Yoka's 20 PS2/PS3 Optimizations
 * 
 * MULTI-TEAM IMPLEMENTATION:
 * - Steve Jobs & Donald Knuth: Architecture & Algorithm Excellence
 * - Tony Yoka PS2/PS3 Team: 20 Hardware-Inspired Optimizations
 * - Main Development Team: 95% Phase Completion Push
 * - Sundar/Linus/Ada: Harmony & Stability Assurance
 * 
 * Critical fixes + optimizations implemented:
 * - String concatenation: JavaScript '+' to Lua '..'
 * - Logical operators: '||' to 'or', '===' to '=='
 * - Runtime library integration for console.log and other JS functions
 * - Tony's 20 PS2/PS3-inspired performance optimizations
 */

const fs = require('fs');
const path = require('path');
const { OptimizedLuaScriptTranspiler } = require('./optimized_transpiler');

class LuaScriptTranspiler {
    constructor(options = {}) {
        this.runtimeLibraryPath = path.join(__dirname, '..', 'runtime', 'runtime.lua');
        
        // Tony Yoka's PS2/PS3 Optimization Integration
        this.options = {
            enableOptimizations: options.enableOptimizations !== false,
            optimizationLevel: options.optimizationLevel || 'standard', // 'basic', 'standard', 'aggressive'
            enableParallelProcessing: options.enableParallelProcessing !== false,
            enableCaching: options.enableCaching !== false,
            enableProfiling: options.enableProfiling !== false,
            ...options
        };
        
        // Initialize optimized transpiler if optimizations are enabled
        if (this.options.enableOptimizations) {
            this.optimizedTranspiler = new OptimizedLuaScriptTranspiler(this.options);
            this.optimizedTranspiler.initialize().catch(console.error);
        }
        
        // Performance tracking for multi-team coordination
        this.stats = {
            transpilationsCount: 0,
            totalTime: 0,
            optimizationsApplied: 0,
            cacheHits: 0
        };
    }

    /**
     * Main transpilation function - Enhanced with Tony's 20 PS2/PS3 Optimizations
     * @param {string} jsCode - JavaScript code to transpile
     * @param {Object} options - Transpilation options
     * @returns {string} - Transpiled Lua code
     */
    async transpile(jsCode, options = {}) {
        const startTime = process.hrtime.bigint();
        this.stats.transpilationsCount++;
        
        try {
            // Use optimized transpiler if enabled and available
            if (this.options.enableOptimizations && this.optimizedTranspiler) {
                console.log('🚀 APPLYING TONY YOKA\'S 20 PS2/PS3 OPTIMIZATIONS...');
                
                const optimizedResult = await this.optimizedTranspiler.transpile(jsCode, options);
                this.stats.optimizationsApplied++;
                
                // Apply runtime library injection to optimized result
                const finalResult = this.injectRuntimeLibrary(optimizedResult, options);
                
                const duration = Number(process.hrtime.bigint() - startTime) / 1e6;
                this.stats.totalTime += duration;
                
                console.log(`✅ OPTIMIZATION COMPLETE: ${duration.toFixed(2)}ms`);
                return finalResult;
            }
            
            // Fallback to standard transpilation
            console.log('📝 Using standard transpilation (optimizations disabled)');
            let luaCode = jsCode;

            // Phase 1B Critical Fixes - Order matters!
            luaCode = this.fixEqualityOperators(luaCode);
            luaCode = this.fixLogicalOperators(luaCode);
            luaCode = this.fixStringConcatenation(luaCode);
            luaCode = this.injectRuntimeLibrary(luaCode, options);

            // Additional JavaScript to Lua conversions
            luaCode = this.convertVariableDeclarations(luaCode);
            luaCode = this.convertFunctionDeclarations(luaCode);
            luaCode = this.convertConditionals(luaCode);
            luaCode = this.convertLoops(luaCode);
            luaCode = this.convertArrays(luaCode);
            luaCode = this.convertObjects(luaCode);

            const duration = Number(process.hrtime.bigint() - startTime) / 1e6;
            this.stats.totalTime += duration;

            return luaCode;
            
        } catch (error) {
            console.error('❌ TRANSPILATION ERROR:', error.message);
            throw error;
        }
    }

    /**
     * Fix string concatenation operator: + to ..
     * Critical Phase 1B fix
     */
    fixStringConcatenation(code) {
        // Handle string concatenation with proper context detection
        // This regex looks for + operators that are likely string concatenation
        // Pattern: string/variable + string/variable (including strings with special chars)
        
        // First pass: handle simple concatenation
        let result = code.replace(
            /(\w+|"[^"]*"|'[^']*')\s*\+\s*(\w+|"[^"]*"|'[^']*')/g,
            '$1 .. $2'
        );
        
        // Second pass: handle chained concatenation
        result = result.replace(
            /(\w+|"[^"]*"|'[^']*')(\s*\.\.\s*(\w+|"[^"]*"|'[^']*'))+\s*\+\s*(\w+|"[^"]*"|'[^']*')/g,
            '$1$2 .. $4'
        );
        
        return result;
    }

    /**
     * Fix logical operators: || to or, && to and
     * Critical Phase 1B fix
     */
    fixLogicalOperators(code) {
        return code
            .replace(/\|\|/g, 'or')
            .replace(/&&/g, 'and')
            .replace(/!\s*([a-zA-Z_$][a-zA-Z0-9_$]*|\([^)]*\))/g, 'not $1');
    }

    /**
     * Fix equality operators: === to ==, !== to ~=
     * Critical Phase 1B fix
     */
    fixEqualityOperators(code) {
        return code
            .replace(/!==/g, '~=')
            .replace(/!=/g, '~=')
            .replace(/===/g, '==');
    }

    /**
     * Inject runtime library for console.log and other JS functions
     * Critical Phase 1B fix
     */
    injectRuntimeLibrary(code, options = {}) {
        const requireRuntime = options.includeRuntime !== false;
        
        if (requireRuntime) {
            const runtimeRequire = `-- LUASCRIPT Runtime Library Integration
local runtime = require('runtime.runtime')
local console = runtime.console
local JSON = runtime.JSON
local Math = runtime.Math

`;
            return runtimeRequire + code;
        }
        
        return code;
    }

    /**
     * Convert JavaScript variable declarations to Lua
     */
    convertVariableDeclarations(code) {
        return code
            .replace(/\bvar\s+(\w+)/g, 'local $1')
            .replace(/\blet\s+(\w+)/g, 'local $1')
            .replace(/\bconst\s+(\w+)/g, 'local $1');
    }

    /**
     * Convert JavaScript function declarations to Lua
     */
    convertFunctionDeclarations(code) {
        // Convert function declarations
        code = code.replace(
            /function\s+(\w+)\s*\(([^)]*)\)\s*{/g,
            'local function $1($2)'
        );

        // Convert arrow functions (basic support)
        code = code.replace(
            /(\w+)\s*=\s*\(([^)]*)\)\s*=>\s*{/g,
            'local function $1($2)'
        );

        // Convert closing braces to end
        code = code.replace(/}/g, 'end');

        return code;
    }

    /**
     * Convert JavaScript conditionals to Lua
     */
    convertConditionals(code) {
        return code
            .replace(/if\s*\(/g, 'if ')
            .replace(/\)\s*{/g, ' then')
            .replace(/else\s*{/g, 'else')
            .replace(/else\s+if\s*\(/g, 'elseif ')
            .replace(/\)\s*{/g, ' then');
    }

    /**
     * Convert JavaScript loops to Lua
     */
    convertLoops(code) {
        // Convert while loops
        code = code.replace(/while\s*\(/g, 'while ').replace(/\)\s*{/g, ' do');
        
        // Convert for loops (basic numeric for)
        code = code.replace(
            /for\s*\(\s*(\w+)\s*=\s*(\d+)\s*;\s*\1\s*<\s*(\d+)\s*;\s*\1\+\+\s*\)\s*{/g,
            'for $1 = $2, $3 - 1 do'
        );

        return code;
    }

    /**
     * Convert JavaScript arrays to Lua tables
     */
    convertArrays(code) {
        // Convert array literals
        return code.replace(/\[([^\]]*)\]/g, '{$1}');
    }

    /**
     * Convert JavaScript objects to Lua tables
     */
    convertObjects(code) {
        // Basic object literal conversion
        return code.replace(/(\w+):\s*([^,}]+)/g, '$1 = $2');
    }

    /**
     * Transpile a file - Enhanced with optimization support
     */
    async transpileFile(inputPath, outputPath, options = {}) {
        try {
            console.log(`🔄 TRANSPILING: ${inputPath}`);
            const jsCode = fs.readFileSync(inputPath, 'utf8');
            const luaCode = await this.transpile(jsCode, options);
            
            if (outputPath) {
                fs.writeFileSync(outputPath, luaCode, 'utf8');
                console.log(`✅ TRANSPILED: ${inputPath} -> ${outputPath}`);
            }
            
            return luaCode;
        } catch (error) {
            console.error(`❌ ERROR TRANSPILING ${inputPath}:`, error.message);
            throw error;
        }
    }

    /**
     * Get performance statistics - Multi-team coordination reporting
     */
    getPerformanceStats() {
        const baseStats = {
            transpilationsCount: this.stats.transpilationsCount,
            totalTime: this.stats.totalTime,
            averageTime: this.stats.transpilationsCount > 0 ? this.stats.totalTime / this.stats.transpilationsCount : 0,
            optimizationsApplied: this.stats.optimizationsApplied,
            cacheHits: this.stats.cacheHits,
            optimizationRate: this.stats.transpilationsCount > 0 ? (this.stats.optimizationsApplied / this.stats.transpilationsCount) * 100 : 0
        };

        if (this.optimizedTranspiler) {
            const optimizedStats = this.optimizedTranspiler.getPerformanceReport();
            return {
                ...baseStats,
                optimizedTranspiler: optimizedStats,
                tonyYokaOptimizations: {
                    enabled: true,
                    level: this.options.optimizationLevel,
                    parallelProcessing: this.options.enableParallelProcessing,
                    caching: this.options.enableCaching,
                    profiling: this.options.enableProfiling
                }
            };
        }

        return {
            ...baseStats,
            tonyYokaOptimizations: {
                enabled: false,
                reason: 'Optimizations disabled in constructor'
            }
        };
    }

    /**
     * Generate multi-team coordination report
     */
    generateTeamReport() {
        const stats = this.getPerformanceStats();
        
        console.log('\n🚨 MULTI-TEAM COORDINATION REPORT 🚨');
        console.log('=' .repeat(60));
        console.log('👨‍💼 STEVE JOBS & DONALD KNUTH: Architecture Excellence');
        console.log('🎮 TONY YOKA PS2/PS3 TEAM: Hardware Optimizations');
        console.log('👥 MAIN DEV TEAM: 95% Phase Completion Push');
        console.log('🔧 SUNDAR/LINUS/ADA: Harmony & Stability');
        console.log('=' .repeat(60));
        
        console.log(`📊 TRANSPILATIONS: ${stats.transpilationsCount}`);
        console.log(`⏱️  TOTAL TIME: ${stats.totalTime.toFixed(2)}ms`);
        console.log(`📈 AVERAGE TIME: ${stats.averageTime.toFixed(2)}ms`);
        console.log(`🚀 OPTIMIZATIONS: ${stats.optimizationsApplied} (${stats.optimizationRate.toFixed(1)}%)`);
        
        if (stats.tonyYokaOptimizations.enabled) {
            console.log('\n🎮 TONY YOKA\'S PS2/PS3 OPTIMIZATIONS:');
            console.log(`   Level: ${stats.tonyYokaOptimizations.level}`);
            console.log(`   Parallel Processing: ${stats.tonyYokaOptimizations.parallelProcessing ? '✅' : '❌'}`);
            console.log(`   Caching: ${stats.tonyYokaOptimizations.caching ? '✅' : '❌'}`);
            console.log(`   Profiling: ${stats.tonyYokaOptimizations.profiling ? '✅' : '❌'}`);
            
            if (stats.optimizedTranspiler) {
                console.log(`   Cache Hit Rate: ${stats.optimizedTranspiler.cacheHitRate.toFixed(1)}%`);
                console.log(`   Throughput: ${stats.optimizedTranspiler.throughput.toFixed(2)} lines/sec`);
            }
        } else {
            console.log('\n⚠️  TONY YOKA\'S OPTIMIZATIONS: DISABLED');
            console.log(`   Reason: ${stats.tonyYokaOptimizations.reason}`);
        }
        
        console.log('\n🏆 PHASE COMPLETION STATUS:');
        console.log('   Phase 1-6: Pushing to 95% completion');
        console.log('   Optimization Implementation: ✅ COMPLETE');
        console.log('   Multi-team Coordination: ✅ ACTIVE');
        console.log('=' .repeat(60));
        
        return stats;
    }
}

// CLI interface - Enhanced with Tony's optimizations
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.length < 1) {
        console.log('🚀 LUASCRIPT TRANSPILER - Tony Yoka\'s PS2/PS3 Optimizations');
        console.log('Usage: node transpiler.js <input.js> [output.lua] [options]');
        console.log('');
        console.log('Options:');
        console.log('  --no-runtime           Skip runtime library injection');
        console.log('  --no-optimizations     Disable Tony\'s PS2/PS3 optimizations');
        console.log('  --optimization-level   Set level: basic, standard, aggressive');
        console.log('  --no-parallel          Disable parallel processing');
        console.log('  --no-caching           Disable hot code caching');
        console.log('  --no-profiling         Disable performance profiling');
        console.log('  --report               Generate team coordination report');
        console.log('');
        console.log('🎮 Tony Yoka\'s 20 PS2/PS3-Inspired Optimizations:');
        console.log('   1-4:   Memory Architecture (EE/VU Inspired)');
        console.log('   5-8:   Instruction-Level (MIPS/Cell Inspired)');
        console.log('   9-12:  Cache & Performance');
        console.log('   13-16: Specialized Processing Units');
        console.log('   17-20: Advanced Memory & System Optimizations');
        process.exit(1);
    }

    const inputFile = args[0];
    const outputFile = args[1] || inputFile.replace(/\.js$/, '.lua');
    
    const options = {
        includeRuntime: !args.includes('--no-runtime'),
        enableOptimizations: !args.includes('--no-optimizations'),
        enableParallelProcessing: !args.includes('--no-parallel'),
        enableCaching: !args.includes('--no-caching'),
        enableProfiling: !args.includes('--no-profiling')
    };

    // Set optimization level
    const levelIndex = args.indexOf('--optimization-level');
    if (levelIndex !== -1 && levelIndex + 1 < args.length) {
        options.optimizationLevel = args[levelIndex + 1];
    }

    const transpiler = new LuaScriptTranspiler(options);
    
    async function runTranspilation() {
        try {
            console.log('🚨 MULTI-TEAM COORDINATION ACTIVE! 🚨');
            console.log('👨‍💼 Steve Jobs & Donald Knuth: Excellence Standards');
            console.log('🎮 Tony Yoka PS2/PS3 Team: Hardware Optimizations');
            console.log('👥 Main Dev Team: 95% Phase Push');
            console.log('🔧 Sundar/Linus/Ada: Harmony Assurance');
            console.log('');
            
            await transpiler.transpileFile(inputFile, outputFile, options);
            
            if (args.includes('--report')) {
                transpiler.generateTeamReport();
            }
            
            console.log('\n🏆 TRANSPILATION SUCCESS - MULTI-TEAM VICTORY!');
        } catch (error) {
            console.error('\n❌ TRANSPILATION FAILED:', error.message);
            process.exit(1);
        }
    }
    
    runTranspilation();
}

module.exports = LuaScriptTranspiler;
