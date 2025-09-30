
-- Iso Contour Runtime
-- Marching squares algorithm for contour extraction

local M = {}

-- Marching squares lookup table (16 cases)
M.EDGE_TABLE = {
    [0] = {},  -- 0000: no edges
    [1] = {{0, 3}},  -- 0001: bottom-left
    [2] = {{0, 1}},  -- 0010: bottom-right
    [3] = {{1, 3}},  -- 0011: bottom edge
    [4] = {{1, 2}},  -- 0100: top-right
    [5] = {{0, 1}, {2, 3}},  -- 0101: saddle (ambiguous)
    [6] = {{0, 2}},  -- 0110: right edge
    [7] = {{2, 3}},  -- 0111: top-left corner out
    [8] = {{2, 3}},  -- 1000: top-left
    [9] = {{0, 2}},  -- 1001: left edge
    [10] = {{1, 2}, {0, 3}},  -- 1010: saddle (ambiguous)
    [11] = {{1, 2}},  -- 1011: top-right corner out
    [12] = {{1, 3}},  -- 1100: top edge
    [13] = {{0, 1}},  -- 1101: bottom-right corner out
    [14] = {{0, 3}},  -- 1110: bottom-left corner out
    [15] = {}   -- 1111: all inside, no edges
}

-- Edge positions (0=bottom, 1=right, 2=top, 3=left)
M.EDGE_COORDS = {
    [0] = {0.5, 1.0},  -- bottom
    [1] = {1.0, 0.5},  -- right
    [2] = {0.5, 0.0},  -- top
    [3] = {0.0, 0.5}   -- left
}

-- Extract iso contours using marching squares
function M.marching_squares(field, w, h, threshold)
    local contours = {}
    
    for y = 0, h - 2 do
        for x = 0, w - 2 do
            -- Sample 2x2 cell
            local v00 = field[y * w + x]
            local v10 = field[y * w + x + 1]
            local v01 = field[(y + 1) * w + x]
            local v11 = field[(y + 1) * w + x + 1]
            
            -- Build case mask (binary: v11 v01 v10 v00)
            local mask = 0
            if v00 >= threshold then mask = mask + 1 end
            if v10 >= threshold then mask = mask + 2 end
            if v01 >= threshold then mask = mask + 4 end
            if v11 >= threshold then mask = mask + 8 end
            
            -- Lookup edges for this case
            local edges = M.EDGE_TABLE[mask]
            
            for _, edge_pair in ipairs(edges) do
                local e1 = edge_pair[1]
                local e2 = edge_pair[2]
                
                -- Interpolate edge positions
                local p1 = M.interpolate_edge(e1, x, y, v00, v10, v01, v11, threshold)
                local p2 = M.interpolate_edge(e2, x, y, v00, v10, v01, v11, threshold)
                
                table.insert(contours, {p1, p2})
            end
        end
    end
    
    return contours
end

-- Interpolate edge position
function M.interpolate_edge(edge, x, y, v00, v10, v01, v11, threshold)
    local coords = M.EDGE_COORDS[edge]
    local base_x = x + coords[1]
    local base_y = y + coords[2]
    
    -- Linear interpolation along edge
    local t = 0.5  -- default to midpoint
    
    if edge == 0 then  -- bottom edge
        if math.abs(v10 - v00) > 1e-6 then
            t = (threshold - v00) / (v10 - v00)
        end
        return {x + t, y + 1}
    elseif edge == 1 then  -- right edge
        if math.abs(v11 - v10) > 1e-6 then
            t = (threshold - v10) / (v11 - v10)
        end
        return {x + 1, y + t}
    elseif edge == 2 then  -- top edge
        if math.abs(v11 - v01) > 1e-6 then
            t = (threshold - v01) / (v11 - v01)
        end
        return {x + t, y}
    elseif edge == 3 then  -- left edge
        if math.abs(v01 - v00) > 1e-6 then
            t = (threshold - v00) / (v01 - v00)
        end
        return {x, y + t}
    end
    
    return {base_x, base_y}
end

-- Render contours to RGBA buffer
function M.render_contours(contours, buf, w, h, color, line_width)
    color = color or {r = 255, g = 255, b = 255, a = 255}
    line_width = line_width or 1
    
    for _, contour in ipairs(contours) do
        local p1 = contour[1]
        local p2 = contour[2]
        
        M.draw_line(buf, w, h, p1[1], p1[2], p2[1], p2[2], color, line_width)
    end
end

-- Draw line using Bresenham's algorithm
function M.draw_line(buf, w, h, x1, y1, x2, y2, color, width)
    x1 = math.floor(x1)
    y1 = math.floor(y1)
    x2 = math.floor(x2)
    y2 = math.floor(y2)
    
    local dx = math.abs(x2 - x1)
    local dy = math.abs(y2 - y1)
    local sx = x1 < x2 and 1 or -1
    local sy = y1 < y2 and 1 or -1
    local err = dx - dy
    
    while true do
        -- Draw pixel with width
        for wy = -width, width do
            for wx = -width, width do
                local px = x1 + wx
                local py = y1 + wy
                
                if px >= 0 and px < w and py >= 0 and py < h then
                    local offset = (py * w + px) * 4
                    buf[offset + 0] = color.r
                    buf[offset + 1] = color.g
                    buf[offset + 2] = color.b
                    buf[offset + 3] = color.a
                end
            end
        end
        
        if x1 == x2 and y1 == y2 then break end
        
        local e2 = 2 * err
        if e2 > -dy then
            err = err - dy
            x1 = x1 + sx
        end
        if e2 < dx then
            err = err + dx
            y1 = y1 + sy
        end
    end
end

-- Downsample field for faster marching squares
function M.downsample_field(field, w, h, factor)
    factor = factor or 2
    local new_w = math.ceil(w / factor)
    local new_h = math.ceil(h / factor)
    local downsampled = {}
    
    for y = 0, new_h - 1 do
        for x = 0, new_w - 1 do
            local sum = 0
            local count = 0
            
            for dy = 0, factor - 1 do
                for dx = 0, factor - 1 do
                    local sx = x * factor + dx
                    local sy = y * factor + dy
                    
                    if sx < w and sy < h then
                        sum = sum + field[sy * w + sx]
                        count = count + 1
                    end
                end
            end
            
            downsampled[y * new_w + x] = count > 0 and sum / count or 0
        end
    end
    
    return downsampled, new_w, new_h
end

return M
