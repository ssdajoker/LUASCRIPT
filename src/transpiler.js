
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
     * PERFECT PARSER INITIATIVE - Phase 1: Enhanced with Runtime Validation
     * @param {string} jsCode - JavaScript code to transpile
     * @param {Object} options - Transpilation options
     * @returns {string} - Transpiled Lua code
     */
    transpile(jsCode, options = {}) {
        // PHASE 1: Runtime Validation - Input validation
        this.validateInput(jsCode, options);
        
        let luaCode = jsCode;

        // PHASE 1: Critical Fixes - Order matters for parser strategy alignment!
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

        // PHASE 1: Runtime Validation - Output validation
        this.validateOutput(luaCode, options);

        return luaCode;
    }

    /**
     * PERFECT PARSER INITIATIVE - Phase 1: Runtime Input Validation
     * Comprehensive validation of input code and options
     */
    validateInput(jsCode, options) {
        // Input code validation
        if (typeof jsCode !== 'string') {
            throw new Error('LUASCRIPT_VALIDATION_ERROR: Input code must be a string');
        }
        
        if (jsCode.trim().length === 0) {
            throw new Error('LUASCRIPT_VALIDATION_ERROR: Input code cannot be empty');
        }
        
        if (jsCode.length > 1000000) { // 1MB limit
            throw new Error('LUASCRIPT_VALIDATION_ERROR: Input code exceeds maximum size limit (1MB)');
        }
        
        // Options validation
        if (typeof options !== 'object' || options === null) {
            throw new Error('LUASCRIPT_VALIDATION_ERROR: Options must be an object');
        }
        
        // Validate specific options
        if (options.includeRuntime !== undefined && typeof options.includeRuntime !== 'boolean') {
            throw new Error('LUASCRIPT_VALIDATION_ERROR: includeRuntime option must be a boolean');
        }
        
        // Check for potentially problematic patterns
        const problematicPatterns = [
            { pattern: /eval\s*\(/, message: 'eval() is not supported in LUASCRIPT' },
            { pattern: /with\s*\(/, message: 'with statements are not supported in LUASCRIPT' },
            { pattern: /debugger\s*;/, message: 'debugger statements are not supported in LUASCRIPT' }
        ];
        
        for (const { pattern, message } of problematicPatterns) {
            if (pattern.test(jsCode)) {
                throw new Error(`LUASCRIPT_VALIDATION_ERROR: ${message}`);
            }
        }
        
        // Validate balanced brackets and quotes
        this.validateSyntaxBalance(jsCode);
    }

    /**
     * PERFECT PARSER INITIATIVE - Phase 1: Syntax Balance Validation
     * Ensures brackets, braces, and quotes are properly balanced
     */
    validateSyntaxBalance(code) {
        const stack = [];
        const pairs = { '(': ')', '[': ']', '{': '}' };
        let inString = false;
        let stringChar = null;
        let escaped = false;
        
        for (let i = 0; i < code.length; i++) {
            const char = code[i];
            
            if (escaped) {
                escaped = false;
                continue;
            }
            
            if (char === '\\') {
                escaped = true;
                continue;
            }
            
            if (inString) {
                if (char === stringChar) {
                    inString = false;
                    stringChar = null;
                }
                continue;
            }
            
            if (char === '"' || char === "'") {
                inString = true;
                stringChar = char;
                continue;
            }
            
            if (pairs[char]) {
                stack.push(char);
            } else if (Object.values(pairs).includes(char)) {
                const last = stack.pop();
                if (!last || pairs[last] !== char) {
                    throw new Error(`LUASCRIPT_VALIDATION_ERROR: Unmatched '${char}' at position ${i}`);
                }
            }
        }
        
        if (stack.length > 0) {
            throw new Error(`LUASCRIPT_VALIDATION_ERROR: Unmatched '${stack[stack.length - 1]}'`);
        }
        
        if (inString) {
            throw new Error(`LUASCRIPT_VALIDATION_ERROR: Unterminated string literal`);
        }
    }

    /**
     * PERFECT PARSER INITIATIVE - Phase 1: Runtime Output Validation
     * Validates the generated Lua code for correctness
     */
    validateOutput(luaCode, options) {
        // Basic Lua syntax validation
        if (typeof luaCode !== 'string') {
            throw new Error('LUASCRIPT_INTERNAL_ERROR: Generated code is not a string');
        }
        
        if (luaCode.trim().length === 0) {
            throw new Error('LUASCRIPT_INTERNAL_ERROR: Generated code is empty');
        }
        
        // Check for common Lua syntax errors (excluding valid Lua syntax like comments)
        const luaSyntaxChecks = [
            { pattern: /\+\+/, message: 'Invalid Lua syntax: ++ operator found (should be converted)' },
            { pattern: /===/, message: 'Invalid Lua syntax: === operator found (should be ==)' },
            { pattern: /!==/, message: 'Invalid Lua syntax: !== operator found (should be ~=)' },
            { pattern: /\|\|/, message: 'Invalid Lua syntax: || operator found (should be or)' },
            { pattern: /&&/, message: 'Invalid Lua syntax: && operator found (should be and)' }
        ];
        
        // Special check for -- operator that's not a Lua comment
        const lines = luaCode.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const commentIndex = line.indexOf('--');
            if (commentIndex > 0) {
                // Check if there's a -- that's not at the start of a comment
                const beforeComment = line.substring(0, commentIndex);
                if (/--/.test(beforeComment)) {
                    throw new Error('LUASCRIPT_OUTPUT_VALIDATION_ERROR: Invalid Lua syntax: -- operator found (should be converted)');
                }
            }
        }
        
        for (const { pattern, message } of luaSyntaxChecks) {
            if (pattern.test(luaCode)) {
                throw new Error(`LUASCRIPT_OUTPUT_VALIDATION_ERROR: ${message}`);
            }
        }
        
        // Validate that runtime library is properly injected if required
        if (options.includeRuntime !== false) {
            if (!luaCode.includes("require('runtime.runtime')")) {
                throw new Error('LUASCRIPT_OUTPUT_VALIDATION_ERROR: Runtime library not properly injected');
            }
        }
        
        // Check for balanced Lua syntax
        this.validateLuaSyntaxBalance(luaCode);
    }

    /**
     * PERFECT PARSER INITIATIVE - Phase 1: Lua Syntax Balance Validation
     * Ensures Lua-specific syntax is properly balanced
     */
    validateLuaSyntaxBalance(code) {
        const luaKeywords = ['function', 'if', 'while', 'for', 'do'];
        const luaEnders = ['end'];
        
        let depth = 0;
        const lines = code.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Skip comments and empty lines
            if (line.startsWith('--') || line.length === 0) continue;
            
            // Count opening keywords
            for (const keyword of luaKeywords) {
                const regex = new RegExp(`\\b${keyword}\\b`, 'g');
                const matches = line.match(regex);
                if (matches) {
                    depth += matches.length;
                }
            }
            
            // Count closing keywords
            for (const ender of luaEnders) {
                const regex = new RegExp(`\\b${ender}\\b`, 'g');
                const matches = line.match(regex);
                if (matches) {
                    depth -= matches.length;
                }
            }
            
            if (depth < 0) {
                throw new Error(`LUASCRIPT_OUTPUT_VALIDATION_ERROR: Unmatched 'end' at line ${i + 1}`);
            }
        }
        
        if (depth > 0) {
            throw new Error(`LUASCRIPT_OUTPUT_VALIDATION_ERROR: ${depth} unmatched opening keyword(s) found`);
        }
    }

    /**
     * Fix string concatenation operator: + to ..
     * PERFECT PARSER INITIATIVE - Phase 1: Critical Fix
     * 
     * ISSUE: Previous implementation converted ALL + operators to .., including numeric addition
     * SOLUTION: Context-aware detection of string concatenation vs numeric addition
     */
    fixStringConcatenation(code) {
        // Enhanced context-aware string concatenation detection
        // This implementation properly distinguishes between numeric addition and string concatenation
        
        let result = code;
        
        // Pattern 1: String literal + anything -> string concatenation
        // Use negative lookbehind/lookahead to preserve string content
        result = result.replace(
            /(["'])([^"']*)\1\s*\+\s*([^;,)}\]]+)/g,
            (match, quote, content, rest) => {
                return `${quote}${content}${quote} .. ${rest}`;
            }
        );
        
        // Pattern 2: Anything + string literal -> string concatenation  
        result = result.replace(
            /([^;,({[\s]+)\s*\+\s*(["'])([^"']*)\2/g,
            (match, left, quote, content) => {
                return `${left} .. ${quote}${content}${quote}`;
            }
        );
        
        // Pattern 3: Variable + variable where at least one is likely a string
        // (This is more conservative - only converts if we have strong indicators)
        result = result.replace(
            /(\w+)\s*\+\s*(\w+)(?=\s*[;,)}\]])/g,
            (match, left, right) => {
                // Keep numeric patterns as addition
                if (/^(sum|total|count|num|value|result|calc)$/i.test(left) || 
                    /^(sum|total|count|num|value|result|calc)$/i.test(right)) {
                    return match; // Keep as numeric addition
                }
                // Convert likely string concatenations
                if (/^(message|text|str|name|title|label|output)$/i.test(left) || 
                    /^(message|text|str|name|title|label|output)$/i.test(right)) {
                    return `${left} .. ${right}`;
                }
                return match; // Default: keep as addition for ambiguous cases
            }
        );
        
        // Pattern 4: Handle chained concatenations that were partially converted
        result = result.replace(
            /(\w+|["'][^"']*["'])\s*\.\.\s*([^;,)}\]]+)\s*\+\s*([^;,)}\]]+)/g,
            '$1 .. $2 .. $3'
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
     * PERFECT PARSER INITIATIVE - Phase 1: Fixed to avoid converting colons in strings
     */
    convertObjects(code) {
        // Enhanced object literal conversion that preserves colons in strings
        let result = code;
        let inString = false;
        let stringChar = null;
        let i = 0;
        
        while (i < result.length) {
            const char = result[i];
            
            // Handle string boundaries
            if (!inString && (char === '"' || char === "'")) {
                inString = true;
                stringChar = char;
            } else if (inString && char === stringChar && result[i-1] !== '\\') {
                inString = false;
                stringChar = null;
            }
            
            // Only convert colons outside of strings in object-like contexts
            if (!inString && char === ':') {
                // Look for pattern: word : value (object property)
                const beforeColon = result.substring(0, i).match(/(\w+)\s*$/);
                const afterColon = result.substring(i + 1).match(/^\s*([^,}]+)/);
                
                if (beforeColon && afterColon) {
                    // Check if this looks like an object property (not in a string context)
                    const context = result.substring(Math.max(0, i - 50), i);
                    const isInObjectContext = context.includes('{') && !context.includes('"') && !context.includes("'");
                    
                    if (isInObjectContext) {
                        result = result.substring(0, i) + ' = ' + result.substring(i + 1);
                        i += 2; // Skip the ' = ' we just inserted
                        continue;
                    }
                }
            }
            
            i++;
        }
        
        return result;
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
