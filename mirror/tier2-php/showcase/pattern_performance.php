<?php
// MIRROR V3: Tier 2 PHP Showcase
// Category: Pattern Matching
// Module: pattern_performance.php

function fast_match($value): string {
    $type = gettype($value);
    return match($type) {
        'integer' => 'fast_int',
        'string' => 'fast_str',
        'array' => 'fast_list',
        'object' => 'fast_obj',
        default => 'other',
    };
}

function optimized_dispatch($value, string $operation) {
    if (is_int($value)) {
        return match($operation) {
            'double' => $value * 2,
            default => null,
        };
    } elseif (is_string($value)) {
        return match($operation) {
            'upper' => strtoupper($value),
            default => null,
        };
    } elseif (is_array($value)) {
        return match($operation) {
            'length' => count($value),
            default => null,
        };
    }
    return null;
}

function batch_match(array $values) {
    $results = [];
    $typeCache = [];
    
    foreach ($values as $v) {
        $t = gettype($v);
        $typeCache[$t] = ($typeCache[$t] ?? 0) + 1;
        $results[] = fast_match($v);
    }
    
    return ['matches' => $results, 'type_counts' => $typeCache];
}

$result = [
    'fast_int' => fast_match(42),
    'fast_str' => fast_match('hello'),
    'fast_list' => fast_match([1, 2, 3]),
    'dispatch_double' => optimized_dispatch(5, 'double'),
    'dispatch_upper' => optimized_dispatch('test', 'upper'),
    'batch_count' => count(batch_match([1, 'a', 2, 'b', 3])['matches']),
];

echo json_encode($result);
?>
