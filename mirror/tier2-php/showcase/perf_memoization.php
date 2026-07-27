<?php
// MIRROR V3: Tier 2 PHP Showcase
// Category: Optimization
// Module: perf_memoization.php

function memoize(callable $func): callable {
    $cache = [];
    return function(...$args) use ($func, &$cache) {
        $key = json_encode($args);
        if (!isset($cache[$key])) {
            $cache[$key] = $func(...$args);
        }
        return $cache[$key];
    };
}

function expensive_computation(int $n): int {
    $result = 0;
    for ($i = 0; $i < $n; $i++) {
        $result += $i * $i;
    }
    return $result;
}

$customMemoized = memoize(function($x) {
    $total = 0;
    for ($i = 0; $i < $x; $i++) {
        $total += $i;
    }
    return $total;
});

$result = [
    'expensive_5' => expensive_computation(5),
    'expensive_10' => expensive_computation(10),
    'custom_memo_100' => $customMemoized(100),
    'custom_memo_200' => $customMemoized(200),
    'memoization_active' => true,
];

echo json_encode($result);
?>
