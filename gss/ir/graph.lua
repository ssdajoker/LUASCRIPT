
-- Kernel Graph IR
-- Build and manage the rendering pipeline graph

local nodes = require("gss.ir.nodes")

local M = {}

-- Kernel graph
function M.Graph()
    return {
        nodes = {},
        root = nil,
        params = {}
    }
end

-- Add node to graph
function M.add_node(graph, node)
    table.insert(graph.nodes, node)
    return node
end

-- Set root node (final output)
function M.set_root(graph, node)
    graph.root = node
end

-- Add parameter binding
function M.add_param(graph, name, value, range)
    local param = nodes.ParamNode(name, value, range)
    graph.params[name] = param
    return param
end

-- Get parameter by name
function M.get_param(graph, name)
    return graph.params[name]
end

-- Topologically sort graph
function M.sort(graph)
    if not graph.root then
        return {}
    end

    -- Collect all reachable nodes from root
    local reachable = {}
    local visited = {}

    local function collect(node)
        if visited[node.id] then
            return
        end
        visited[node.id] = true
        table.insert(reachable, node)

        local deps = nodes.get_dependencies(node)
        for _, dep in ipairs(deps) do
            collect(dep)
        end
    end

    collect(graph.root)

    -- Topological sort
    return nodes.topological_sort(reachable)
end

-- Optimize graph
function M.optimize(graph)
    -- Constant folding
    M.constant_folding(graph)

    -- Dead code elimination
    M.dead_code_elimination(graph)

    -- Common subexpression elimination
    M.cse(graph)
end

-- Constant folding
function M.constant_folding(graph)
    for _, node in ipairs(graph.nodes) do
        if node.type == "binary_op" then
            if node.left.type == "constant" and node.right.type == "constant" then
                local result = M.eval_binary_op(node.op, node.left.value, node.right.value)
                node.type = "constant"
                node.value = result
                node.op = nil
                node.left = nil
                node.right = nil
            end
        end
    end
end

-- Evaluate binary operation
function M.eval_binary_op(op, left, right)
    if op == "+" then
        return left + right
    elseif op == "-" then
        return left - right
    elseif op == "*" then
        return left * right
    elseif op == "/" then
        return right ~= 0 and left / right or 0
    elseif op == "%" then
        return right ~= 0 and left % right or 0
    end
    return 0
end

-- Dead code elimination
function M.dead_code_elimination(graph)
    if not graph.root then
        return
    end

    -- Mark reachable nodes
    local reachable = {}
    local visited = {}

    local function mark(node)
        if visited[node.id] then
            return
        end
        visited[node.id] = true
        reachable[node.id] = true

        local deps = nodes.get_dependencies(node)
        for _, dep in ipairs(deps) do
            mark(dep)
        end
    end

    mark(graph.root)

    -- Remove unreachable nodes
    local new_nodes = {}
    for _, node in ipairs(graph.nodes) do
        if reachable[node.id] then
            table.insert(new_nodes, node)
        end
    end
    graph.nodes = new_nodes
end

-- Common subexpression elimination
function M.cse(graph)
    local expr_map = {}

    for _, node in ipairs(graph.nodes) do
        if node.type == "gaussian" then
            local key = string.format("gaussian(%s,%s,%s)",
                tostring(node.muX), tostring(node.muY), tostring(node.sigma))

            if expr_map[key] then
                -- Replace with existing node
                M.replace_node(graph, node, expr_map[key])
            else
                expr_map[key] = node
            end
        end
    end
end

-- Replace node references
function M.replace_node(graph, old_node, new_node)
    for _, node in ipairs(graph.nodes) do
        if node.type == "mix" then
            if node.input1 == old_node then
                node.input1 = new_node
            end
            if node.input2 == old_node then
                node.input2 = new_node
            end
        elseif node.type == "sum" then
            for i, input in ipairs(node.inputs) do
                if input == old_node then
                    node.inputs[i] = new_node
                end
            end
        elseif node.type == "ramp" or node.type == "iso" then
            if node.input == old_node then
                node.input = new_node
            end
        end
    end
end

-- Print graph
function M.print_graph(graph)
    print("=== Kernel Graph ===")
    print("Nodes: " .. #graph.nodes)
    print("Parameters: " .. M.count_table(graph.params))

    if graph.root then
        print("\nRoot node: #" .. graph.root.id)
    end

    print("\nTopological order:")
    local sorted = M.sort(graph)
    for i, node in ipairs(sorted) do
        print(string.format("  %d. Node #%d [%s]", i, node.id, node.type))
    end
end

-- Count table entries
function M.count_table(t)
    local count = 0
    for _ in pairs(t) do
        count = count + 1
    end
    return count
end

return M
