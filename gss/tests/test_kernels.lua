
-- Test GSS Runtime Kernels

local gaussian = require("gss.runtime.gaussian")
local ramp = require("gss.runtime.ramp")
local iso = require("gss.runtime.iso")
local blend = require("gss.runtime.blend")

local function test_gaussian_kernel()
    print("\n=== Test: Gaussian Kernel ===")

    local w, h = 100, 100
    local buf = {}

    -- Render Gaussian
    gaussian.gaussian_tile(buf, 0, 0, w, h, 50, 50, 20)

    -- Check center value (should be ~1.0)
    local center_val = buf[50 * w + 50]

    if not center_val or center_val < 0.99 then
        print("❌ FAILED: Center value incorrect:", center_val)
        return false
    end

    print("✓ Center value:", center_val)

    -- Check edge value (should be ~0.0)
    local edge_val = buf[0]

    if not edge_val or edge_val > 0.01 then
        print("❌ FAILED: Edge value incorrect:", edge_val)
        return false
    end

    print("✓ Edge value:", edge_val)

    return true
end

local function test_unicode_equivalence()
    print("\n=== Test: Unicode Math Equivalence ===")

    local r = 10
    local sigma = 20

    local unicode_result = gaussian.gaussian_unicode(r, sigma)
    local ascii_result = math.exp(-(r * r) / (2 * sigma * sigma))

    local diff = math.abs(unicode_result - ascii_result)

    print("Unicode result:", unicode_result)
    print("ASCII result:", ascii_result)
    print("Difference:", diff)

    if diff > 1e-15 then
        print("❌ FAILED: Difference exceeds 1 ULP")
        return false
    end

    print("✓ Unicode and ASCII results equivalent (≤1 ULP)")

    return true
end

local function test_ramp_lut()
    print("\n=== Test: Ramp LUT ===")

    local w, h = 100, 100
    local field = {}

    -- Create gradient field
    for y = 0, h - 1 do
        for x = 0, w - 1 do
            field[y * w + x] = x / (w - 1)
        end
    end

    -- Create simple gradient ramp
    local lut = ramp.gradient_ramp(
        {r = 0, g = 0, b = 0},
        {r = 255, g = 255, b = 255}
    )

    -- Apply ramp
    local colored = ramp.apply_ramp(field, w, h, lut)

    -- Check left edge (should be black)
    local left_r = colored[0]

    if not left_r or left_r > 10 then
        print("❌ FAILED: Left edge not black:", left_r)
        return false
    end

    print("✓ Left edge color:", left_r)

    -- Check right edge (should be white)
    local right_offset = (99 * w + 99) * 4
    local right_r = colored[right_offset]

    if not right_r or right_r < 245 then
        print("❌ FAILED: Right edge not white:", right_r)
        return false
    end

    print("✓ Right edge color:", right_r)

    return true
end

local function test_marching_squares()
    print("\n=== Test: Marching Squares ===")

    local w, h = 50, 50
    local field = {}

    -- Create circular field
    local cx, cy = 25, 25
    local radius = 15

    for y = 0, h - 1 do
        for x = 0, w - 1 do
            local dx = x - cx
            local dy = y - cy
            local dist = math.sqrt(dx * dx + dy * dy)
            field[y * w + x] = dist < radius and 1.0 or 0.0
        end
    end

    -- Extract contours
    local contours = iso.marching_squares(field, w, h, 0.5)

    print("✓ Contours extracted:", #contours)

    if #contours == 0 then
        print("❌ FAILED: No contours found")
        return false
    end

    print("✓ Marching squares working")

    return true
end

local function test_blend_modes()
    print("\n=== Test: Blend Modes ===")

    local src = {r = 128, g = 128, b = 128, a = 255}
    local dst = {r = 64, g = 64, b = 64, a = 255}

    -- Test normal blend
    local normal = blend.blend_normal(src, dst, 128)
    print("✓ Normal blend:", normal.r, normal.g, normal.b)

    -- Test multiply blend
    local multiply = blend.blend_multiply(src, dst)
    print("✓ Multiply blend:", multiply.r, multiply.g, multiply.b)

    -- Test screen blend
    local screen = blend.blend_screen(src, dst)
    print("✓ Screen blend:", screen.r, screen.g, screen.b)

    return true
end

local function test_performance()
    print("\n=== Test: Performance ===")

    local w, h = 640, 480
    local buf = {}

    local start = os.clock()

    -- Render 10 frames
    for i = 1, 10 do
        gaussian.gaussian_tile(buf, 0, 0, w, h, 320, 240, 50)
    end

    local elapsed = os.clock() - start
    local fps = 10 / elapsed

    print(string.format("✓ Rendered 10 frames in %.3f seconds", elapsed))
    print(string.format("✓ FPS: %.1f", fps))

    if fps < 30 then
        print("⚠ Warning: FPS below target (30)")
    end

    return true
end

-- Run all tests
local function run_all_tests()
    print("=================================")
    print("   GSS Kernel Test Suite")
    print("=================================")

    local tests = {
        test_gaussian_kernel,
        test_unicode_equivalence,
        test_ramp_lut,
        test_marching_squares,
        test_blend_modes,
        test_performance
    }

    local passed = 0
    local failed = 0

    for _, test in ipairs(tests) do
        local success, err = pcall(test)
        if success and err ~= false then
            passed = passed + 1
        else
            failed = failed + 1
            if not success then
                print("❌ Test crashed:", err)
            end
        end
    end

    print("\n=================================")
    print(string.format("Results: %d passed, %d failed", passed, failed))
    print("=================================")

    return failed == 0
end

-- Run tests
run_all_tests()
