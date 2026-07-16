<?php
// MIRROR V3: Tier 2 PHP Showcase
// Category: Pattern Matching
// Module: pattern_exhaustive.php

function exhaustive_match($value): string {
    if ($value === null) return 'nil';
    if (is_bool($value)) return 'boolean';
    if (is_int($value)) return 'integer';
    if (is_float($value)) return 'float';
    if (is_string($value)) return 'string';
    if (is_array($value)) return 'array';
    if (is_object($value)) return 'object';
    if (is_callable($value)) return 'function';
    return 'unknown';
}

function handle_all_types($value) {
    return match(exhaustive_match($value)) {
        'integer' => $value * 2,
        'string' => strtoupper($value),
        'array' => count($value),
        'object' => get_object_vars($value),
        'function' => 'callable',
        default => null,
    };
}

$result = [
    'type_nil' => exhaustive_match(null),
    'type_bool' => exhaustive_match(true),
    'type_int' => exhaustive_match(42),
    'type_float' => exhaustive_match(3.14),
    'type_str' => exhaustive_match('hello'),
    'type_list' => exhaustive_match([1, 2, 3]),
    'type_object' => exhaustive_match((object)['a' => 1]),
    'handle_int' => handle_all_types(10),
    'handle_str' => handle_all_types('test'),
];

echo json_encode($result);
?>
