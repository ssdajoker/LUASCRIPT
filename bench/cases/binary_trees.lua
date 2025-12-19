
--[[
Binary Trees Benchmark
Contributor: Donald Knuth - Tree algorithms and memory allocation patterns

This benchmark tests memory allocation and deallocation patterns
through recursive tree construction and traversal.
]]

local function make_tree(item, depth)
    if depth > 0 then
        local i = item + item
        depth = depth - 1
        return {
            item = item,
            left = make_tree(i - 1, depth),
            right = make_tree(i, depth)
        }
    else
        return {item = item}
    end
end

local function check_tree(tree)
    if tree.left then
        return tree.item + check_tree(tree.left) - check_tree(tree.right)
    else
        return tree.item
    end
end

return function()
    local min_depth = 4
    local max_depth = 12
    local stretch_depth = max_depth + 1
    
    -- Stretch memory
    local stretch_tree = make_tree(0, stretch_depth)
    local stretch_check = check_tree(stretch_tree)
    stretch_tree = nil
    
    -- Create long-lived tree
    local long_lived_tree = make_tree(0, max_depth)
    
    -- Create many trees
    for depth = min_depth, max_depth, 2 do
        local iterations = 2 ^ (max_depth - depth + min_depth)
        local check = 0
        
        for i = 1, iterations do
            local temp_tree = make_tree(i, depth)
            check = check + check_tree(temp_tree)
            temp_tree = make_tree(-i, depth)
            check = check + check_tree(temp_tree)
        end
    end
    
    -- Final check
    local final_check = check_tree(long_lived_tree)
end
