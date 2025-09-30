
--[[
Fannkuch Benchmark
Contributor: Rich Hickey - Functional programming patterns and permutations

This benchmark tests array manipulation and algorithmic efficiency
through the fannkuch problem (pancake flipping).
]]

local function fannkuch(n)
    local perm = {}
    local perm1 = {}
    local count = {}
    local maxFlipsCount = 0
    local permCount = 0
    local checksum = 0
    
    -- Initialize
    for i = 1, n do
        perm1[i] = i
        count[i] = i
    end
    
    local function nextPerm()
        local temp = perm1[1]
        local i = 1
        while i < n do
            perm1[i] = perm1[i + 1]
            i = i + 1
        end
        perm1[i] = temp
        
        i = 2
        while count[i] == 1 do
            count[i] = i
            i = i + 1
        end
        count[i] = count[i] - 1
        
        return i <= n
    end
    
    repeat
        -- Copy perm1 to perm
        for i = 1, n do
            perm[i] = perm1[i]
        end
        
        local flipsCount = 0
        local k = perm[1]
        
        while k ~= 1 do
            local k2 = (k + 1) // 2
            for i = 1, k2 do
                local temp = perm[i]
                perm[i] = perm[k + 1 - i]
                perm[k + 1 - i] = temp
            end
            flipsCount = flipsCount + 1
            k = perm[1]
        end
        
        maxFlipsCount = math.max(maxFlipsCount, flipsCount)
        checksum = checksum + (permCount % 2 == 0 and flipsCount or -flipsCount)
        permCount = permCount + 1
        
    until not nextPerm()
    
    return maxFlipsCount, checksum
end

return function()
    local n = 8
    local maxFlips, checksum = fannkuch(n)
end
