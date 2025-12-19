
--[[
N-Body Simulation Benchmark
Contributor: John Carmack - Real-time physics simulation

This benchmark simulates the orbital motion of Jovian planets,
testing floating-point arithmetic and vector operations.
]]

local PI = 3.141592653589793
local SOLAR_MASS = 4 * PI * PI
local DAYS_PER_YEAR = 365.24

-- Planet data
local bodies = {
    -- Sun
    {x=0, y=0, z=0, vx=0, vy=0, vz=0, mass=SOLAR_MASS},
    -- Jupiter
    {
        x = 4.84143144246472090e+00,
        y = -1.16032004402742839e+00,
        z = -1.03622044471123109e-01,
        vx = 1.66007664274403694e-03 * DAYS_PER_YEAR,
        vy = 7.69901118419740425e-03 * DAYS_PER_YEAR,
        vz = -6.90460016972063023e-05 * DAYS_PER_YEAR,
        mass = 9.54791938424326609e-04 * SOLAR_MASS
    },
    -- Saturn
    {
        x = 8.34336671824457987e+00,
        y = 4.12479856412430479e+00,
        z = -4.03523417114321381e-01,
        vx = -2.76742510726862411e-03 * DAYS_PER_YEAR,
        vy = 4.99852801234917238e-03 * DAYS_PER_YEAR,
        vz = 2.30417297573763929e-05 * DAYS_PER_YEAR,
        mass = 2.85885980666130812e-04 * SOLAR_MASS
    }
}

local function advance(bodies, dt)
    local nbodies = #bodies
    
    -- Compute interactions
    for i = 1, nbodies do
        local bi = bodies[i]
        for j = i + 1, nbodies do
            local bj = bodies[j]
            local dx = bi.x - bj.x
            local dy = bi.y - bj.y
            local dz = bi.z - bj.z
            
            local distance = math.sqrt(dx*dx + dy*dy + dz*dz)
            local mag = dt / (distance * distance * distance)
            
            bi.vx = bi.vx - dx * bj.mass * mag
            bi.vy = bi.vy - dy * bj.mass * mag
            bi.vz = bi.vz - dz * bj.mass * mag
            
            bj.vx = bj.vx + dx * bi.mass * mag
            bj.vy = bj.vy + dy * bi.mass * mag
            bj.vz = bj.vz + dz * bi.mass * mag
        end
    end
    
    -- Update positions
    for i = 1, nbodies do
        local bi = bodies[i]
        bi.x = bi.x + dt * bi.vx
        bi.y = bi.y + dt * bi.vy
        bi.z = bi.z + dt * bi.vz
    end
end

local function energy(bodies)
    local e = 0
    local nbodies = #bodies
    
    for i = 1, nbodies do
        local bi = bodies[i]
        e = e + 0.5 * bi.mass * (bi.vx*bi.vx + bi.vy*bi.vy + bi.vz*bi.vz)
        
        for j = i + 1, nbodies do
            local bj = bodies[j]
            local dx = bi.x - bj.x
            local dy = bi.y - bj.y
            local dz = bi.z - bj.z
            local distance = math.sqrt(dx*dx + dy*dy + dz*dz)
            e = e - (bi.mass * bj.mass) / distance
        end
    end
    
    return e
end

local function offset_momentum(bodies)
    local px, py, pz = 0, 0, 0
    for i = 1, #bodies do
        local bi = bodies[i]
        px = px + bi.vx * bi.mass
        py = py + bi.vy * bi.mass
        pz = pz + bi.vz * bi.mass
    end
    bodies[1].vx = -px / SOLAR_MASS
    bodies[1].vy = -py / SOLAR_MASS
    bodies[1].vz = -pz / SOLAR_MASS
end

return function()
    local n = 1000
    
    offset_momentum(bodies)
    local initial_energy = energy(bodies)
    
    for i = 1, n do
        advance(bodies, 0.01)
    end
    
    local final_energy = energy(bodies)
end
