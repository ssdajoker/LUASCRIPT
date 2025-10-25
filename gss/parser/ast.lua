
-- AST Node Definitions for GSS
-- Abstract Syntax Tree representation

local M = {}

-- Base AST node
function M.Node(type, props)
    local node = {type = type}
    for k, v in pairs(props or {}) do
        node[k] = v
    end
    return node
end

-- Stylesheet (root)
function M.Stylesheet(blocks)
    return M.Node("Stylesheet", {blocks = blocks})
end

-- Block
function M.Block(name, statements)
    return M.Node("Block", {name = name, statements = statements})
end

-- Field Statement
function M.FieldStmt(expr)
    return M.Node("FieldStmt", {expr = expr})
end

-- Gaussian Expression
function M.GaussianExpr(muX, muY, sigma)
    return M.Node("GaussianExpr", {
        muX = muX,
        muY = muY,
        sigma = sigma
    })
end

-- Mix Expression
function M.MixExpr(input1, input2, weight)
    return M.Node("MixExpr", {
        input1 = input1,
        input2 = input2,
        weight = weight
    })
end

-- Sum Expression
function M.SumExpr(inputs, normalize)
    return M.Node("SumExpr", {
        inputs = inputs,
        normalize = normalize or false
    })
end

-- Ramp Statement
function M.RampStmt(palette, custom_stops)
    return M.Node("RampStmt", {
        palette = palette,
        custom_stops = custom_stops
    })
end

-- Iso Statement
function M.IsoStmt(threshold, width)
    return M.Node("IsoStmt", {
        threshold = threshold,
        width = width or 1
    })
end

-- Blend Statement
function M.BlendStmt(mode)
    return M.Node("BlendStmt", {mode = mode})
end

-- Bind Statement
function M.BindStmt(vars)
    return M.Node("BindStmt", {vars = vars})
end

-- Animate Statement
function M.AnimateStmt(property, args)
    return M.Node("AnimateStmt", {
        property = property,
        args = args
    })
end

-- Layer Statement
function M.LayerStmt(name, statements)
    return M.Node("LayerStmt", {
        name = name,
        statements = statements
    })
end

-- Size Statement
function M.SizeStmt(width, height)
    return M.Node("SizeStmt", {
        width = width,
        height = height
    })
end

-- CSS Variable Reference
function M.CSSVar(name, fallback)
    return M.Node("CSSVar", {
        name = name,
        fallback = fallback
    })
end

-- Literal Value
function M.Literal(value, unit)
    return M.Node("Literal", {
        value = value,
        unit = unit
    })
end

-- Binary Expression
function M.BinaryExpr(op, left, right)
    return M.Node("BinaryExpr", {
        op = op,
        left = left,
        right = right
    })
end

-- Identifier
function M.Identifier(name)
    return M.Node("Identifier", {name = name})
end

-- AGSS Agent Block
function M.AgentBlock(name, optimize)
    return M.Node("AgentBlock", {
        name = name,
        optimize = optimize
    })
end

-- AGSS Optimize Block
function M.OptimizeBlock(statements)
    return M.Node("OptimizeBlock", {statements = statements})
end

-- AGSS Target Statement
function M.TargetStmt(metric, value)
    return M.Node("TargetStmt", {
        metric = metric,
        value = value
    })
end

-- AGSS Vary Statement
function M.VaryStmt(ranges)
    return M.Node("VaryStmt", {ranges = ranges})
end

-- AGSS Parameter Range
function M.ParamRange(param, min, max, step)
    return M.Node("ParamRange", {
        param = param,
        min = min,
        max = max,
        step = step
    })
end

-- AGSS Budget Statement
function M.BudgetStmt(type, value)
    return M.Node("BudgetStmt", {
        budget_type = type,
        value = value
    })
end

-- AGSS Strategy Statement
function M.StrategyStmt(name)
    return M.Node("StrategyStmt", {name = name})
end

-- AGSS Record Statement
function M.RecordStmt(fields)
    return M.Node("RecordStmt", {fields = fields})
end

-- Utility: Pretty print AST
function M.print_ast(node, indent)
    indent = indent or 0
    local prefix = string.rep("  ", indent)

    if type(node) ~= "table" then
        print(prefix .. tostring(node))
        return
    end

    print(prefix .. (node.type or "Unknown"))

    for k, v in pairs(node) do
        if k ~= "type" then
            io.write(prefix .. "  " .. k .. ": ")
            if type(v) == "table" and not v.type then
                print("[")
                for i, item in ipairs(v) do
                    M.print_ast(item, indent + 2)
                end
                print(prefix .. "  ]")
            elseif type(v) == "table" then
                print()
                M.print_ast(v, indent + 2)
            else
                print(tostring(v))
            end
        end
    end
end

return M
