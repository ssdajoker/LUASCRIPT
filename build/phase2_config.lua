-- LUASCRIPT Phase 2 Build Configuration
-- Steve Jobs: "Build systems should be elegant and just work"
-- Donald Knuth: "Configuration must be algorithmically sound and maintainable"

local config = {}

-- Phase 2 Module Configuration
config.modules = {
    gpu_accel = {
        enabled = true,
        dependencies = {
            "libcuda.so.1",     -- CUDA Driver API
            "libcudart.so.11.0" -- CUDA Runtime (optional)
        },
        optional = true, -- Graceful degradation if CUDA not available
        test_file = "tests/test_gpu.lua"
    },
    
    openvino = {
        enabled = true,
        dependencies = {
            "libopenvino_c.so"  -- OpenVINO C API
        },
        optional = true, -- Graceful degradation if OpenVINO not available
        test_file = "tests/test_openvino.lua"
    },
    
    profiler = {
        enabled = true,
        dependencies = {
            -- Built-in LuaJIT profiler, no external deps
        },
        optional = false, -- Core functionality
        test_file = "tests/test_profiler.lua"
    },
    
    ternary = {
        enabled = true,
        dependencies = {
            -- Pure Lua implementation, no external deps
        },
        optional = false, -- Research component
        test_file = "tests/test_ternary.lua"
    }
}

-- Build Targets
config.targets = {
    development = {
        optimization = "debug",
        assertions = true,
        profiling = true,
        all_modules = true
    },
    
    production = {
        optimization = "release",
        assertions = false,
        profiling = false,
        optional_modules_only_if_available = true
    },
    
    minimal = {
        optimization = "size",
        assertions = false,
        profiling = false,
        modules = {"profiler", "ternary"} -- Core only
    }
}

-- External Library Detection
config.library_paths = {
    linux = {
        cuda = {"/usr/local/cuda/lib64", "/usr/lib/x86_64-linux-gnu"},
        openvino = {"/opt/intel/openvino/runtime/lib", "/usr/local/lib"}
    },
    windows = {
        cuda = {"C:/Program Files/NVIDIA GPU Computing Toolkit/CUDA/v11.8/lib/x64"},
        openvino = {"C:/Program Files (x86)/Intel/openvino_2023/runtime/lib"}
    },
    macos = {
        cuda = {"/usr/local/cuda/lib"},
        openvino = {"/usr/local/lib"}
    }
}

-- Test Configuration
config.testing = {
    unit_tests = true,
    integration_tests = true,
    performance_tests = true,
    coverage_target = 95, -- 95% test coverage target
    timeout_seconds = 300 -- 5 minute test timeout
}

-- Performance Targets (for validation)
config.performance_targets = {
    gpu_kernel_launch_overhead_ms = 1.0,
    openvino_inference_efficiency_percent = 90.0,
    profiler_overhead_percent = 5.0,
    memory_footprint_mb = 10.0
}

-- Documentation Generation
config.documentation = {
    api_docs = true,
    examples = true,
    tutorials = true,
    performance_guide = true
}

return config
