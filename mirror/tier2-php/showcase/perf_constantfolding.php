<?php
// MIRROR V3: Tier 2 PHP Showcase
// Category: Optimization
// Module: perf_constantfolding.php

const MULTIPLIER = 10;
const OFFSET = 5;
const MAX_VALUE = 1000;
const BASE_RESULT = 100;

function compute_with_constants(int $x): int {
    $result = $x * MULTIPLIER + OFFSET;
    return $result > MAX_VALUE ? MAX_VALUE : $result;
}

function optimized_constants(array $values): array {
    return array_map(function($v) {
        $opt = ($v * MULTIPLIER) + OFFSET;
        return min($opt, MAX_VALUE);
    }, $values);
}

function constant_table(): array {
    $table = [];
    for ($i = 0; $i < 10; $i++) {
        $table["value_$i"] = compute_with_constants($i);
    }
    return $table;
}

$result = [
    'const_5' => compute_with_constants(5),
    'const_50' => compute_with_constants(50),
    'const_100' => compute_with_constants(100),
    'optimized' => optimized_constants([1, 2, 3, 4, 5]),
    'table_size' => count(constant_table()),
];

echo json_encode($result);
?>
