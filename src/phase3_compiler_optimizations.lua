
-- PHASE 3: COMPILER OPTIMIZATIONS - REAL CODE!
-- Team A: Advanced compilation and optimization features

local optimizer = {}

-- Dead Code Elimination
function optimizer.eliminate_dead_code(ast)
    local used_variables = {}
    local live_code = {}
    
    -- Mark all used variables
    local function mark_used(node)
        if node.type == "variable" then
            used_variables[node.name] = true
        elseif node.type == "assignment" then
            mark_used(node.value)
        elseif node.type == "function_call" then
            for _, arg in ipairs(node.arguments) do
                mark_used(arg)
            end
        end
    end
    
    -- First pass: mark all used variables
    for _, statement in ipairs(ast.statements) do
        mark_used(statement)
    end
    
    -- Second pass: keep only live code
    for _, statement in ipairs(ast.statements) do
        if statement.type == "assignment" then
            if used_variables[statement.target] then
                table.insert(live_code, statement)
            end
        else
            table.insert(live_code, statement)
        end
    end
    
    return {type = "program", statements = live_code}
end

-- Constant Folding
function optimizer.fold_constants(ast)
    local function fold_node(node)
        if node.type == "binary_op" then
            local left = fold_node(node.left)
            local right = fold_node(node.right)
            
            if left.type == "number" and right.type == "number" then
                local result
                if node.operator == "+" then
                    result = left.value + right.value
                elseif node.operator == "-" then
                    result = left.value - right.value
                elseif node.operator == "*" then
                    result = left.value * right.value
                elseif node.operator == "/" then
                    result = left.value / right.value
                end
                
                if result then
                    return {type = "number", value = result}
                end
            end
            
            return {type = "binary_op", operator = node.operator, left = left, right = right}
        end
        
        return node
    end
    
    local optimized_statements = {}
    for _, statement in ipairs(ast.statements) do
        table.insert(optimized_statements, fold_node(statement))
    end
    
    return {type = "program", statements = optimized_statements}
end

-- Loop Optimization
function optimizer.optimize_loops(ast)
    local function optimize_node(node)
        if node.type == "for_loop" then
            -- Loop unrolling for small constant loops
            if node.start.type == "number" and node.end_val.type == "number" and 
               node.end_val.value - node.start.value <= 5 then
                
                local unrolled = {}
                for i = node.start.value, node.end_val.value do
                    for _, stmt in ipairs(node.body) do
                        local unrolled_stmt = optimizer.substitute_variable(stmt, node.variable, {type = "number", value = i})
                        table.insert(unrolled, unrolled_stmt)
                    end
                end
                
                return {type = "block", statements = unrolled}
            end
        end
        
        return node
    end
    
    local optimized_statements = {}
    for _, statement in ipairs(ast.statements) do
        table.insert(optimized_statements, optimize_node(statement))
    end
    
    return {type = "program", statements = optimized_statements}
end

function optimizer.substitute_variable(node, var_name, replacement)
    if node.type == "variable" and node.name == var_name then
        return replacement
    elseif node.type == "binary_op" then
        return {
            type = "binary_op",
            operator = node.operator,
            left = optimizer.substitute_variable(node.left, var_name, replacement),
            right = optimizer.substitute_variable(node.right, var_name, replacement)
        }
    end
    
    return node
end

-- Register Allocation
optimizer.register_allocator = {
    available_registers = {"r1", "r2", "r3", "r4", "r5", "r6", "r7", "r8"},
    variable_to_register = {},
    register_to_variable = {}
}

function optimizer.register_allocator:allocate(variable)
    if self.variable_to_register[variable] then
        return self.variable_to_register[variable]
    end
    
    for _, reg in ipairs(self.available_registers) do
        if not self.register_to_variable[reg] then
            self.variable_to_register[variable] = reg
            self.register_to_variable[reg] = variable
            return reg
        end
    end
    
    -- Spill to memory if no registers available
    return "memory_" .. variable
end

function optimizer.register_allocator:free(variable)
    local reg = self.variable_to_register[variable]
    if reg then
        self.variable_to_register[variable] = nil
        self.register_to_variable[reg] = nil
    end
end

-- Instruction Scheduling
function optimizer.schedule_instructions(instructions)
    local scheduled = {}
    local dependencies = {}
    
    -- Build dependency graph
    for i, instr in ipairs(instructions) do
        dependencies[i] = {}
        for j = 1, i - 1 do
            if optimizer.has_dependency(instructions[j], instr) then
                table.insert(dependencies[i], j)
            end
        end
    end
    
    -- Schedule instructions respecting dependencies
    local scheduled_mask = {}
    while #scheduled < #instructions do
        for i, instr in ipairs(instructions) do
            if not scheduled_mask[i] then
                local can_schedule = true
                for _, dep in ipairs(dependencies[i]) do
                    if not scheduled_mask[dep] then
                        can_schedule = false
                        break
                    end
                end
                
                if can_schedule then
                    table.insert(scheduled, instr)
                    scheduled_mask[i] = true
                    break
                end
            end
        end
    end
    
    return scheduled
end

function optimizer.has_dependency(instr1, instr2)
    -- Check if instr2 depends on instr1
    if instr1.type == "assignment" and instr2.type == "variable" then
        return instr1.target == instr2.name
    end
    return false
end

return optimizer
