
-- GSS Parser
-- Converts parse tree to AST

local ast = require("gss.parser.ast")

local M = {}

-- Convert LPEG parse tree to AST
function M.to_ast(parse_tree)
    if not parse_tree then
        return nil, "Empty parse tree"
    end
    
    local blocks = {}
    
    for _, block_data in ipairs(parse_tree) do
        if block_data[1] == "block" then
            local block = M.convert_block(block_data)
            table.insert(blocks, block)
        end
    end
    
    return ast.Stylesheet(blocks)
end

function M.convert_block(data)
    local name = data.name
    local statements = {}
    
    for _, stmt_data in ipairs(data.statements) do
        local stmt = M.convert_statement(stmt_data)
        if stmt then
            table.insert(statements, stmt)
        end
    end
    
    return ast.Block(name, statements)
end

function M.convert_statement(data)
    local stmt_type = data[1]
    
    if stmt_type == "field" then
        return ast.FieldStmt(M.convert_field_expr(data.expr))
    elseif stmt_type == "ramp" then
        return M.convert_ramp_stmt(data)
    elseif stmt_type == "iso" then
        return ast.IsoStmt(
            M.convert_value(data.threshold),
            data.width and M.convert_value(data.width) or 1
        )
    elseif stmt_type == "blend" then
        return ast.BlendStmt(data.mode)
    elseif stmt_type == "bind" then
        return ast.BindStmt(data.vars)
    elseif stmt_type == "animate" then
        return ast.AnimateStmt(data.property, data.args)
    elseif stmt_type == "layer" then
        local statements = {}
        for _, s in ipairs(data.statements) do
            table.insert(statements, M.convert_statement(s))
        end
        return ast.LayerStmt(data.name, statements)
    elseif stmt_type == "size" then
        return ast.SizeStmt(
            M.convert_value(data.width),
            M.convert_value(data.height)
        )
    end
    
    return nil
end

function M.convert_field_expr(data)
    local expr_type = data[1]
    
    if expr_type == "gaussian" then
        local args = data.args
        return ast.GaussianExpr(
            M.convert_value(args[1]),
            M.convert_value(args[2]),
            M.convert_value(args[3])
        )
    elseif expr_type == "mix" then
        return ast.MixExpr(
            M.convert_field_expr(data.input1),
            M.convert_field_expr(data.input2),
            M.convert_value(data.weight)
        )
    elseif expr_type == "sum" then
        local inputs = {}
        for _, input in ipairs(data.inputs) do
            table.insert(inputs, M.convert_field_expr(input))
        end
        return ast.SumExpr(inputs)
    end
    
    return nil
end

function M.convert_ramp_stmt(data)
    if type(data.palette) == "table" and data.palette[1] == "custom" then
        return ast.RampStmt("custom", data.palette.stops)
    else
        return ast.RampStmt(data.palette)
    end
end

function M.convert_value(data)
    if type(data) == "string" then
        -- Check if it's a number
        local num = tonumber(data)
        if num then
            return ast.Literal(num, "px")
        end
        return ast.Identifier(data)
    elseif type(data) == "table" then
        if data.value and data.unit then
            return ast.Literal(tonumber(data.value), data.unit)
        elseif data.op then
            -- Binary expression
            return ast.BinaryExpr(
                data.op,
                M.convert_value(data.left or data[1]),
                M.convert_value(data.right or data[2])
            )
        end
    elseif type(data) == "number" then
        return ast.Literal(data, "px")
    end
    
    return ast.Literal(0, "px")
end

-- AGSS parser
function M.to_agss_ast(parse_tree)
    if not parse_tree or parse_tree[1] ~= "agent" then
        return nil, "Invalid agent block"
    end
    
    local name = parse_tree.name
    local optimize = M.convert_optimize_block(parse_tree.optimize)
    
    return ast.AgentBlock(name, optimize)
end

function M.convert_optimize_block(data)
    local statements = {}
    
    for _, stmt_data in ipairs(data.statements) do
        local stmt = M.convert_agent_statement(stmt_data)
        if stmt then
            table.insert(statements, stmt)
        end
    end
    
    return ast.OptimizeBlock(statements)
end

function M.convert_agent_statement(data)
    local stmt_type = data[1]
    
    if stmt_type == "target" then
        return ast.TargetStmt(data.metric, tonumber(data.value))
    elseif stmt_type == "vary" then
        local ranges = {}
        for _, range_data in ipairs(data.ranges) do
            table.insert(ranges, ast.ParamRange(
                range_data.param,
                tonumber(range_data.min),
                tonumber(range_data.max),
                range_data.step and tonumber(range_data.step) or nil
            ))
        end
        return ast.VaryStmt(ranges)
    elseif stmt_type == "budget" then
        local budget_data = data[2]
        return ast.BudgetStmt(budget_data[1], budget_data.count or budget_data.duration)
    elseif stmt_type == "strategy" then
        return ast.StrategyStmt(data.name)
    elseif stmt_type == "record" then
        return ast.RecordStmt(data.fields)
    end
    
    return nil
end

return M
