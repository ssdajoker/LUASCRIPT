<?php
// MIRROR V3: Tier 2 PHP Showcase
// Category: Type System
// Module: type_basics.php
// Purpose: Demonstrate PHP type system basics

function check_type($value): string {
    if ($value === null) return 'NULL';
    if (is_bool($value)) return 'boolean';
    if (is_int($value)) return 'integer';
    if (is_float($value)) return 'double';
    if (is_string($value)) return 'string';
    if (is_array($value)) return 'array';
    return 'object';
}

function is_numeric_type($value): bool {
    return is_int($value) || is_float($value);
}

function is_sequence($value): bool {
    return is_array($value) || is_string($value);
}

function combine_types($a, $b): string {
    if (is_string($a) && is_string($b)) {
        return $a . $b;
    } elseif (is_numeric_type($a) && is_numeric_type($b)) {
        return (string)($a + $b);
    }
    return 'mixed';
}

$result = [
    'type_check_int' => check_type(42),
    'type_check_str' => check_type('hello'),
    'is_numeric_int' => is_numeric_type(100),
    'is_numeric_str' => is_numeric_type('text'),
    'is_sequence_list' => is_sequence([1, 2, 3]),
    'combined_strings' => combine_types('hello', 'world'),
    'combined_numbers' => combine_types(10, 20),
];

echo json_encode($result);
?>
