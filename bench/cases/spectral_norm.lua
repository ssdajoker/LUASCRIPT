
--[[
Spectral Norm Benchmark
Contributor: Simon Peyton-Jones - Mathematical computation and linear algebra

This benchmark computes the spectral norm of a matrix using
the power method, testing floating-point arithmetic intensity.
]]

local function A(i, j)
    return 1.0 / ((i + j - 2) * (i + j - 1) / 2 + i)
end

local function Av(x, y, n)
    for i = 1, n do
        local sum = 0
        for j = 1, n do
            sum = sum + A(i, j) * x[j]
        end
        y[i] = sum
    end
end

local function Atv(x, y, n)
    for i = 1, n do
        local sum = 0
        for j = 1, n do
            sum = sum + A(j, i) * x[j]
        end
        y[i] = sum
    end
end

local function AtAv(x, y, t, n)
    Av(x, t, n)
    Atv(t, y, n)
end

return function()
    local n = 100
    local u = {}
    local v = {}
    local w = {}
    
    -- Initialize
    for i = 1, n do
        u[i] = 1
        v[i] = 0
        w[i] = 0
    end
    
    -- Power method iterations
    for i = 1, 10 do
        AtAv(u, v, w, n)
        AtAv(v, u, w, n)
    end
    
    -- Compute spectral norm
    local vBv = 0
    local vv = 0
    for i = 1, n do
        vBv = vBv + u[i] * v[i]
        vv = vv + v[i] * v[i]
    end
    
    local spectral_norm = math.sqrt(vBv / vv)
end
