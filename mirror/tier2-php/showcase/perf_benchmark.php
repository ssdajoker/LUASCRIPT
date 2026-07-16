<?php
// MIRROR V3: Tier 2 PHP Showcase
// Category: Optimization
// Module: perf_benchmark.php

function measure_time(callable $func, int $iterations = 1000): array {
    $start = microtime(true);
    
    for ($i = 0; $i < $iterations; $i++) {
        $func();
    }
    
    $elapsed = (microtime(true) - $start) * 1000;
    
    return [
        'elapsed_ms' => round($elapsed, 3),
        'iterations' => $iterations,
        'per_call_us' => round($elapsed * 1000 / $iterations, 2),
    ];
}

function simple_operation(int $x): int {
    return $x * 2;
}

function complex_operation(int $x): int {
    $result = 0;
    for ($i = 0; $i < 10; $i++) {
        $result += $x * $i;
    }
    return $result;
}

function optimized_operation(int $x): int {
    return intval($x * 10 * 9 / 2);
}

$simpleBench = measure_time(fn() => simple_operation(100), 10000);
$complexBench = measure_time(fn() => complex_operation(100), 1000);
$optimizedBench = measure_time(fn() => optimized_operation(100), 10000);

$result = [
    'simple_elapsed' => $simpleBench['elapsed_ms'],
    'complex_elapsed' => $complexBench['elapsed_ms'],
    'optimized_elapsed' => $optimizedBench['elapsed_ms'],
    'benchmarking_active' => true,
];

echo json_encode($result);
?>
