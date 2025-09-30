
-- AGSS Agent Runtime
-- Automated parameter optimization and tuning

local strategies = require("gss.agss.strategies")
local metrics = require("gss.agss.metrics")

local M = {}

-- Agent state
M.State = {
    IDLE = "idle",
    RUNNING = "running",
    PAUSED = "paused",
    STOPPED = "stopped"
}

-- Create agent
function M.Agent(config)
    return {
        name = config.name or "agent",
        target = config.target or {metric = "fps", value = 60},
        ranges = config.ranges or {},
        budget = config.budget or {type = "trials", value = 100},
        strategy = config.strategy or "grid",
        record_fields = config.record_fields or {"fps", "latency"},
        
        state = M.State.IDLE,
        trial = 0,
        best_params = nil,
        best_reward = -math.huge,
        
        log = {},
        checkpoints = {}
    }
end

-- Start agent
function M.start(agent, engine, graph)
    if agent.state == M.State.RUNNING then
        return false, "Agent already running"
    end
    
    agent.state = M.State.RUNNING
    agent.trial = 0
    agent.log = {}
    
    -- Create strategy iterator
    local next_sample, observe_fn
    
    if agent.strategy == "grid" then
        local step_sizes = {}
        for name, range in pairs(agent.ranges) do
            step_sizes[name] = range.step or (range.max - range.min) / 10
        end
        next_sample = strategies.grid_search(agent.ranges, step_sizes)
        
    elseif agent.strategy == "random" then
        next_sample = strategies.random_search(agent.ranges, agent.budget.value)
        
    elseif agent.strategy == "bayes" then
        next_sample, observe_fn = strategies.bayesian_search(agent.ranges, agent.budget.value)
        
    elseif agent.strategy == "anneal" then
        next_sample, observe_fn = strategies.simulated_annealing(agent.ranges, agent.budget.value)
    end
    
    agent.next_sample = next_sample
    agent.observe_fn = observe_fn
    
    return true
end

-- Run single iteration
function M.step(agent, engine, graph)
    if agent.state ~= M.State.RUNNING then
        return nil, "Agent not running"
    end
    
    -- Get next parameter sample
    local params = agent.next_sample()
    
    if not params then
        -- Budget exhausted
        agent.state = M.State.STOPPED
        return nil, "Budget exhausted"
    end
    
    agent.trial = agent.trial + 1
    
    -- Apply parameters to engine
    for name, value in pairs(params) do
        engine.params[name] = value
    end
    
    -- Measure performance
    local render_fn = function()
        engine:execute(graph)
    end
    
    local measurements = metrics.measure_all(render_fn, nil, engine.width, engine.height)
    
    -- Compute reward based on target
    local reward = M.compute_reward(agent, measurements)
    
    -- Update best
    if reward > agent.best_reward then
        agent.best_reward = reward
        agent.best_params = params
    end
    
    -- Observe (for adaptive strategies)
    if agent.observe_fn then
        agent.observe_fn(params, reward)
    end
    
    -- Log trial
    local log_entry = {
        trial = agent.trial,
        timestamp = os.time(),
        params = params,
        measurements = measurements,
        reward = reward,
        checksum = metrics.compute_checksum(params)
    }
    
    table.insert(agent.log, log_entry)
    
    return log_entry
end

-- Run agent loop
function M.run(agent, engine, graph, callback)
    M.start(agent, engine, graph)
    
    while agent.state == M.State.RUNNING do
        local result, err = M.step(agent, engine, graph)
        
        if not result then
            break
        end
        
        -- Callback for progress updates
        if callback then
            callback(result)
        end
        
        -- Check safety conditions
        if not M.check_safety(agent, result) then
            agent.state = M.State.STOPPED
            break
        end
        
        -- Yield for cooperative multitasking
        coroutine.yield()
    end
    
    return agent.best_params, agent.best_reward
end

-- Compute reward from measurements
function M.compute_reward(agent, measurements)
    local target = agent.target
    
    if target.metric == "fps" then
        -- Reward: closer to target FPS is better
        local diff = math.abs(measurements.fps - target.value)
        return -diff
        
    elseif target.metric == "latency" then
        -- Reward: lower latency is better
        return -measurements.latency_mean
        
    elseif target.metric == "ssim" then
        -- Reward: higher SSIM is better
        return measurements.ssim
        
    elseif target.metric == "quality" then
        -- Reward: composite quality metric
        return measurements.ssim - measurements.delta_e / 100
    end
    
    return 0
end

-- Check safety conditions
function M.check_safety(agent, result)
    -- Stop if SSIM drops too low
    if result.measurements.ssim and result.measurements.ssim < 0.5 then
        return false
    end
    
    -- Stop if latency too high
    if result.measurements.latency_mean > 1000 then  -- 1 second
        return false
    end
    
    return true
end

-- Pause agent
function M.pause(agent)
    if agent.state == M.State.RUNNING then
        agent.state = M.State.PAUSED
        return true
    end
    return false
end

-- Resume agent
function M.resume(agent)
    if agent.state == M.State.PAUSED then
        agent.state = M.State.RUNNING
        return true
    end
    return false
end

-- Stop agent
function M.stop(agent)
    agent.state = M.State.STOPPED
    return true
end

-- Repeat best case
function M.repeat_best(agent, engine, graph)
    if not agent.best_params then
        return nil, "No best parameters found"
    end
    
    -- Apply best parameters
    for name, value in pairs(agent.best_params) do
        engine.params[name] = value
    end
    
    -- Render
    return engine:execute(graph)
end

-- Export log to CSV
function M.export_csv(agent, filename)
    local file = io.open(filename, "w")
    
    if not file then
        return false, "Failed to open file"
    end
    
    -- Header
    local header = {"trial", "timestamp"}
    
    -- Add parameter columns
    if #agent.log > 0 then
        for name in pairs(agent.log[1].params) do
            table.insert(header, name)
        end
    end
    
    -- Add measurement columns
    for _, field in ipairs(agent.record_fields) do
        table.insert(header, field)
    end
    
    table.insert(header, "reward")
    table.insert(header, "checksum")
    
    file:write(table.concat(header, ",") .. "\n")
    
    -- Data rows
    for _, entry in ipairs(agent.log) do
        local row = {entry.trial, entry.timestamp}
        
        for name in pairs(entry.params) do
            table.insert(row, entry.params[name])
        end
        
        for _, field in ipairs(agent.record_fields) do
            table.insert(row, entry.measurements[field] or "")
        end
        
        table.insert(row, entry.reward)
        table.insert(row, entry.checksum)
        
        file:write(table.concat(row, ",") .. "\n")
    end
    
    file:close()
    return true
end

-- Export log to Markdown
function M.export_markdown(agent, filename)
    local file = io.open(filename, "w")
    
    if not file then
        return false, "Failed to open file"
    end
    
    file:write("# AGSS Agent Log: " .. agent.name .. "\n\n")
    file:write("**Strategy**: " .. agent.strategy .. "\n")
    file:write("**Target**: " .. agent.target.metric .. " = " .. agent.target.value .. "\n")
    file:write("**Trials**: " .. agent.trial .. "\n\n")
    
    if agent.best_params then
        file:write("## Best Parameters\n\n")
        file:write("**Reward**: " .. agent.best_reward .. "\n\n")
        
        for name, value in pairs(agent.best_params) do
            file:write("- **" .. name .. "**: " .. value .. "\n")
        end
        
        file:write("\n")
    end
    
    file:write("## Trial Log\n\n")
    file:write("| Trial | ")
    
    -- Header
    if #agent.log > 0 then
        for name in pairs(agent.log[1].params) do
            file:write(name .. " | ")
        end
    end
    
    for _, field in ipairs(agent.record_fields) do
        file:write(field .. " | ")
    end
    
    file:write("Reward | Checksum |\n")
    file:write("|------:|")
    
    if #agent.log > 0 then
        for _ in pairs(agent.log[1].params) do
            file:write("-------:|")
        end
    end
    
    for _ in ipairs(agent.record_fields) do
        file:write("-------:|")
    end
    
    file:write("-------:|---------:|\n")
    
    -- Data rows
    for _, entry in ipairs(agent.log) do
        file:write(string.format("| %5d | ", entry.trial))
        
        for name in pairs(entry.params) do
            file:write(string.format("%6.2f | ", entry.params[name]))
        end
        
        for _, field in ipairs(agent.record_fields) do
            local value = entry.measurements[field]
            if type(value) == "number" then
                file:write(string.format("%6.2f | ", value))
            else
                file:write("     - | ")
            end
        end
        
        file:write(string.format("%6.2f | %s |\n", entry.reward, entry.checksum))
    end
    
    file:close()
    return true
end

return M
