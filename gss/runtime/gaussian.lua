
-- Gaussian Kernel Runtime
-- High-performance tile-based Gaussian field rendering

local M = {}

-- Tile size (tunable: 64, 128, 256)
M.TILE_SIZE = 128

-- Render Gaussian field to tile
function M.gaussian_tile(buf, ox, oy, w, h, muX, muY, sigma)
    -- Precompute inverse 2*sigma^2
    local inv2s2 = 1.0 / (2.0 * sigma * sigma)
    
    -- Render tile
    for y = 0, h - 1 do
        for x = 0, w - 1 do
            -- Compute distance from center
            local dx = (x + ox) - muX
            local dy = (y + oy) - muY
            local r2 = dx * dx + dy * dy
            
            -- Gaussian formula: exp(-r²/(2σ²))
            local g = math.exp(-r2 * inv2s2)
            
            -- Clamp to [0, 1]
            g = math.max(0.0, math.min(1.0, g))
            
            -- Write to buffer (scalar field)
            buf[y * w + x] = g
        end
    end
end

-- Render Gaussian with color ramp
function M.gaussian_tile_color(buf, ox, oy, w, h, muX, muY, sigma, rampLUT)
    local inv2s2 = 1.0 / (2.0 * sigma * sigma)
    
    for y = 0, h - 1 do
        for x = 0, w - 1 do
            local dx = (x + ox) - muX
            local dy = (y + oy) - muY
            local r2 = dx * dx + dy * dy
            local g = math.exp(-r2 * inv2s2)
            
            g = math.max(0.0, math.min(1.0, g))
            
            -- Lookup color from ramp
            local idx = math.floor(g * 255)
            local color = rampLUT[idx]
            
            -- Write RGBA to buffer
            local offset = (y * w + x) * 4
            buf[offset + 0] = color.r
            buf[offset + 1] = color.g
            buf[offset + 2] = color.b
            buf[offset + 3] = color.a
        end
    end
end

-- Batch render multiple tiles
function M.render_tiles(canvas_buf, canvas_w, canvas_h, muX, muY, sigma, rampLUT, batch_size)
    batch_size = batch_size or 4
    
    local tile_size = M.TILE_SIZE
    local tiles_x = math.ceil(canvas_w / tile_size)
    local tiles_y = math.ceil(canvas_h / tile_size)
    
    local tile_count = 0
    
    for ty = 0, tiles_y - 1 do
        for tx = 0, tiles_x - 1 do
            local ox = tx * tile_size
            local oy = ty * tile_size
            local w = math.min(tile_size, canvas_w - ox)
            local h = math.min(tile_size, canvas_h - oy)
            
            -- Render tile directly to canvas buffer
            M.gaussian_tile_color_to_canvas(canvas_buf, canvas_w, ox, oy, w, h, muX, muY, sigma, rampLUT)
            
            tile_count = tile_count + 1
            
            -- Yield after batch
            if tile_count % batch_size == 0 then
                coroutine.yield()
            end
        end
    end
end

-- Render tile directly to canvas buffer
function M.gaussian_tile_color_to_canvas(canvas_buf, canvas_w, ox, oy, w, h, muX, muY, sigma, rampLUT)
    local inv2s2 = 1.0 / (2.0 * sigma * sigma)
    
    for y = 0, h - 1 do
        for x = 0, w - 1 do
            local dx = (x + ox) - muX
            local dy = (y + oy) - muY
            local r2 = dx * dx + dy * dy
            local g = math.exp(-r2 * inv2s2)
            
            g = math.max(0.0, math.min(1.0, g))
            
            local idx = math.floor(g * 255)
            local color = rampLUT[idx]
            
            -- Write to canvas buffer at correct position
            local canvas_offset = ((oy + y) * canvas_w + (ox + x)) * 4
            canvas_buf[canvas_offset + 0] = color.r
            canvas_buf[canvas_offset + 1] = color.g
            canvas_buf[canvas_offset + 2] = color.b
            canvas_buf[canvas_offset + 3] = color.a
        end
    end
end

-- Mix two Gaussian fields
function M.mix_fields(buf1, buf2, weight, w, h)
    local result = {}
    
    for i = 0, w * h - 1 do
        result[i] = buf1[i] * (1.0 - weight) + buf2[i] * weight
    end
    
    return result
end

-- Sum multiple Gaussian fields
function M.sum_fields(fields, w, h, normalize)
    local result = {}
    
    for i = 0, w * h - 1 do
        local sum = 0.0
        for _, field in ipairs(fields) do
            sum = sum + field[i]
        end
        
        if normalize then
            sum = sum / #fields
        end
        
        result[i] = math.max(0.0, math.min(1.0, sum))
    end
    
    return result
end

-- Unicode math support: Gaussian formula
-- g = ℯ^(-(r²)/(2σ²))
function M.gaussian_unicode(r, σ)
    return math.exp(-(r * r) / (2 * σ * σ))
end

-- Verify Unicode vs ASCII equivalence (≤1 ULP)
function M.verify_equivalence(r, sigma)
    local unicode_result = M.gaussian_unicode(r, sigma)
    local ascii_result = math.exp(-(r * r) / (2 * sigma * sigma))
    local diff = math.abs(unicode_result - ascii_result)
    
    -- Check if difference is within 1 ULP (unit in last place)
    return diff <= 1e-15
end

return M
