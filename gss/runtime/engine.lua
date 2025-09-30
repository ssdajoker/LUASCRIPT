
-- GSS Rendering Engine
-- Main execution engine for GSS kernel graphs

local graph = require("gss.ir.graph")
local nodes = require("gss.ir.nodes")
local gaussian = require("gss.runtime.gaussian")
local ramp = require("gss.runtime.ramp")
local iso = require("gss.runtime.iso")
local blend = require("gss.runtime.blend")
local cache = require("gss.runtime.cache")

local M = {}

-- Create rendering engine
function M.Engine(width, height)
    return {
        width = width,
        height = height,
        tile_cache = cache.Cache(100),
        field_cache = cache.Cache(50),
        params = {},
        stats = {
            frames = 0,
            render_time = 0,
            cache_hits = 0,
            cache_misses = 0
        }
    }
end

-- Set parameter value
function M.set_param(engine, name, value)
    engine.params[name] = value
end

-- Get parameter value
function M.get_param(engine, name, default)
    return engine.params[name] or default
end

-- Execute kernel graph
function M.execute(engine, g)
    local start_time = os.clock()
    
    -- Get sorted nodes
    local sorted = graph.sort(g)
    
    -- Evaluate each node
    local results = {}
    
    for _, node in ipairs(sorted) do
        results[node.id] = M.eval_node(engine, node, results)
    end
    
    -- Get root result
    local output = g.root and results[g.root.id] or nil
    
    -- Update stats
    engine.stats.frames = engine.stats.frames + 1
    engine.stats.render_time = engine.stats.render_time + (os.clock() - start_time)
    
    return output
end

-- Evaluate single node
function M.eval_node(engine, node, results)
    if node.type == "constant" then
        return node.value
        
    elseif node.type == "param" then
        return M.get_param(engine, node.name, node.value)
        
    elseif node.type == "binary_op" then
        local left = results[node.left.id]
        local right = results[node.right.id]
        return M.eval_binary_op(node.op, left, right)
        
    elseif node.type == "gaussian" then
        return M.eval_gaussian(engine, node, results)
        
    elseif node.type == "mix" then
        return M.eval_mix(engine, node, results)
        
    elseif node.type == "sum" then
        return M.eval_sum(engine, node, results)
        
    elseif node.type == "ramp" then
        return M.eval_ramp(engine, node, results)
        
    elseif node.type == "iso" then
        return M.eval_iso(engine, node, results)
        
    elseif node.type == "composite" then
        return M.eval_composite(engine, node, results)
    end
    
    return nil
end

-- Evaluate binary operation
function M.eval_binary_op(op, left, right)
    if op == "+" then
        return left + right
    elseif op == "-" then
        return left - right
    elseif op == "*" then
        return left * right
    elseif op == "/" then
        return right ~= 0 and left / right or 0
    elseif op == "%" then
        return right ~= 0 and left % right or 0
    end
    return 0
end

-- Evaluate Gaussian node
function M.eval_gaussian(engine, node, results)
    local muX = results[node.muX.id]
    local muY = results[node.muY.id]
    local sigma = results[node.sigma.id]
    
    -- Check cache
    local key = cache.cache_key(muX, muY, sigma, {w = engine.width, h = engine.height})
    local cached = cache.get(engine.field_cache, key)
    
    if cached then
        engine.stats.cache_hits = engine.stats.cache_hits + 1
        return cached
    end
    
    engine.stats.cache_misses = engine.stats.cache_misses + 1
    
    -- Render Gaussian field
    local field = {}
    gaussian.gaussian_tile(field, 0, 0, engine.width, engine.height, muX, muY, sigma)
    
    -- Cache result
    cache.put(engine.field_cache, key, field)
    
    return field
end

-- Evaluate Mix node
function M.eval_mix(engine, node, results)
    local field1 = results[node.input1.id]
    local field2 = results[node.input2.id]
    local weight = results[node.weight.id]
    
    return gaussian.mix_fields(field1, field2, weight, engine.width, engine.height)
end

-- Evaluate Sum node
function M.eval_sum(engine, node, results)
    local fields = {}
    for _, input in ipairs(node.inputs) do
        table.insert(fields, results[input.id])
    end
    
    return gaussian.sum_fields(fields, engine.width, engine.height, node.normalize)
end

-- Evaluate Ramp node
function M.eval_ramp(engine, node, results)
    local field = results[node.input.id]
    return ramp.apply_ramp_interpolated(field, engine.width, engine.height, node.lut)
end

-- Evaluate Iso node
function M.eval_iso(engine, node, results)
    local field = results[node.input.id]
    local threshold = results[node.threshold.id]
    local width = results[node.width.id]
    
    -- Downsample for performance
    local downsampled, ds_w, ds_h = iso.downsample_field(field, engine.width, engine.height, 2)
    
    -- Extract contours
    local contours = iso.marching_squares(downsampled, ds_w, ds_h, threshold)
    
    -- Render to buffer
    local buf = {}
    for i = 0, engine.width * engine.height * 4 - 1 do
        buf[i] = 0
    end
    
    iso.render_contours(contours, buf, engine.width, engine.height, 
        {r = 255, g = 255, b = 255, a = 255}, width)
    
    return buf
end

-- Evaluate Composite node
function M.eval_composite(engine, node, results)
    local layers = {}
    for _, layer in ipairs(node.layers) do
        table.insert(layers, results[layer.id])
    end
    
    return blend.composite_layers(layers, engine.width, engine.height, {node.blend_mode})
end

-- Render to canvas buffer
function M.render(engine, g, canvas_buf)
    local result = M.execute(engine, g)
    
    if result then
        -- Copy to canvas buffer
        for i = 0, engine.width * engine.height * 4 - 1 do
            canvas_buf[i] = result[i] or 0
        end
    end
    
    return result ~= nil
end

-- Get performance stats
function M.get_stats(engine)
    local avg_render_time = engine.stats.frames > 0 
        and (engine.stats.render_time / engine.stats.frames) * 1000 
        or 0
    
    local fps = avg_render_time > 0 and 1000 / avg_render_time or 0
    
    local cache_hit_rate = (engine.stats.cache_hits + engine.stats.cache_misses) > 0
        and engine.stats.cache_hits / (engine.stats.cache_hits + engine.stats.cache_misses)
        or 0
    
    return {
        frames = engine.stats.frames,
        avg_render_time_ms = avg_render_time,
        fps = fps,
        cache_hit_rate = cache_hit_rate,
        cache_hits = engine.stats.cache_hits,
        cache_misses = engine.stats.cache_misses
    }
end

-- Reset stats
function M.reset_stats(engine)
    engine.stats = {
        frames = 0,
        render_time = 0,
        cache_hits = 0,
        cache_misses = 0
    }
end

return M
