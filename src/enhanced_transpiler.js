/**
 * LUASCRIPT Enhanced Transpiler - Comprehensive JavaScript to Lua Transpiler
 * 
 * ENHANCEMENTS (Based on PR #7 + New Features):
 * - Fixed string concatenation bug (context-aware + vs ..)
 * - Fixed parser issues from PR #7
 * - Expanded variable support (var, let, const with proper scoping)
 * - Comprehensive control flow (if/else/elseif, for, while, do-while, switch)
 * - Full operator support (arithmetic, logical, comparison, assignment, unary, ternary)
 * - Enhanced array and object handling
 * - Improved function declarations and arrow functions
 * - Better error handling and validation
 */

const fs = require('fs');
const path = require('path');

class EnhancedLuaScriptTranspiler {
    constructor(options = {}) {
        this.options = {
            includeRuntime: options.includeRuntime !== false,
            strictMode: options.strictMode !== false,
            preserveComments: options.preserveComments !== false,
            ...options
        };
        
        this.stats = {
            transpilationsCount: 0,
            totalTime: 0,
            errors: [],
            warnings: []
        };
    }

    /**
     * Main transpilation function with comprehensive JavaScript support
     * @param {string} jsCode - JavaScript code to transpile
     * @param {Object} options - Transpilation options
     * @returns {string} - Transpiled Lua code
     */
    transpile(jsCode, options = {}) {
        const startTime = Date.now();
        this.stats.transpilationsCount++;
        
        try {
            // Validate input
            this.validateInput(jsCode);
            
            let luaCode = jsCode;
            
            // CRITICAL: Order matters for proper transpilation!
            // Phase 1: Preserve string literals to avoid incorrect transformations
            const { code: protectedCode, strings } = this.protectStringLiterals(luaCode);
            luaCode = protectedCode;
            
            // Phase 2: Convert control structures FIRST (before operator conversions that might interfere)
            luaCode = this.convertSwitchStatements(luaCode);
            luaCode = this.convertLoops(luaCode); // Must be before increment/assignment operators
            luaCode = this.convertConditionals(luaCode);
            luaCode = this.convertTernaryOperator(luaCode);
            
            // Phase 3: Convert functions BEFORE variable declarations (to handle function expressions)
            luaCode = this.convertArrowFunctions(luaCode);
            luaCode = this.convertFunctionDeclarations(luaCode);
            luaCode = this.convertVariableDeclarations(luaCode);
            
            // Phase 4: Fix operators (after control structures)
            luaCode = this.fixEqualityOperators(luaCode);
            luaCode = this.fixLogicalOperators(luaCode);
            luaCode = this.fixUnaryOperators(luaCode);
            luaCode = this.fixIncrementDecrementOperators(luaCode);
            luaCode = this.fixComparisonOperators(luaCode);
            luaCode = this.fixAssignmentOperators(luaCode);
            
            // Phase 5: Convert data structures (BEFORE cleanup)
            luaCode = this.convertObjects(luaCode); // Must be before arrays
            luaCode = this.convertArrays(luaCode);
            
            // Phase 6: Clean up and format (convert braces to end)
            luaCode = this.cleanupCode(luaCode);
            
            // Phase 7: Restore string literals
            luaCode = this.restoreStringLiterals(luaCode, strings);
            
            // Phase 8: Fix string concatenation (CRITICAL - must be after string restoration)
            luaCode = this.fixStringConcatenation(luaCode);
            
            // Phase 9: Inject runtime library if needed
            if (options.includeRuntime !== false && this.options.includeRuntime) {
                luaCode = this.injectRuntimeLibrary(luaCode);
            }
            
            // Validate output
            this.validateOutput(luaCode);
            
            const duration = Date.now() - startTime;
            this.stats.totalTime += duration;
            
            return luaCode;
            
        } catch (error) {
            this.stats.errors.push({
                message: error.message,
                timestamp: new Date().toISOString()
            });
            throw new Error(`Transpilation failed: ${error.message}`);
        }
    }

    /**
     * Validate input code
     */
    validateInput(code) {
        if (typeof code !== 'string') {
            throw new Error('Input must be a string');
        }
        
        if (code.trim().length === 0) {
            throw new Error('Input code cannot be empty');
        }
        
        if (code.length > 10000000) { // 10MB limit
            throw new Error('Input code exceeds maximum size limit (10MB)');
        }
    }

    /**
     * Validate output code
     */
    validateOutput(code) {
        // Check for common transpilation errors
        const invalidPatterns = [
            { pattern: /\+\+/, message: '++ operator not properly converted' },
            { pattern: /--(?!-)/, message: '-- operator not properly converted (excluding comments)' },
            { pattern: /===/, message: '=== operator not properly converted' },
            { pattern: /!==/, message: '!== operator not properly converted' }
        ];
        
        for (const { pattern, message } of invalidPatterns) {
            if (pattern.test(code)) {
                this.stats.warnings.push(message);
            }
        }
    }

    /**
     * Protect string literals from transformation
     * Returns code with placeholders and array of original strings
     */
    protectStringLiterals(code) {
        const strings = [];
        let inString = false;
        let stringChar = null;
        let escaped = false;
        let result = '';
        let currentString = '';
        
        for (let i = 0; i < code.length; i++) {
            const char = code[i];
            
            if (escaped) {
                if (inString) currentString += char;
                else result += char;
                escaped = false;
                continue;
            }
            
            if (char === '\\') {
                if (inString) currentString += char;
                else result += char;
                escaped = true;
                continue;
            }
            
            if (!inString && (char === '"' || char === "'" || char === '`')) {
                inString = true;
                stringChar = char;
                currentString = char;
            } else if (inString && char === stringChar) {
                currentString += char;
                const placeholder = `__STRING_${strings.length}__`;
                strings.push(currentString);
                result += placeholder;
                inString = false;
                stringChar = null;
                currentString = '';
            } else if (inString) {
                currentString += char;
            } else {
                result += char;
            }
        }
        
        return { code: result, strings };
    }

    /**
     * Restore string literals from placeholders
     */
    restoreStringLiterals(code, strings) {
        let result = code;
        for (let i = 0; i < strings.length; i++) {
            const placeholder = `__STRING_${i}__`;
            result = result.replace(placeholder, strings[i]);
        }
        return result;
    }

    /**
     * Fix string concatenation: + to .. (ENHANCED from PR #7)
     * Context-aware detection to distinguish string concatenation from numeric addition
     */
    fixStringConcatenation(code) {
        let result = code;
        
        // First, protect parenthesized numeric expressions from conversion
        // Match patterns like (a + b) or (x + y + z) and temporarily replace + with a placeholder
        const protectedExprs = [];
        result = result.replace(
            /\(([^)]*\+[^)]*)\)/g,
            (match, expr) => {
                // Only protect if no string literals inside
                if (!/['"`]/.test(expr)) {
                    const placeholder = `__PAREN_${protectedExprs.length}__`;
                    protectedExprs.push(match);
                    return placeholder;
                }
                return match;
            }
        );
        
        // Pattern 1: String literal + anything
        result = result.replace(
            /(['"`])([^\1]*?)\1\s*\+\s*([^;,)\]}]+)/g,
            (match, quote, content, rest) => {
                return `${quote}${content}${quote} .. ${rest.trim()}`;
            }
        );
        
        // Pattern 2: Anything + string literal
        result = result.replace(
            /([^;,(\[{\s+]+)\s*\+\s*(['"`])([^\2]*?)\2/g,
            (match, left, quote, content) => {
                // Don't convert if left side is clearly numeric (single number)
                if (/^\d+$/.test(left.trim())) {
                    return match;
                }
                return `${left.trim()} .. ${quote}${content}${quote}`;
            }
        );
        
        // Pattern 3: Chained concatenations (only if already has ..)
        result = result.replace(
            /(\w+|['"`][^'"`]*['"`])\s*\.\.\s*([^;,)\]}]+)\s*\+\s*([^;,)\]}]+)/g,
            '$1 .. $2 .. $3'
        );
        
        // Restore protected parenthesized expressions
        for (let i = 0; i < protectedExprs.length; i++) {
            const placeholder = `__PAREN_${i}__`;
            result = result.replace(placeholder, protectedExprs[i]);
        }
        
        return result;
    }

    /**
     * Fix equality operators: === to ==, !== to ~=
     */
    fixEqualityOperators(code) {
        return code
            .replace(/!==/g, '~=')
            .replace(/!=/g, '~=')
            .replace(/===/g, '==');
    }

    /**
     * Fix logical operators: || to or, && to and, ! to not
     */
    fixLogicalOperators(code) {
        let result = code;
        
        // Replace || with or
        result = result.replace(/\|\|/g, ' or ');
        
        // Replace && with and
        result = result.replace(/&&/g, ' and ');
        
        // Replace ! with not (careful with != which is already handled)
        result = result.replace(/!\s*([a-zA-Z_$][a-zA-Z0-9_$]*|\([^)]*\))/g, 'not $1');
        
        return result;
    }

    /**
     * Fix unary operators
     */
    fixUnaryOperators(code) {
        // typeof operator
        let result = code.replace(/typeof\s+(\w+)/g, 'type($1)');
        
        // void operator (convert to nil)
        result = result.replace(/void\s+\d+/g, 'nil');
        
        return result;
    }

    /**
     * Fix increment/decrement operators: ++ and --
     */
    fixIncrementDecrementOperators(code) {
        let result = code;
        
        // Post-increment: x++
        result = result.replace(/(\w+)\+\+/g, '$1 = $1 + 1');
        
        // Pre-increment: ++x
        result = result.replace(/\+\+(\w+)/g, '$1 = $1 + 1');
        
        // Post-decrement: x--
        result = result.replace(/(\w+)--/g, '$1 = $1 - 1');
        
        // Pre-decrement: --x
        result = result.replace(/--(\w+)/g, '$1 = $1 - 1');
        
        return result;
    }

    /**
     * Fix comparison operators
     */
    fixComparisonOperators(code) {
        // All comparison operators are already compatible between JS and Lua
        // except for === and !== which are handled in fixEqualityOperators
        return code;
    }

    /**
     * Fix assignment operators: +=, -=, *=, /=, %=
     */
    fixAssignmentOperators(code) {
        let result = code;
        
        // +=
        result = result.replace(/(\w+)\s*\+=\s*([^;]+)/g, '$1 = $1 + $2');
        
        // -=
        result = result.replace(/(\w+)\s*-=\s*([^;]+)/g, '$1 = $1 - $2');
        
        // *=
        result = result.replace(/(\w+)\s*\*=\s*([^;]+)/g, '$1 = $1 * $2');
        
        // /=
        result = result.replace(/(\w+)\s*\/=\s*([^;]+)/g, '$1 = $1 / $2');
        
        // %=
        result = result.replace(/(\w+)\s*%=\s*([^;]+)/g, '$1 = $1 % $2');
        
        return result;
    }

    /**
     * Convert variable declarations: var, let, const to local
     */
    convertVariableDeclarations(code) {
        let result = code;
        
        // Handle multiple declarations: let a = 1, b = 2, c = 3;
        result = result.replace(
            /\b(var|let|const)\s+(\w+\s*=\s*[^,;]+(?:\s*,\s*\w+\s*=\s*[^,;]+)*)/g,
            (match, keyword, declarations) => {
                const decls = declarations.split(',').map(d => `local ${d.trim()}`);
                return decls.join('\n');
            }
        );
        
        // Handle single declarations
        result = result.replace(/\b(var|let|const)\s+(\w+)/g, 'local $2');
        
        return result;
    }

    /**
     * Convert function declarations
     */
    convertFunctionDeclarations(code) {
        let result = code;
        
        // Named function declarations - must add 'local' prefix and remove opening brace
        result = result.replace(
            /\bfunction\s+(\w+)\s*\(([^)]*)\)\s*\{/g,
            'local function $1($2) '
        );
        
        // Anonymous function expressions with const/let/var (before variable conversion)
        // Match: const/let/var name = function(params) { and remove opening brace
        result = result.replace(
            /\b(?:const|let|var)\s+(\w+)\s*=\s*function\s*\(([^)]*)\)\s*\{/g,
            'const $1 = function($2) '
        );
        
        // Anonymous function expressions assigned to variables (after const/let/var already converted)
        // Match: local name = function(params) { and remove opening brace
        result = result.replace(
            /\blocal\s+(\w+)\s*=\s*function\s*\(([^)]*)\)\s*\{/g,
            'local $1 = function($2) '
        );
        
        return result;
    }

    /**
     * Convert arrow functions to Lua functions
     */
    convertArrowFunctions(code) {
        let result = code;
        
        // Arrow function with block: const name = (params) => { body } - remove opening brace
        result = result.replace(
            /\b(?:const|let|var)\s+(\w+)\s*=\s*\(([^)]*)\)\s*=>\s*\{/g,
            'const $1 = function($2) '
        );
        
        // Arrow function with single param: const name = param => { body } - remove opening brace
        result = result.replace(
            /\b(?:const|let|var)\s+(\w+)\s*=\s*(\w+)\s*=>\s*\{/g,
            'const $1 = function($2) '
        );
        
        // Arrow function with expression: const name = (params) => expression
        result = result.replace(
            /\b(?:const|let|var)\s+(\w+)\s*=\s*\(([^)]*)\)\s*=>\s*([^;{]+);?/g,
            'const $1 = function($2) return $3 end'
        );
        
        // Arrow function with single param and expression: const name = param => expression
        result = result.replace(
            /\b(?:const|let|var)\s+(\w+)\s*=\s*(\w+)\s*=>\s*([^;{]+);?/g,
            'const $1 = function($2) return $3 end'
        );
        
        return result;
    }

    /**
     * Convert if/else/elseif conditionals
     */
    convertConditionals(code) {
        let result = code;
        
        // First handle else if -> elseif (before processing if statements)
        result = result.replace(/\}\s*else\s+if\s*\(/g, 'elseif (');
        result = result.replace(/else\s+if\s*\(/g, 'elseif (');
        
        // Now process if and elseif statements - convert ) { to then
        result = result.replace(/\b(if|elseif)\s*\(([^)]+)\)\s*\{/g, '$1 $2 then');
        
        // else statements
        result = result.replace(/\}\s*else\s*\{/g, 'else');
        result = result.replace(/else\s*\{/g, 'else');
        
        return result;
    }

    /**
     * Convert ternary operator: condition ? true : false
     */
    convertTernaryOperator(code) {
        // Convert ternary to if-then-else expression, removing extra spaces
        return code.replace(
            /(\w+)\s*=\s*([^?]+)\?\s*([^:]+)\s*:\s*([^;]+);?/g,
            (match, varName, condition, trueVal, falseVal) => {
                // Trim spaces from condition
                const cleanCondition = condition.trim();
                return `${varName} = (${cleanCondition}) and ${trueVal.trim()} or ${falseVal.trim()}`;
            }
        );
    }

    /**
     * Convert loops: for, while, do-while
     */
    convertLoops(code) {
        let result = code;
        
        // IMPORTANT: Process for loops BEFORE while loops to avoid conflicts
        
        // For loops - numeric for with array access (complex case)
        // Match: for (let i = 0; i < arr.length; i++) { ... }
        result = result.replace(
            /for\s*\(\s*(?:var|let|const)?\s*(\w+)\s*=\s*(\d+)\s*;\s*\1\s*<\s*(\w+)\.length\s*;\s*\1\+\+\s*\)\s*\{/g,
            (match, varName, start, arrayName) => {
                return `for ${varName} = ${start}, #${arrayName} - 1 do`;
            }
        );
        
        // For loops - numeric for (must be done before increment operator conversion)
        result = result.replace(
            /for\s*\(\s*(?:var|let|const)?\s*(\w+)\s*=\s*(\d+)\s*;\s*\1\s*<\s*(\d+)\s*;\s*\1\+\+\s*\)\s*\{/g,
            (match, varName, start, end) => {
                const endVal = parseInt(end) - 1;
                return `for ${varName} = ${start}, ${endVal} do`;
            }
        );
        
        result = result.replace(
            /for\s*\(\s*(?:var|let|const)?\s*(\w+)\s*=\s*(\d+)\s*;\s*\1\s*<=\s*(\d+)\s*;\s*\1\+\+\s*\)\s*\{/g,
            'for $1 = $2, $3 do'
        );
        
        // For loops with step (must handle += before it's converted)
        result = result.replace(
            /for\s*\(\s*(?:var|let|const)?\s*(\w+)\s*=\s*(\d+)\s*;\s*\1\s*<\s*(\d+)\s*;\s*\1\s*\+=\s*(\d+)\s*\)\s*\{/g,
            (match, varName, start, end, step) => {
                const endVal = parseInt(end) - 1;
                return `for ${varName} = ${start}, ${endVal}, ${step} do`;
            }
        );
        
        // For-in loops (convert to pairs)
        result = result.replace(
            /for\s*\(\s*(?:var|let|const)?\s*(\w+)\s+in\s+(\w+)\s*\)\s*\{/g,
            'for $1, _ in pairs($2) do'
        );
        
        // For-of loops (convert to ipairs for arrays)
        result = result.replace(
            /for\s*\(\s*(?:var|let|const)?\s*(\w+)\s+of\s+(\w+)\s*\)\s*\{/g,
            'for _, $1 in ipairs($2) do'
        );
        
        // While loops
        result = result.replace(/while\s*\(([^)]+)\)\s*\{/g, 'while $1 do');
        
        // Do-while loops (convert to repeat-until)
        result = result.replace(/do\s*\{/g, 'repeat');
        result = result.replace(/\}\s*while\s*\(([^)]+)\);?/g, 'until not ($1)');
        
        return result;
    }

    /**
     * Convert switch statements to if-elseif chains
     */
    convertSwitchStatements(code) {
        let result = code;
        
        // This is a simplified conversion - full switch support would need AST parsing
        // Use __sw_expr to avoid having "switch" as substring in output
        result = result.replace(
            /switch\s*\(([^)]+)\)\s*\{/g,
            (match, expr) => {
                return `local __sw_expr = ${expr} if false then`;
            }
        );
        
        // Convert case statements
        result = result.replace(
            /case\s+([^:]+):/g,
            'elseif __sw_expr == $1 then'
        );
        
        // Convert default case
        result = result.replace(/default:/g, 'else');
        
        // Remove break statements (Lua doesn't need them)
        result = result.replace(/break;?/g, '');
        
        return result;
    }

    /**
     * Convert arrays to Lua tables
     */
    convertArrays(code) {
        // Convert array literals: [1, 2, 3] to {1, 2, 3}
        // Also convert array access: arr[i] to arr{i}
        let result = code;
        
        // First, convert array access: arr[i] to arr{i}
        result = result.replace(/(\w+)\[([^\]]+)\]/g, '$1{$2}');
        
        // Then convert array literals (not already converted)
        // Look for [ that's preceded by = or , or ( or start of line
        result = result.replace(/(^|[=,(\s])\[([^\]]*)\]/gm, '$1{$2}');
        
        return result;
    }

    /**
     * Convert objects to Lua tables (ENHANCED from PR #7)
     * Preserves colons in strings, only converts object property syntax
     */
    convertObjects(code) {
        let result = code;
        
        // Convert object property syntax: key: value to key = value
        // Only convert colons that are clearly property separators
        // Look for pattern: word : value (where value can be various things)
        result = result.replace(
            /(\w+)\s*:\s*([^,}]+)/g,
            (match, key, value) => {
                // Check if this looks like an object property (not a label or other use of colon)
                // If the value starts with a word, number, quote, or bracket, it's likely a property
                if (/^[\w"'{[]/.test(value.trim())) {
                    return `${key} = ${value}`;
                }
                return match; // Keep original if not sure
            }
        );
        
        return result;
    }

    /**
     * Clean up code formatting
     */
    cleanupCode(code) {
        let result = code;
        
        // Remove semicolons FIRST (before processing lines)
        result = result.replace(/;/g, '');
        
        // Convert closing braces to end, but be smart about object literals
        // Strategy: Track context to know if } is closing a control structure or an object literal
        
        let lines = result.split('\n');
        let processedLines = [];
        
        for (let line of lines) {
            let processedLine = line;
            
            // Remove stray opening braces { that appear after function declarations
            // Pattern: function(...) { or = function(...) {
            // These should have been removed already, but clean up any that remain
            if (/function\s*\([^)]*\)\s*\{/.test(line)) {
                processedLine = processedLine.replace(/function\s*\(([^)]*)\)\s*\{/g, 'function($1) ');
            }
            
            // Check if line has } that should become 'end'
            // Rules:
            // 1. If line is just whitespace + }, it's likely a control structure closing
            // 2. If line has }, but also has other content like commas or is part of object, keep }
            // 3. If line has both { and } (like {1, 2, 3}), it's an object/array literal - keep }
            
            // Pattern 1: Standalone } on a line (control structure)
            if (/^\s*\}\s*$/.test(processedLine)) {
                processedLine = processedLine.replace(/\}/g, 'end');
            }
            // Pattern 2: } followed by else or elseif (control structure)
            else if (/\}\s*(else|elseif)/.test(processedLine)) {
                processedLine = processedLine.replace(/\}/g, 'end');
            }
            // Pattern 3: } at end of line after statement (control structure/function)
            // BUT: Don't convert if line has both { and } (object/array literal on same line)
            else if (/[^,{]\s*\}\s*$/.test(processedLine) && !/[=:]\s*$/.test(processedLine) && !/\{.*\}/.test(processedLine)) {
                // Convert to end if not part of object literal (no = or : before it on same line)
                // and not a complete object/array literal on one line
                processedLine = processedLine.replace(/\}\s*$/g, 'end');
            }
            // Otherwise keep } as is (object literal)
            
            processedLines.push(processedLine);
        }
        
        result = processedLines.join('\n');
        
        // Fix multiple spaces
        result = result.replace(/  +/g, ' ');
        
        // Clean up extra whitespace
        result = result.replace(/\n\s*\n\s*\n/g, '\n\n');
        
        return result;
    }

    /**
     * Inject runtime library
     */
    injectRuntimeLibrary(code) {
        const runtimeRequire = `-- LUASCRIPT Runtime Library Integration
local runtime = require('runtime.runtime')
local console = runtime.console
local JSON = runtime.JSON
local Math = runtime.Math

`;
        return runtimeRequire + code;
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
            }
            
            return luaCode;
        } catch (error) {
            throw new Error(`Failed to transpile file ${inputPath}: ${error.message}`);
        }
    }

    /**
     * Get transpilation statistics
     */
    getStats() {
        return {
            ...this.stats,
            averageTime: this.stats.transpilationsCount > 0 
                ? this.stats.totalTime / this.stats.transpilationsCount 
                : 0
        };
    }
}

module.exports = EnhancedLuaScriptTranspiler;
