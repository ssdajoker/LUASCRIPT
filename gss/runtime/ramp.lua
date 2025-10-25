
-- Ramp LUT Runtime
-- Color ramp lookup and interpolation

local M = {}

-- Apply ramp LUT to scalar field
function M.apply_ramp(field, w, h, lut)
    local result = {}

    for i = 0, w * h - 1 do
        local value = field[i]
        value = math.max(0.0, math.min(1.0, value))

        local idx = math.floor(value * 255)
        local color = lut[idx]

        local offset = i * 4
        result[offset + 0] = color.r
        result[offset + 1] = color.g
        result[offset + 2] = color.b
        result[offset + 3] = color.a
    end

    return result
end

-- Bilinear interpolation for smooth ramps
function M.apply_ramp_interpolated(field, w, h, lut)
    local result = {}

    for i = 0, w * h - 1 do
        local value = field[i]
        value = math.max(0.0, math.min(1.0, value))

        -- Interpolate between two LUT entries
        local t = value * 255
        local idx1 = math.floor(t)
        local idx2 = math.min(idx1 + 1, 255)
        local frac = t - idx1

        local c1 = lut[idx1]
        local c2 = lut[idx2]

        local offset = i * 4
        result[offset + 0] = math.floor(c1.r + (c2.r - c1.r) * frac)
        result[offset + 1] = math.floor(c1.g + (c2.g - c1.g) * frac)
        result[offset + 2] = math.floor(c1.b + (c2.b - c1.b) * frac)
        result[offset + 3] = 255
    end

    return result
end

-- Create gradient ramp from two colors
function M.gradient_ramp(color1, color2)
    local lut = {}

    for i = 0, 255 do
        local t = i / 255
        lut[i] = {
            r = math.floor(color1.r + (color2.r - color1.r) * t),
            g = math.floor(color1.g + (color2.g - color1.g) * t),
            b = math.floor(color1.b + (color2.b - color1.b) * t),
            a = 255
        }
    end

    return lut
end

-- Create multi-stop gradient ramp
function M.multi_stop_ramp(stops)
    local lut = {}

    -- Sort stops by position
    table.sort(stops, function(a, b) return a.pos < b.pos end)

    for i = 0, 255 do
        local t = i / 255

        -- Find surrounding stops
        local stop1, stop2
        for j = 1, #stops - 1 do
            if t >= stops[j].pos and t <= stops[j + 1].pos then
                stop1 = stops[j]
                stop2 = stops[j + 1]
                break
            end
        end

        if not stop1 then
            stop1 = stops[1]
            stop2 = stops[#stops]
        end

        -- Interpolate
        local range = stop2.pos - stop1.pos
        local frac = range > 0 and (t - stop1.pos) / range or 0

        lut[i] = {
            r = math.floor(stop1.color.r + (stop2.color.r - stop1.color.r) * frac),
            g = math.floor(stop1.color.g + (stop2.color.g - stop1.color.g) * frac),
            b = math.floor(stop1.color.b + (stop2.color.b - stop1.color.b) * frac),
            a = 255
        }
    end

    return lut
end

return M
