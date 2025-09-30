
/**
 * LUASCRIPT Transpiler - JavaScript to Lua Transpiler
 * Phase 1B: Runtime Compatibility Fixes
 * 
 * Critical fixes implemented:
 * - String concatenation: JavaScript '+' to Lua '..'
 * - Logical operators: '||' to 'or', '===' to '=='
 * - Runtime library integration for console.log and other JS functions
 */

const fs = require('fs');
const path = require('path');

class LuaScriptTranspiler {
    constructor() {
        this.runtimeLibraryPath = path.join(__dirname, '..', 'runtime', 'runtime.lua');
    }

    /**
     * Main transpilation function
     * @param {string} jsCode - JavaScript code to transpile
     * @param {Object} options - Transpilation options
     * @returns {string} - Transpiled Lua code
     */
    transpile(jsCode, options = {}) {
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

        return luaCode;
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
     * Transpile a file
     */
    transpileFile(inputPath, outputPath, options = {}) {
        try {
            const jsCode = fs.readFileSync(inputPath, 'utf8');
            const luaCode = this.transpile(jsCode, options);
            
            if (outputPath) {
                fs.writeFileSync(outputPath, luaCode, 'utf8');
                console.log(`Transpiled ${inputPath} -> ${outputPath}`);
            }
            
            return luaCode;
        } catch (error) {
            console.error(`Error transpiling ${inputPath}:`, error.message);
            throw error;
        }
    }
}

// CLI interface
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.length < 1) {
        console.log('Usage: node transpiler.js <input.js> [output.lua] [options]');
        console.log('Options:');
        console.log('  --no-runtime    Skip runtime library injection');
        process.exit(1);
    }

    const inputFile = args[0];
    const outputFile = args[1] || inputFile.replace(/\.js$/, '.lua');
    const options = {
        includeRuntime: !args.includes('--no-runtime')
    };

    const transpiler = new LuaScriptTranspiler();
    
    try {
        transpiler.transpileFile(inputFile, outputFile, options);
        console.log('Transpilation completed successfully!');
    } catch (error) {
        console.error('Transpilation failed:', error.message);
        process.exit(1);
    }
}

module.exports = LuaScriptTranspiler;
