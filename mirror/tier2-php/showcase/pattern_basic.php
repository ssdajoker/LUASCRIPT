<?php
// MIRROR V3: Tier 2 PHP Showcase
// Category: Pattern Matching
// Module: pattern_basic.php

function match_type($value): string {
    return match(gettype($value)) {
        'integer' => 'integer',
        'string' => 'string',
        'array' => 'list',
        'object' => 'object',
        default => 'unknown',
    };
}

function match_value(int $value): string {
    if ($value === 0) return 'zero';
    if ($value > 0) return 'positive';
    return 'negative';
}

function match_pattern($obj): string {
    if (!is_array($obj)) return 'not_array';
    
    if (isset($obj['name'], $obj['age'])) {
        return 'person';
    } elseif (isset($obj['x'], $obj['y'])) {
        return 'point';
    }
    return 'generic';
}

$result = [
    'type_int' => match_type(42),
    'type_str' => match_type('hello'),
    'type_list' => match_type([1, 2, 3]),
    'value_zero' => match_value(0),
    'value_pos' => match_value(10),
    'pattern_person' => match_pattern(['name' => 'Alice', 'age' => 30]),
    'pattern_point' => match_pattern(['x' => 1, 'y' => 2]),
];

echo json_encode($result);
?>
