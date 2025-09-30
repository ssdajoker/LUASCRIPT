
-- Lowering Pipeline
-- Convert AST to Kernel Graph IR

local graph = require("gss.ir.graph")
local nodes = require("gss.ir.nodes")
local semantic = require("gss.parser.semantic")

local M = {}

-- Lower AST to kernel graph
function M.lower(ast, context)
    context = context or semantic.Context()
    
    local g = graph.Graph()
    
    if ast.type == "Stylesheet" then
        for _, block in ipairs(ast.blocks) do
            M.lower_block(block, g, context)
        end
    end
    
    return g
end

-- Lower block
function M.lower_block(block, g, context)
    local field_node = nil
    local ramp_node = nil
    local iso_node = nil
    local blend_mode = "normal"
    
    for _, stmt in ipairs(block.statements) do
        if stmt.type == "FieldStmt" then
            field_node = M.lower_field_expr(stmt.expr, g, context)
        elseif stmt.type == "RampStmt" then
            if field_node then
                ramp_node = M.lower_ramp_stmt(stmt, field_node, g, context)
            end
        elseif stmt.type == "IsoStmt" then
            if field_node then
                iso_node = M.lower_iso_stmt(stmt, field_node, g, context)
            end
        elseif stmt.type == "BlendStmt" then
            blend_mode = stmt.mode
        elseif stmt.type == "LayerStmt" then
            M.lower_block(stmt, g, context)
        end
    end
    
    -- Create composite node as root
    local layers = {}
    if ramp_node then
        table.insert(layers, ramp_node)
    end
    if iso_node then
        table.insert(layers, iso_node)
    end
    
    if #layers > 0 then
        local composite = nodes.CompositeNode(layers, blend_mode)
        graph.add_node(g, composite)
        graph.set_root(g, composite)
    elseif field_node then
        graph.set_root(g, field_node)
    end
end

-- Lower field expression
function M.lower_field_expr(expr, g, context)
    if expr.type == "GaussianExpr" then
        local muX = M.lower_value(expr.muX, g, context)
        local muY = M.lower_value(expr.muY, g, context)
        local sigma = M.lower_value(expr.sigma, g, context)
        
        local node = nodes.GaussianNode(muX, muY, sigma)
        graph.add_node(g, node)
        return node
        
    elseif expr.type == "MixExpr" then
        local input1 = M.lower_field_expr(expr.input1, g, context)
        local input2 = M.lower_field_expr(expr.input2, g, context)
        local weight = M.lower_value(expr.weight, g, context)
        
        local node = nodes.MixNode(input1, input2, weight)
        graph.add_node(g, node)
        return node
        
    elseif expr.type == "SumExpr" then
        local inputs = {}
        for _, input_expr in ipairs(expr.inputs) do
            table.insert(inputs, M.lower_field_expr(input_expr, g, context))
        end
        
        local node = nodes.SumNode(inputs, expr.normalize)
        graph.add_node(g, node)
        return node
    end
    
    return nil
end

-- Lower ramp statement
function M.lower_ramp_stmt(stmt, field_node, g, context)
    local lut = M.generate_ramp_lut(stmt.palette, stmt.custom_stops)
    local node = nodes.RampNode(field_node, stmt.palette, lut)
    graph.add_node(g, node)
    return node
end

-- Lower iso statement
function M.lower_iso_stmt(stmt, field_node, g, context)
    local threshold = M.lower_value(stmt.threshold, g, context)
    local width = M.lower_value(stmt.width, g, context)
    
    local node = nodes.IsoNode(field_node, threshold, width)
    graph.add_node(g, node)
    return node
end

-- Lower value (literal, CSS var, expression)
function M.lower_value(value, g, context)
    if value.type == "Literal" then
        return nodes.ConstantNode(value.value)
        
    elseif value.type == "CSSVar" then
        local param_name = value.name
        local param = graph.get_param(g, param_name)
        
        if not param then
            local default = semantic.defaults[param_name] or {value = 0, unit = "px"}
            local range = semantic.ranges[param_name]
            param = graph.add_param(g, param_name, default.value, range)
        end
        
        return param
        
    elseif value.type == "BinaryExpr" then
        local left = M.lower_value(value.left, g, context)
        local right = M.lower_value(value.right, g, context)
        
        local node = nodes.BinaryOpNode(value.op, left, right)
        graph.add_node(g, node)
        return node
        
    elseif value.type == "Identifier" then
        -- Try to resolve as parameter
        local param = graph.get_param(g, "--" .. value.name)
        if param then
            return param
        end
        return nodes.ConstantNode(0)
    end
    
    return nodes.ConstantNode(0)
end

-- Generate ramp LUT (256 entries)
function M.generate_ramp_lut(palette, custom_stops)
    if palette == "viridis" then
        return M.viridis_lut()
    elseif palette == "plasma" then
        return M.plasma_lut()
    elseif palette == "magma" then
        return M.magma_lut()
    elseif palette == "inferno" then
        return M.inferno_lut()
    elseif palette == "custom" and custom_stops then
        return M.custom_lut(custom_stops)
    else
        return M.grayscale_lut()
    end
end

-- Grayscale LUT
function M.grayscale_lut()
    local lut = {}
    for i = 0, 255 do
        lut[i] = {r = i, g = i, b = i, a = 255}
    end
    return lut
end

-- Viridis color palette
function M.viridis_lut()
    local lut = {}
    local colors = {
        {0.267004, 0.004874, 0.329415},
        {0.282623, 0.140926, 0.457517},
        {0.253935, 0.265254, 0.529983},
        {0.206756, 0.371758, 0.553117},
        {0.163625, 0.471133, 0.558148},
        {0.127568, 0.566949, 0.550556},
        {0.134692, 0.658636, 0.517649},
        {0.266941, 0.748751, 0.440573},
        {0.477504, 0.821444, 0.318195},
        {0.741388, 0.873449, 0.149561},
        {0.993248, 0.906157, 0.143936}
    }
    
    for i = 0, 255 do
        local t = i / 255
        local idx = math.floor(t * (#colors - 1)) + 1
        local frac = (t * (#colors - 1)) - (idx - 1)
        
        local c1 = colors[math.min(idx, #colors)]
        local c2 = colors[math.min(idx + 1, #colors)]
        
        lut[i] = {
            r = math.floor((c1[1] + (c2[1] - c1[1]) * frac) * 255),
            g = math.floor((c1[2] + (c2[2] - c1[2]) * frac) * 255),
            b = math.floor((c1[3] + (c2[3] - c1[3]) * frac) * 255),
            a = 255
        }
    end
    
    return lut
end

-- Plasma color palette
function M.plasma_lut()
    local lut = {}
    local colors = {
        {0.050383, 0.029803, 0.527975},
        {0.280264, 0.023832, 0.633724},
        {0.417642, 0.004815, 0.658390},
        {0.550287, 0.009561, 0.627720},
        {0.665471, 0.050344, 0.558148},
        {0.762373, 0.120565, 0.469538},
        {0.843848, 0.208030, 0.368433},
        {0.909439, 0.310828, 0.259556},
        {0.959151, 0.431214, 0.150701},
        {0.987622, 0.570197, 0.059556},
        {0.987053, 0.734090, 0.099702}
    }
    
    for i = 0, 255 do
        local t = i / 255
        local idx = math.floor(t * (#colors - 1)) + 1
        local frac = (t * (#colors - 1)) - (idx - 1)
        
        local c1 = colors[math.min(idx, #colors)]
        local c2 = colors[math.min(idx + 1, #colors)]
        
        lut[i] = {
            r = math.floor((c1[1] + (c2[1] - c1[1]) * frac) * 255),
            g = math.floor((c1[2] + (c2[2] - c1[2]) * frac) * 255),
            b = math.floor((c1[3] + (c2[3] - c1[3]) * frac) * 255),
            a = 255
        }
    end
    
    return lut
end

-- Magma color palette
function M.magma_lut()
    local lut = {}
    for i = 0, 255 do
        local t = i / 255
        lut[i] = {
            r = math.floor(255 * (0.001462 + t * (2.982 - 0.001462))),
            g = math.floor(255 * (0.000466 + t * (0.718 - 0.000466))),
            b = math.floor(255 * (0.013866 + t * (0.941 - 0.013866))),
            a = 255
        }
    end
    return lut
end

-- Inferno color palette
function M.inferno_lut()
    local lut = {}
    for i = 0, 255 do
        local t = i / 255
        lut[i] = {
            r = math.floor(255 * (0.001462 + t * (0.988 - 0.001462))),
            g = math.floor(255 * (0.000466 + t * (0.998 - 0.000466))),
            b = math.floor(255 * (0.013866 + t * (0.644 - 0.013866))),
            a = 255
        }
    end
    return lut
end

-- Custom LUT from color stops
function M.custom_lut(stops)
    local lut = {}
    
    -- Sort stops by position
    table.sort(stops, function(a, b)
        return a.position.value < b.position.value
    end)
    
    for i = 0, 255 do
        local t = i / 255
        
        -- Find surrounding stops
        local stop1, stop2
        for j = 1, #stops - 1 do
            if t >= stops[j].position.value / 100 and t <= stops[j + 1].position.value / 100 then
                stop1 = stops[j]
                stop2 = stops[j + 1]
                break
            end
        end
        
        if not stop1 then
            stop1 = stops[1]
            stop2 = stops[1]
        end
        
        -- Interpolate color
        local pos1 = stop1.position.value / 100
        local pos2 = stop2.position.value / 100
        local frac = pos2 > pos1 and (t - pos1) / (pos2 - pos1) or 0
        
        local c1 = M.parse_color(stop1.color)
        local c2 = M.parse_color(stop2.color)
        
        lut[i] = {
            r = math.floor(c1.r + (c2.r - c1.r) * frac),
            g = math.floor(c1.g + (c2.g - c1.g) * frac),
            b = math.floor(c1.b + (c2.b - c1.b) * frac),
            a = 255
        }
    end
    
    return lut
end

-- Parse color string
function M.parse_color(color_str)
    if type(color_str) == "string" then
        if color_str:sub(1, 1) == "#" then
            local hex = color_str:sub(2)
            if #hex == 3 then
                hex = hex:sub(1,1):rep(2) .. hex:sub(2,2):rep(2) .. hex:sub(3,3):rep(2)
            end
            return {
                r = tonumber(hex:sub(1, 2), 16),
                g = tonumber(hex:sub(3, 4), 16),
                b = tonumber(hex:sub(5, 6), 16)
            }
        end
    end
    return {r = 0, g = 0, b = 0}
end

return M
