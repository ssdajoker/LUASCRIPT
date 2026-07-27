<?php
// MIRROR V3: Tier 2 PHP Showcase
// Category: Pattern Matching
// Module: pattern_guards.php

function match_with_guard($value): string {
    if (is_int($value)) {
        if ($value > 100) return 'large_int';
        if ($value > 0) return 'small_int';
        return 'non_positive';
    } elseif (is_string($value)) {
        if (strlen($value) > 10) return 'long_string';
        return 'short_string';
    }
    return 'other';
}

function guard_check(int $n, bool $condition): int {
    if ($n > 0 && $condition) return $n * 2;
    if ($n > 0) return $n;
    return 0;
}

function filtered_match(array $items, callable $predicate): array {
    return array_filter($items, $predicate);
}

$result = [
    'guard_large' => match_with_guard(150),
    'guard_small' => match_with_guard(50),
    'guard_string_long' => match_with_guard('this is a very long string'),
    'guard_string_short' => match_with_guard('short'),
    'guard_check_true' => guard_check(10, true),
    'guard_check_false' => guard_check(10, false),
    'filtered_evens' => filtered_match([1, 2, 3, 4, 5], fn($x) => $x % 2 === 0),
];

echo json_encode($result);
?>
