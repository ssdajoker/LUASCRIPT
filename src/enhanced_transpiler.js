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

/**
 * An enhanced version of the LuaScript transpiler with more comprehensive JavaScript feature support.
 * This class provides more robust transformations and better error handling.
 */
class EnhancedLuaScriptTranspiler {
    /**
     * Creates an instance of the EnhancedLuaScriptTranspiler.
     * @param {object} [options={}] - Configuration options for the transpiler.
     * @param {boolean} [options.includeRuntime=true] - Whether to inject the Lua runtime library.
     * @param {boolean} [options.strictMode=true] - Whether to enable strict mode checks.
     * @param {boolean} [options.preserveComments=false] - Whether to preserve comments from the original code.
     */
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
     * The main transpilation function, which converts JavaScript code to Lua with enhanced feature support.
     * The transpilation process is divided into multiple phases to ensure correct transformation ordering.
     * @param {string} jsCode - The JavaScript code to transpile.
     * @param {object} [options={}] - Transpilation options for this specific call.
     * @param {boolean} [options.includeRuntime] - Overrides the default runtime inclusion setting.
     * @returns {string} The transpiled Lua code.
     * @throws {Error} If transpilation fails due to invalid input or a processing error.
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
            
            // Phase 3: Convert declarations and functions
            luaCode = this.convertVariableDeclarations(luaCode);
            luaCode = this.convertFunctionDeclarations(luaCode);
            luaCode = this.convertArrowFunctions(luaCode);
            
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
     * Validates the input JavaScript code before processing.
     * @param {string} code - The code to validate.
     * @throws {Error} If the input is not a string, is empty, or exceeds the size limit.
     * @private
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
     * Validates the output Lua code for common transpilation artifacts.
     * @param {string} code - The code to validate.
     * @private
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
     * Replaces string literals in the code with placeholders to prevent them from being modified by other transformations.
     * This is a crucial step to ensure that strings are preserved correctly.
     * @param {string} code - The code to process.
     * @returns {{code: string, strings: string[]}} An object containing the code with placeholders and an array of the original strings.
     * @private
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
     * Restores the original string literals from their placeholders.
     * @param {string} code - The code containing placeholders.
     * @param {string[]} strings - The array of original string literals.
     * @returns {string} The code with string literals restored.
     * @private
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
     * Converts the JavaScript string concatenation operator `+` to Lua's `..`.
     * This version is context-aware to avoid incorrectly converting numeric addition.
     * @param {string} code - The code to transform.
     * @returns {string} The transformed code.
     * @private
     */
    fixStringConcatenation(code) {
        let result = code;
        const leftPattern = /(['"`](?:\\.|[^'"`])*['"`])\s*\+\s*(\([^)]*\)|[^\s;,)}\]]+)/g;
        const rightPattern = /(\([^)]*\)|[^\s;,({\[]+)\s*\+\s*(['"`](?:\\.|[^'"`])*['"`])/g;

        let previous;
        do {
            previous = result;
            result = result.replace(leftPattern, (match, literal, expr) => {
                return `${literal} .. ${expr.trim()}`;
            });
            result = result.replace(rightPattern, (match, expr, literal) => {
                return `${expr.trim()} .. ${literal}`;
            });
        } while (result !== previous);

        return result;
    }

    /**
     * Converts JavaScript equality operators to their Lua equivalents.
     * @param {string} code - The code to transform.
     * @returns {string} The transformed code.
     * @private
     */
    fixEqualityOperators(code) {
        return code
            .replace(/!==/g, '~=')
            .replace(/!=/g, '~=')
            .replace(/===/g, '==');
    }

    /**
     * Converts JavaScript logical operators to their Lua equivalents.
     * @param {string} code - The code to transform.
     * @returns {string} The transformed code.
     * @private
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
     * Converts JavaScript unary operators like `typeof` and `void` to Lua equivalents.
     * @param {string} code - The code to transform.
     * @returns {string} The transformed code.
     * @private
     */
    fixUnaryOperators(code) {
        // typeof operator
        let result = code.replace(/typeof\s+(\w+)/g, 'type($1)');
        
        // void operator (convert to nil)
        result = result.replace(/void\s+\d+/g, 'nil');
        
        return result;
    }

    /**
     * Converts increment (`++`) and decrement (`--`) operators to their Lua equivalents (`var = var + 1`).
     * @param {string} code - The code to transform.
     * @returns {string} The transformed code.
     * @private
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
     * Placeholder for fixing comparison operators. Most are compatible between JS and Lua.
     * @param {string} code - The code to transform.
     * @returns {string} The transformed code.
     * @private
     */
    fixComparisonOperators(code) {
        // All comparison operators are already compatible between JS and Lua
        // except for === and !== which are handled in fixEqualityOperators
        return code;
    }

    /**
     * Converts compound assignment operators (e.g., `+=`, `-=`) to their expanded Lua form (`var = var + value`).
     * @param {string} code - The code to transform.
     * @returns {string} The transformed code.
     * @private
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
     * Converts JavaScript variable declarations (`var`, `let`, `const`) to Lua `local` declarations.
     * @param {string} code - The code to transform.
     * @returns {string} The transformed code.
     * @private
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
     * Converts JavaScript function declarations (named and anonymous) to Lua function syntax.
     * @param {string} code - The code to transform.
     * @returns {string} The transformed code.
     * @private
     */
    convertFunctionDeclarations(code) {
        let result = code;

        // Named function declarations
        result = result.replace(
            /function\s+(\w+)\s*\(([^)]*)\)\s*\{/g,
            (match, name, params) => `local function ${name}(${params})`
        );

        // Anonymous function expressions (with optional existing local)
        result = result.replace(
            /(?:local\s+)?(\w+)\s*=\s*function\s*\(([^)]*)\)\s*\{/g,
            (match, name, params) => `local ${name} = function(${params})`
        );

        return result;
    }

    /**
     * Converts JavaScript arrow functions to Lua anonymous functions.
     * @param {string} code - The code to transform.
     * @returns {string} The transformed code.
     * @private
     */
    convertArrowFunctions(code) {
        let result = code;

        // Arrow function with block: (params) => { body }
        result = result.replace(
            /(?:local\s+)?(\w+)\s*=\s*\(([^)]*)\)\s*=>\s*\{/g,
            (match, name, params) => `local ${name} = function(${params})`
        );

        // Arrow function with single param: param => { body }
        result = result.replace(
            /(?:local\s+)?(\w+)\s*=\s*(\w+)\s*=>\s*\{/g,
            (match, name, param) => `local ${name} = function(${param})`
        );

        // Arrow function with expression: (params) => expression
        result = result.replace(
            /(?:local\s+)?(\w+)\s*=\s*\(([^)]*)\)\s*=>\s*([^;{]+);?/g,
            (match, name, params, expr) => `local ${name} = function(${params}) return ${expr.trim()} end`
        );

        return result;
    }

    /**
     * Converts JavaScript conditional statements (`if`, `else if`, `else`) to Lua's `if/then/elseif/else/end` syntax.
     * @param {string} code - The code to transform.
     * @returns {string} The transformed code.
     * @private
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
     * Converts the JavaScript ternary operator (`condition ? expr1 : expr2`) into a Lua `(condition and expr1 or expr2)` expression.
     * @param {string} code - The code to transform.
     * @returns {string} The transformed code.
     * @private
     */
    convertTernaryOperator(code) {
        // Convert ternary to if-then-else expression
        return code.replace(
            /(\w[\w\.\[\]]*)\s*=\s*([^?]+?)\?\s*([^:]+?)\s*:\s*([^;]+);?/g,
            (match, target, condition, truthy, falsy) => {
                const trimmedCondition = condition.trim();
                const trimmedTruthy = truthy.trim();
                const trimmedFalsy = falsy.trim();
                return `${target} = (${trimmedCondition}) and ${trimmedTruthy} or ${trimmedFalsy}`;
            }
        );
    }

    /**
     * Converts various JavaScript loop types (`for`, `while`, `do-while`, `for-in`, `for-of`) to their Lua equivalents.
     * @param {string} code - The code to transform.
     * @returns {string} The transformed code.
     * @private
     */
    convertLoops(code) {
        let result = code;
        
        // IMPORTANT: Process for loops BEFORE while loops to avoid conflicts
        
        // For loops - numeric for (must be done before increment operator conversion)
        result = result.replace(
            /for\s*\(\s*(?:var|let|const)?\s*(\w+)\s*=\s*(\d+)\s*;\s*\1\s*<\s*(\d+)\s*;\s*\1\+\+\s*\)\s*\{/g,
            (match, varName, start, end) => {
                const endVal = parseInt(end, 10) - 1;
                return `for ${varName} = ${start}, ${endVal} do`;
            }
        );
        
        result = result.replace(
            /for\s*\(\s*(?:var|let|const)?\s*(\w+)\s*=\s*(\d+)\s*;\s*\1\s*<=\s*(\d+)\s*;\s*\1\+\+\s*\)\s*\{/g,
            'for $1 = $2, $3 do'
        );

        // For loops comparing against array length
        result = result.replace(
            /for\s*\(\s*(?:var|let|const)?\s*(\w+)\s*=\s*(\d+)\s*;\s*\1\s*<\s*(\w+)\.length\s*;\s*\1\+\+\s*\)\s*\{/g,
            (match, iterator, start, arrayName) => {
                return `for ${iterator} = ${start}, #${arrayName} - 1 do`;
            }
        );

        result = result.replace(
            /for\s*\(\s*(?:var|let|const)?\s*(\w+)\s*=\s*(\d+)\s*;\s*\1\s*<=\s*(\w+)\.length\s*;\s*\1\+\+\s*\)\s*\{/g,
            (match, iterator, start, arrayName) => {
                return `for ${iterator} = ${start}, #${arrayName} do`;
            }
        );
        
        // For loops with step (must handle += before it's converted)
        result = result.replace(
            /for\s*\(\s*(?:var|let|const)?\s*(\w+)\s*=\s*(\d+)\s*;\s*\1\s*<\s*(\d+)\s*;\s*\1\s*\+=\s*(\d+)\s*\)\s*\{/g,
            (match, varName, start, end, step) => {
                const endVal = parseInt(end, 10) - 1;
                return `for ${varName} = ${start}, ${endVal}, ${step} do`;
            }
        );

        result = result.replace(
            /for\s*\(\s*(?:var|let|const)?\s*(\w+)\s*=\s*(\d+)\s*;\s*\1\s*<\s*(\w+)\.length\s*;\s*\1\s*\+=\s*(\d+)\s*\)\s*\{/g,
            (match, iterator, start, arrayName, step) => {
                return `for ${iterator} = ${start}, #${arrayName} - 1, ${step} do`;
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
     * Converts JavaScript `switch` statements into equivalent Lua `if/elseif/else` chains.
     * @param {string} code - The code to transform.
     * @returns {string} The transformed code.
     * @private
     */
    convertSwitchStatements(code) {
        let result = code;
        
        // This is a simplified conversion - full switch support would need AST parsing
        result = result.replace(
            /switch\s*\(([^)]+)\)\s*\{/g,
            (match, expr) => {
                return `local __selector_expr = ${expr}; if false then`;
            }
        );
        
        // Convert case statements
        result = result.replace(
            /case\s+([^:]+):/g,
            'elseif __selector_expr == $1 then'
        );
        
        // Convert default case
        result = result.replace(/default:/g, 'else');
        
        // Remove break statements (Lua doesn't need them)
        result = result.replace(/break;?/g, '');
        
        return result;
    }

    /**
     * Converts JavaScript array literals to Lua table literals.
     * @param {string} code - The code to transform.
     * @returns {string} The transformed code.
     * @private
     */
    convertArrays(code) {
        // Convert array literals: [1, 2, 3] to {1, 2, 3}
        // Use a more careful regex that doesn't match array access
        let result = code;
        
        // Match array literals (not array access like arr[i])
        // Look for [ that's preceded by = or , or ( or start of line
        result = result.replace(/(^|[=,(\s])\[([^\]]*)\]/gm, '$1{$2}');
        
        return result;
    }

    /**
     * Converts JavaScript object literals to Lua tables, preserving colons within strings.
     * @param {string} code - The code to transform.
     * @returns {string} The transformed code.
     * @private
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
     * Cleans up the generated Lua code by fixing brace-to-end conversions and normalizing whitespace.
     * @param {string} code - The code to clean up.
     * @returns {string} The cleaned-up code.
     * @private
     */
    cleanupCode(code) {
        let result = code;
        
        // Convert closing braces to end ONLY for control structures and functions
        // NOT for object/array literals (which use {})
        // Use a more sophisticated approach that handles nested structures
        
        let depth = 0;
        let inTable = [];
        let output = '';
        
        for (let i = 0; i < result.length; i++) {
            const char = result[i];
            
            if (char === '{') {
                // Check if this is a table literal or control structure by examining previous token
                const before = result.substring(0, i).trimEnd();
                const prevChar = before.length > 0 ? before[before.length - 1] : '';
                const isTable = ['=', ',', '(', '[', '{', ':'].includes(prevChar);

                inTable[depth] = isTable;
                depth++;
                output += char;
            } else if (char === '}') {
                depth--;
                if (depth >= 0 && inTable[depth]) {
                    output += '}'; // Keep as table closing
                } else {
                    output += 'end'; // Convert to end for control structures
                }
            } else {
                output += char;
            }
        }
        
        result = output;
        
        // Remove semicolons (optional in Lua) but keep line structure
        result = result.replace(/;/g, '');
        
        // Fix multiple spaces
        result = result.replace(/  +/g, ' ');
        
        // Clean up extra whitespace
        result = result.replace(/\n\s*\n\s*\n/g, '\n\n');
        
        return result;
    }

    /**
     * Injects the Lua runtime library to provide standard JavaScript APIs.
     * @param {string} code - The transpiled Lua code.
     * @returns {string} The code with the runtime library injected.
     * @private
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
     * Reads a JavaScript file, transpiles it, and optionally writes the output to a file.
     * @param {string} inputPath - The path to the input JavaScript file.
     * @param {string} [outputPath] - The path to the output Lua file.
     * @param {object} [options={}] - Transpilation options.
     * @returns {string} The transpiled Lua code.
     * @throws {Error} If the file cannot be read or written.
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
     * Retrieves the current transpilation statistics.
     * @returns {object} An object containing statistics like transpilations count, total time, and error/warning logs.
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
