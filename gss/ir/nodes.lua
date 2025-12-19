
-- Kernel Graph IR Node Definitions
-- Intermediate representation for GSS rendering pipeline

local M = {}

-- Node ID counter
local next_id = 1

local function new_id()
    local id = next_id
    next_id = next_id + 1
    return id
end

-- Base node
function M.Node(type, props)
    local node = {
        type = type,
        id = new_id()
    }
    for k, v in pairs(props or {}) do
        node[k] = v
    end
    return node
end

-- Gaussian field node
function M.GaussianNode(muX, muY, sigma)
    return M.Node("gaussian", {
        muX = muX,
        muY = muY,
        sigma = sigma
    })
end

-- Mix node (weighted blend)
function M.MixNode(input1, input2, weight)
    return M.Node("mix", {
        input1 = input1,
        input2 = input2,
        weight = weight
    })
end

-- Sum node (additive blend)
function M.SumNode(inputs, normalize)
    return M.Node("sum", {
        inputs = inputs,
        normalize = normalize or false
    })
end

-- Ramp LUT node
function M.RampNode(input, palette, lut)
    return M.Node("ramp", {
        input = input,
        palette = palette,
        lut = lut
    })
end

-- Iso contour node
function M.IsoNode(input, threshold, width)
    return M.Node("iso", {
        input = input,
        threshold = threshold,
        width = width or 1
    })
end

-- Composite node (final output)
function M.CompositeNode(layers, blend_mode)
    return M.Node("composite", {
        layers = layers,
        blend_mode = blend_mode or "normal"
    })
end

-- Parameter binding node
function M.ParamNode(name, value, range)
    return M.Node("param", {
        name = name,
        value = value,
        range = range
    })
end

-- Constant node
function M.ConstantNode(value)
    return M.Node("constant", {
        value = value
    })
end

-- Binary operation node
function M.BinaryOpNode(op, left, right)
    return M.Node("binary_op", {
        op = op,
        left = left,
        right = right
    })
end

-- Async operation node
function M.AsyncNode(operation, inputs)
    return M.Node("async", {
        operation = operation,
        inputs = inputs or {}
    })
end

-- Await node (awaits an async operation)
function M.AwaitNode(async_node)
    return M.Node("await", {
        async_node = async_node
    })
end

-- Async block node (groups multiple async operations)
function M.AsyncBlockNode(operations)
    return M.Node("async_block", {
        operations = operations or {}
    })
end

-- Utility: Print node
function M.print_node(node, indent)
    indent = indent or 0
    local prefix = string.rep("  ", indent)

    print(prefix .. "Node #" .. node.id .. " [" .. node.type .. "]")

    for k, v in pairs(node) do
        if k ~= "type" and k ~= "id" then
            if type(v) == "table" and v.type then
                print(prefix .. "  " .. k .. ":")
                M.print_node(v, indent + 2)
            elseif type(v) == "table" and v[1] and type(v[1]) == "table" and v[1].type then
                print(prefix .. "  " .. k .. ": [")
                for _, item in ipairs(v) do
                    M.print_node(item, indent + 2)
                end
                print(prefix .. "  ]")
            else
                print(prefix .. "  " .. k .. ": " .. tostring(v))
            end
        end
    end
end

-- Utility: Get node dependencies
function M.get_dependencies(node)
    local deps = {}

    if node.type == "mix" then
        table.insert(deps, node.input1)
        table.insert(deps, node.input2)
    elseif node.type == "sum" then
        for _, input in ipairs(node.inputs) do
            table.insert(deps, input)
        end
    elseif node.type == "ramp" or node.type == "iso" then
        table.insert(deps, node.input)
    elseif node.type == "composite" then
        for _, layer in ipairs(node.layers) do
            table.insert(deps, layer)
        end
    elseif node.type == "binary_op" then
        table.insert(deps, node.left)
        table.insert(deps, node.right)
    elseif node.type == "async" then
        for _, input in ipairs(node.inputs) do
            table.insert(deps, input)
        end
    elseif node.type == "await" then
        table.insert(deps, node.async_node)
    elseif node.type == "async_block" then
        for _, op in ipairs(node.operations) do
            table.insert(deps, op)
        end
    end

    return deps
end

-- Utility: Topological sort
function M.topological_sort(nodes)
    local sorted = {}
    local visited = {}
    local temp_mark = {}

    local function visit(node)
        if temp_mark[node.id] then
            error("Circular dependency detected in kernel graph")
        end

        if not visited[node.id] then
            temp_mark[node.id] = true

            local deps = M.get_dependencies(node)
            for _, dep in ipairs(deps) do
                visit(dep)
            end

            temp_mark[node.id] = false
            visited[node.id] = true
            table.insert(sorted, node)
        end
    end

    for _, node in ipairs(nodes) do
        if not visited[node.id] then
            visit(node)
        end
    end

    return sorted
end

return M
