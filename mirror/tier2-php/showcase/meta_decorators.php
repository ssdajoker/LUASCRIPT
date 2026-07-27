<?php
// MIRROR V3: Tier 2 PHP Showcase
// Category: Metaprogramming
// Module: meta_decorators.php

function timing_decorator(callable $func): callable {
    return function(...$args) use ($func) {
        $start = microtime(true);
        $result = $func(...$args);
        $elapsed = microtime(true) - $start;
        return $result;
    };
}

function memoization_decorator(callable $func): callable {
    $cache = [];
    return function(...$args) use ($func, &$cache) {
        $key = json_encode($args);
        if (!isset($cache[$key])) {
            $cache[$key] = $func(...$args);
        }
        return $cache[$key];
    };
}

function validation_decorator(callable $validator, callable $func): callable {
    return function(...$args) use ($validator, $func) {
        if (!$validator(...$args)) return null;
        return $func(...$args);
    };
}

$fibonacci = memoization_decorator(function($n) use (&$fibonacci) {
    return $n < 2 ? $n : $fibonacci($n - 1) + $fibonacci($n - 2);
});

$result = [
    'memo_fib_5' => $fibonacci(5),
    'memo_fib_10' => $fibonacci(10),
    'decorators_active' => true,
];

echo json_encode($result);
?>
