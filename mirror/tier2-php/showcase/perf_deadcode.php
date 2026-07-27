<?php
// MIRROR V3: Tier 2 PHP Showcase
// Category: Optimization
// Module: perf_deadcode.php

define('ENABLE_DEBUG', false);
define('ENABLE_LOGGING', false);
define('ENABLE_OPTIMIZATION', true);

function compute_with_features(int $value): int {
    $result = $value;
    
    if (ENABLE_DEBUG) {
        $result = $result + 1000;
    }
    
    if (ENABLE_OPTIMIZATION) {
        $result = $result * 2;
    }
    
    if (ENABLE_LOGGING) {
        error_log("Result: $result");
    }
    
    return $result;
}

function optimized_path(int $x): int {
    if (ENABLE_OPTIMIZATION) {
        return $x * 2;
    }
    return $x + 1;
}

function feature_branch(array $features): int {
    $result = 100;
    
    if ($features['fast'] ?? false) {
        $result = $result * 5;
    } else {
        $result = $result + 10;
    }
    
    return $result;
}

$result = [
    'optimized_50' => compute_with_features(50),
    'fast_path_100' => optimized_path(100),
    'feature_fast' => feature_branch(['fast' => true]),
    'feature_slow' => feature_branch(['fast' => false]),
    'dead_code_removed' => !ENABLE_DEBUG,
];

echo json_encode($result);
?>
