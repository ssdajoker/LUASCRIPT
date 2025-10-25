
-- Blend Modes Runtime
-- Alpha compositing and blend mode operations

local M = {}

-- Clamp value to [0, 255]
local function clamp(v)
    return math.max(0, math.min(255, v))
end

-- Normal blend (alpha over)
function M.blend_normal(src, dst, alpha)
    alpha = alpha / 255
    return {
        r = clamp(src.r * alpha + dst.r * (1 - alpha)),
        g = clamp(src.g * alpha + dst.g * (1 - alpha)),
        b = clamp(src.b * alpha + dst.b * (1 - alpha)),
        a = clamp(src.a + dst.a * (1 - alpha))
    }
end

-- Multiply blend
function M.blend_multiply(src, dst)
    return {
        r = clamp((src.r * dst.r) / 255),
        g = clamp((src.g * dst.g) / 255),
        b = clamp((src.b * dst.b) / 255),
        a = 255
    }
end

-- Screen blend
function M.blend_screen(src, dst)
    return {
        r = clamp(255 - ((255 - src.r) * (255 - dst.r)) / 255),
        g = clamp(255 - ((255 - src.g) * (255 - dst.g)) / 255),
        b = clamp(255 - ((255 - src.b) * (255 - dst.b)) / 255),
        a = 255
    }
end

-- Overlay blend
function M.blend_overlay(src, dst)
    local function overlay_channel(s, d)
        if d < 128 then
            return (2 * s * d) / 255
        else
            return 255 - (2 * (255 - s) * (255 - d)) / 255
        end
    end

    return {
        r = clamp(overlay_channel(src.r, dst.r)),
        g = clamp(overlay_channel(src.g, dst.g)),
        b = clamp(overlay_channel(src.b, dst.b)),
        a = 255
    }
end

-- Soft light blend
function M.blend_softlight(src, dst)
    local function softlight_channel(s, d)
        s = s / 255
        d = d / 255

        if s < 0.5 then
            return 255 * (d - (1 - 2 * s) * d * (1 - d))
        else
            local g = d < 0.25 and ((16 * d - 12) * d + 4) * d or math.sqrt(d)
            return 255 * (d + (2 * s - 1) * (g - d))
        end
    end

    return {
        r = clamp(softlight_channel(src.r, dst.r)),
        g = clamp(softlight_channel(src.g, dst.g)),
        b = clamp(softlight_channel(src.b, dst.b)),
        a = 255
    }
end

-- Composite two RGBA buffers
function M.composite_buffers(src_buf, dst_buf, w, h, blend_mode)
    blend_mode = blend_mode or "normal"
    local result = {}

    local blend_fn = M["blend_" .. blend_mode] or M.blend_normal

    for i = 0, w * h - 1 do
        local offset = i * 4

        local src = {
            r = src_buf[offset + 0],
            g = src_buf[offset + 1],
            b = src_buf[offset + 2],
            a = src_buf[offset + 3]
        }

        local dst = {
            r = dst_buf[offset + 0] or 0,
            g = dst_buf[offset + 1] or 0,
            b = dst_buf[offset + 2] or 0,
            a = dst_buf[offset + 3] or 0
        }

        local blended = blend_fn(src, dst, src.a)

        result[offset + 0] = blended.r
        result[offset + 1] = blended.g
        result[offset + 2] = blended.b
        result[offset + 3] = blended.a
    end

    return result
end

-- Composite multiple layers
function M.composite_layers(layers, w, h, blend_modes)
    if #layers == 0 then
        return {}
    end

    local result = layers[1]

    for i = 2, #layers do
        local blend_mode = blend_modes and blend_modes[i] or "normal"
        result = M.composite_buffers(layers[i], result, w, h, blend_mode)
    end

    return result
end

return M
