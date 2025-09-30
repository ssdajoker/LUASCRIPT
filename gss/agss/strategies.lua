
-- AGSS Search Strategies
-- Grid, Random, Bayesian, and Simulated Annealing

local M = {}

-- Grid search strategy
function M.grid_search(ranges, step_sizes)
    local params = {}
    local param_names = {}
    
    -- Extract parameter names and ranges
    for name, range in pairs(ranges) do
        table.insert(param_names, name)
        params[name] = {
            min = range.min,
            max = range.max,
            step = step_sizes[name] or (range.max - range.min) / 10,
            current = range.min
        }
    end
    
    -- Iterator function
    local function next_sample()
        local sample = {}
        
        -- Get current values
        for _, name in ipairs(param_names) do
            sample[name] = params[name].current
        end
        
        -- Advance to next combination
        local carry = true
        for i = #param_names, 1, -1 do
            local name = param_names[i]
            local p = params[name]
            
            if carry then
                p.current = p.current + p.step
                
                if p.current <= p.max then
                    carry = false
                else
                    p.current = p.min
                end
            end
        end
        
        -- Return nil when done
        if carry then
            return nil
        end
        
        return sample
    end
    
    return next_sample
end

-- Random search strategy
function M.random_search(ranges, num_trials)
    local trial = 0
    
    local function next_sample()
        if trial >= num_trials then
            return nil
        end
        
        trial = trial + 1
        local sample = {}
        
        for name, range in pairs(ranges) do
            sample[name] = range.min + math.random() * (range.max - range.min)
        end
        
        return sample
    end
    
    return next_sample
end

-- Bayesian optimization (simplified Gaussian Process)
function M.bayesian_search(ranges, num_trials)
    local observations = {}
    local trial = 0
    
    -- Acquisition function: Upper Confidence Bound (UCB)
    local function ucb(mean, std, kappa)
        kappa = kappa or 2.0
        return mean + kappa * std
    end
    
    -- Gaussian kernel
    local function kernel(x1, x2, length_scale)
        length_scale = length_scale or 1.0
        local dist_sq = 0
        
        for name, _ in pairs(ranges) do
            local diff = (x1[name] or 0) - (x2[name] or 0)
            dist_sq = dist_sq + diff * diff
        end
        
        return math.exp(-dist_sq / (2 * length_scale * length_scale))
    end
    
    -- Predict mean and std at point
    local function predict(x)
        if #observations == 0 then
            return 0, 1
        end
        
        -- Compute kernel vector
        local k = {}
        for i, obs in ipairs(observations) do
            k[i] = kernel(x, obs.params)
        end
        
        -- Simple mean prediction (weighted average)
        local mean = 0
        local weight_sum = 0
        
        for i, obs in ipairs(observations) do
            mean = mean + k[i] * obs.reward
            weight_sum = weight_sum + k[i]
        end
        
        mean = weight_sum > 0 and mean / weight_sum or 0
        
        -- Simple std prediction
        local std = 1.0 / (1.0 + weight_sum)
        
        return mean, std
    end
    
    local function next_sample()
        if trial >= num_trials then
            return nil
        end
        
        trial = trial + 1
        
        -- First few trials: random exploration
        if trial <= 3 then
            local sample = {}
            for name, range in pairs(ranges) do
                sample[name] = range.min + math.random() * (range.max - range.min)
            end
            return sample
        end
        
        -- Optimize acquisition function
        local best_sample = nil
        local best_acq = -math.huge
        
        -- Sample candidates
        for _ = 1, 100 do
            local candidate = {}
            for name, range in pairs(ranges) do
                candidate[name] = range.min + math.random() * (range.max - range.min)
            end
            
            local mean, std = predict(candidate)
            local acq = ucb(mean, std)
            
            if acq > best_acq then
                best_acq = acq
                best_sample = candidate
            end
        end
        
        return best_sample
    end
    
    -- Observe function (called after measuring reward)
    local function observe(params, reward)
        table.insert(observations, {params = params, reward = reward})
    end
    
    return next_sample, observe
end

-- Simulated annealing strategy
function M.simulated_annealing(ranges, num_trials, initial_temp, cooling_rate)
    initial_temp = initial_temp or 1.0
    cooling_rate = cooling_rate or 0.95
    
    local trial = 0
    local temperature = initial_temp
    local current_params = nil
    local current_reward = -math.huge
    
    -- Generate random neighbor
    local function neighbor(params, temp)
        local new_params = {}
        
        for name, range in pairs(ranges) do
            local step = (range.max - range.min) * temp * 0.1
            local delta = (math.random() - 0.5) * 2 * step
            new_params[name] = math.max(range.min, math.min(range.max, params[name] + delta))
        end
        
        return new_params
    end
    
    local function next_sample()
        if trial >= num_trials then
            return nil
        end
        
        trial = trial + 1
        
        -- Initialize with random sample
        if not current_params then
            current_params = {}
            for name, range in pairs(ranges) do
                current_params[name] = range.min + math.random() * (range.max - range.min)
            end
            return current_params
        end
        
        -- Generate neighbor
        local new_params = neighbor(current_params, temperature)
        
        -- Cool down
        temperature = temperature * cooling_rate
        
        return new_params
    end
    
    -- Accept function (called after measuring reward)
    local function accept(params, reward)
        if reward > current_reward then
            -- Always accept better solution
            current_params = params
            current_reward = reward
            return true
        else
            -- Accept worse solution with probability
            local delta = reward - current_reward
            local prob = math.exp(delta / temperature)
            
            if math.random() < prob then
                current_params = params
                current_reward = reward
                return true
            end
            
            return false
        end
    end
    
    return next_sample, accept
end

return M
