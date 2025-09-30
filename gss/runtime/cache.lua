
-- Tile Cache System
-- LRU cache for rendered tiles

local M = {}

-- Create new cache
function M.Cache(max_size)
    return {
        max_size = max_size or 100,
        entries = {},
        access_order = {},
        size = 0
    }
end

-- Generate cache key
function M.cache_key(muX, muY, sigma, viewport)
    return string.format("%.2f_%.2f_%.2f_%dx%d", 
        muX, muY, sigma, viewport.w, viewport.h)
end

-- Get from cache
function M.get(cache, key)
    local entry = cache.entries[key]
    
    if entry then
        -- Update access order (move to end)
        M.touch(cache, key)
        return entry.data
    end
    
    return nil
end

-- Put into cache
function M.put(cache, key, data)
    -- Check if already exists
    if cache.entries[key] then
        cache.entries[key].data = data
        M.touch(cache, key)
        return
    end
    
    -- Evict if at capacity
    if cache.size >= cache.max_size then
        M.evict_lru(cache)
    end
    
    -- Add new entry
    cache.entries[key] = {
        data = data,
        timestamp = os.time()
    }
    table.insert(cache.access_order, key)
    cache.size = cache.size + 1
end

-- Touch entry (update access time)
function M.touch(cache, key)
    -- Remove from current position
    for i, k in ipairs(cache.access_order) do
        if k == key then
            table.remove(cache.access_order, i)
            break
        end
    end
    
    -- Add to end (most recently used)
    table.insert(cache.access_order, key)
end

-- Evict least recently used entry
function M.evict_lru(cache)
    if #cache.access_order == 0 then
        return
    end
    
    -- Remove first entry (least recently used)
    local key = table.remove(cache.access_order, 1)
    cache.entries[key] = nil
    cache.size = cache.size - 1
end

-- Clear cache
function M.clear(cache)
    cache.entries = {}
    cache.access_order = {}
    cache.size = 0
end

-- Get cache statistics
function M.stats(cache)
    return {
        size = cache.size,
        max_size = cache.max_size,
        utilization = cache.size / cache.max_size
    }
end

return M
