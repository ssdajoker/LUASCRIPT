
-- AGSS Performance Metrics
-- FPS, latency, SSIM, and quality measurement

local M = {}

-- Measure FPS over duration
function M.measure_fps(render_fn, duration)
    duration = duration or 1.0
    
    local start_time = os.clock()
    local frames = 0
    
    while os.clock() - start_time < duration do
        render_fn()
        frames = frames + 1
    end
    
    local elapsed = os.clock() - start_time
    local fps = frames / elapsed
    
    return {
        fps = fps,
        frames = frames,
        elapsed = elapsed,
        avg_frame_time = (elapsed / frames) * 1000  -- ms
    }
end

-- Measure latency (single frame)
function M.measure_latency(render_fn, num_samples)
    num_samples = num_samples or 10
    
    local latencies = {}
    
    for i = 1, num_samples do
        local start = os.clock()
        render_fn()
        local elapsed = (os.clock() - start) * 1000  -- ms
        table.insert(latencies, elapsed)
    end
    
    -- Sort for percentiles
    table.sort(latencies)
    
    local sum = 0
    for _, lat in ipairs(latencies) do
        sum = sum + lat
    end
    
    return {
        mean = sum / #latencies,
        min = latencies[1],
        max = latencies[#latencies],
        p50 = latencies[math.floor(#latencies * 0.5)],
        p95 = latencies[math.floor(#latencies * 0.95)],
        p99 = latencies[math.floor(#latencies * 0.99)]
    }
end

-- Compute SSIM (Structural Similarity Index)
function M.compute_ssim(img1, img2, w, h)
    local C1 = (0.01 * 255) ^ 2
    local C2 = (0.03 * 255) ^ 2
    
    -- Compute means
    local mu1, mu2 = 0, 0
    for i = 0, w * h - 1 do
        local offset = i * 4
        mu1 = mu1 + img1[offset]
        mu2 = mu2 + img2[offset]
    end
    mu1 = mu1 / (w * h)
    mu2 = mu2 / (w * h)
    
    -- Compute variances and covariance
    local var1, var2, covar = 0, 0, 0
    for i = 0, w * h - 1 do
        local offset = i * 4
        local diff1 = img1[offset] - mu1
        local diff2 = img2[offset] - mu2
        
        var1 = var1 + diff1 * diff1
        var2 = var2 + diff2 * diff2
        covar = covar + diff1 * diff2
    end
    var1 = var1 / (w * h)
    var2 = var2 / (w * h)
    covar = covar / (w * h)
    
    -- Compute SSIM
    local numerator = (2 * mu1 * mu2 + C1) * (2 * covar + C2)
    local denominator = (mu1 * mu1 + mu2 * mu2 + C1) * (var1 + var2 + C2)
    
    return numerator / denominator
end

-- Compute color difference (ΔE)
function M.compute_delta_e(img1, img2, w, h)
    local sum_delta = 0
    
    for i = 0, w * h - 1 do
        local offset = i * 4
        
        local r1, g1, b1 = img1[offset], img1[offset + 1], img1[offset + 2]
        local r2, g2, b2 = img2[offset], img2[offset + 1], img2[offset + 2]
        
        -- Simple Euclidean distance in RGB space
        local dr = r1 - r2
        local dg = g1 - g2
        local db = b1 - b2
        
        sum_delta = sum_delta + math.sqrt(dr * dr + dg * dg + db * db)
    end
    
    return sum_delta / (w * h)
end

-- Compute checksum for reproducibility
function M.compute_checksum(params)
    local str = ""
    
    -- Sort keys for deterministic order
    local keys = {}
    for k in pairs(params) do
        table.insert(keys, k)
    end
    table.sort(keys)
    
    for _, k in ipairs(keys) do
        str = str .. k .. "=" .. tostring(params[k]) .. ";"
    end
    
    -- Simple hash (FNV-1a)
    local hash = 2166136261
    for i = 1, #str do
        hash = bit32.bxor(hash, string.byte(str, i))
        hash = (hash * 16777619) % 4294967296
    end
    
    return string.format("%08x", hash)
end

-- Measure memory usage
function M.measure_memory()
    collectgarbage("collect")
    return collectgarbage("count")  -- KB
end

-- Comprehensive performance measurement
function M.measure_all(render_fn, baseline_img, w, h)
    local start_mem = M.measure_memory()
    
    -- Measure FPS
    local fps_result = M.measure_fps(render_fn, 1.0)
    
    -- Measure latency
    local latency_result = M.measure_latency(render_fn, 10)
    
    -- Render final frame for quality metrics
    local final_img = {}
    render_fn(final_img)
    
    -- Compute quality metrics
    local ssim = baseline_img and M.compute_ssim(final_img, baseline_img, w, h) or 1.0
    local delta_e = baseline_img and M.compute_delta_e(final_img, baseline_img, w, h) or 0.0
    
    local end_mem = M.measure_memory()
    
    return {
        fps = fps_result.fps,
        latency_mean = latency_result.mean,
        latency_p95 = latency_result.p95,
        ssim = ssim,
        delta_e = delta_e,
        memory_kb = end_mem - start_mem
    }
end

return M
