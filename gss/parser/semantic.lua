
-- Semantic Analysis for GSS
-- Variable resolution, type checking, default values

local M = {}

-- Default CSS variable values
M.defaults = {
    ["--muX"] = {value = 0, unit = "px"},
    ["--muY"] = {value = 0, unit = "px"},
    ["--sigma"] = {value = 20, unit = "px"},
    ["--weight"] = {value = 0.5, unit = ""},
    ["--threshold"] = {value = 0.5, unit = ""},
    ["--width"] = {value = 640, unit = "px"},
    ["--height"] = {value = 480, unit = "px"}
}

-- Variable ranges for validation
M.ranges = {
    ["--muX"] = {min = -1000, max = 1000},
    ["--muY"] = {min = -1000, max = 1000},
    ["--sigma"] = {min = 1, max = 200},
    ["--weight"] = {min = 0, max = 1},
    ["--threshold"] = {min = 0, max = 1},
    ["--width"] = {min = 1, max = 4096},
    ["--height"] = {min = 1, max = 4096}
}

-- Semantic context
function M.Context()
    return {
        variables = {},
        errors = {},
        warnings = {}
    }
end

-- Analyze stylesheet
function M.analyze(ast, context)
    context = context or M.Context()

    if ast.type == "Stylesheet" then
        for _, block in ipairs(ast.blocks) do
            M.analyze_block(block, context)
        end
    end

    return context
end

-- Analyze block
function M.analyze_block(block, context)
    for _, stmt in ipairs(block.statements) do
        M.analyze_statement(stmt, context)
    end
end

-- Analyze statement
function M.analyze_statement(stmt, context)
    if stmt.type == "FieldStmt" then
        M.analyze_field_expr(stmt.expr, context)
    elseif stmt.type == "RampStmt" then
        M.analyze_ramp_stmt(stmt, context)
    elseif stmt.type == "IsoStmt" then
        M.analyze_iso_stmt(stmt, context)
    elseif stmt.type == "BindStmt" then
        M.analyze_bind_stmt(stmt, context)
    elseif stmt.type == "LayerStmt" then
        for _, s in ipairs(stmt.statements) do
            M.analyze_statement(s, context)
        end
    end
end

-- Analyze field expression
function M.analyze_field_expr(expr, context)
    if expr.type == "GaussianExpr" then
        M.check_value(expr.muX, "muX", context)
        M.check_value(expr.muY, "muY", context)
        M.check_value(expr.sigma, "sigma", context)
    elseif expr.type == "MixExpr" then
        M.analyze_field_expr(expr.input1, context)
        M.analyze_field_expr(expr.input2, context)
        M.check_value(expr.weight, "weight", context)
    elseif expr.type == "SumExpr" then
        for _, input in ipairs(expr.inputs) do
            M.analyze_field_expr(input, context)
        end
    end
end

-- Analyze ramp statement
function M.analyze_ramp_stmt(stmt, context)
    local valid_palettes = {
        viridis = true,
        plasma = true,
        magma = true,
        inferno = true,
        custom = true
    }

    if not valid_palettes[stmt.palette] then
        table.insert(context.errors, {
            type = "invalid_palette",
            message = "Unknown palette: " .. stmt.palette
        })
    end
end

-- Analyze iso statement
function M.analyze_iso_stmt(stmt, context)
    M.check_value(stmt.threshold, "threshold", context)
    if stmt.width then
        M.check_value(stmt.width, "width", context)
    end
end

-- Analyze bind statement
function M.analyze_bind_stmt(stmt, context)
    for _, var in ipairs(stmt.vars) do
        context.variables[var] = true
    end
end

-- Check value and resolve CSS variables
function M.check_value(value, param_name, context)
    if value.type == "CSSVar" then
        local var_name = value.name

        -- Check if variable is defined
        if not M.defaults[var_name] then
            table.insert(context.warnings, {
                type = "undefined_variable",
                message = "CSS variable " .. var_name .. " not in defaults"
            })
        end

        -- Apply fallback if provided
        if value.fallback then
            return M.resolve_value(value.fallback, context)
        else
            return M.defaults[var_name] or {value = 0, unit = "px"}
        end
    elseif value.type == "Literal" then
        -- Validate range
        local var_key = "--" .. param_name
        if M.ranges[var_key] then
            local range = M.ranges[var_key]
            if value.value < range.min or value.value > range.max then
                table.insert(context.warnings, {
                    type = "out_of_range",
                    message = string.format("%s value %f out of range [%f, %f]",
                        param_name, value.value, range.min, range.max)
                })
            end
        end
        return value
    elseif value.type == "BinaryExpr" then
        local left = M.check_value(value.left, param_name, context)
        local right = M.check_value(value.right, param_name, context)
        return M.eval_binary_expr(value.op, left, right)
    end

    return value
end

-- Resolve value to concrete number
function M.resolve_value(value, context)
    if value.type == "CSSVar" then
        return M.defaults[value.name] or {value = 0, unit = "px"}
    elseif value.type == "Literal" then
        return value
    elseif value.type == "BinaryExpr" then
        local left = M.resolve_value(value.left, context)
        local right = M.resolve_value(value.right, context)
        return M.eval_binary_expr(value.op, left, right)
    end
    return {value = 0, unit = "px"}
end

-- Evaluate binary expression
function M.eval_binary_expr(op, left, right)
    local lval = left.value or 0
    local rval = right.value or 0
    local result = 0

    if op == "+" then
        result = lval + rval
    elseif op == "-" then
        result = lval - rval
    elseif op == "*" then
        result = lval * rval
    elseif op == "/" then
        result = rval ~= 0 and lval / rval or 0
    elseif op == "%" then
        result = rval ~= 0 and lval % rval or 0
    end

    return {value = result, unit = left.unit or "px"}
end

-- Generate CSS Variable Manifest
function M.generate_manifest(ast, context)
    local manifest = {
        variables = {},
        defaults = {},
        ranges = {}
    }

    -- Collect all CSS variables used
    M.collect_variables(ast, manifest.variables)

    -- Add defaults and ranges
    for var_name, _ in pairs(manifest.variables) do
        manifest.defaults[var_name] = M.defaults[var_name]
        manifest.ranges[var_name] = M.ranges[var_name]
    end

    return manifest
end

-- Collect CSS variables from AST
function M.collect_variables(node, vars)
    if type(node) ~= "table" then
        return
    end

    if node.type == "CSSVar" then
        vars[node.name] = true
    end

    for k, v in pairs(node) do
        if k ~= "type" then
            if type(v) == "table" then
                if v.type then
                    M.collect_variables(v, vars)
                else
                    for _, item in ipairs(v) do
                        M.collect_variables(item, vars)
                    end
                end
            end
        end
    end
end

-- Print semantic analysis results
function M.print_results(context)
    print("=== Semantic Analysis Results ===")
    print("\nVariables:")
    for var, _ in pairs(context.variables) do
        print("  " .. var)
    end

    if #context.errors > 0 then
        print("\nErrors:")
        for _, err in ipairs(context.errors) do
            print("  [" .. err.type .. "] " .. err.message)
        end
    end

    if #context.warnings > 0 then
        print("\nWarnings:")
        for _, warn in ipairs(context.warnings) do
            print("  [" .. warn.type .. "] " .. warn.message)
        end
    end

    if #context.errors == 0 and #context.warnings == 0 then
        print("\n✓ No errors or warnings")
    end
end

return M
