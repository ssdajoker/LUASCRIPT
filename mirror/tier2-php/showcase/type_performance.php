<?php
// MIRROR V3: Tier 2 PHP Showcase
// Category: Type System
// Module: type_performance.php

function fast_numeric_op($a, $b) {
    if (is_numeric($a) && is_numeric($b)) {
        return $a + $b;
    }
    return "{$a}{$b}";
}

function optimized_dispatch($value, string $operation) {
    if (is_int($value)) {
        return match($operation) {
            'double' => $value * 2,
            'square' => $value * $value,
            default => null,
        };
    } elseif (is_string($value)) {
        return match($operation) {
            'upper' => strtoupper($value),
            'len' => strlen($value),
            default => null,
        };
    }
    return null;
}

$result = [
    'fast_add' => fast_numeric_op(10, 20),
    'fast_concat' => fast_numeric_op('hello', 'world'),
    'dispatch_double' => optimized_dispatch(25, 'double'),
    'dispatch_square' => optimized_dispatch(5, 'square'),
    'dispatch_upper' => optimized_dispatch('test', 'upper'),
];

echo json_encode($result);
?>
