<?php
// MIRROR V3: Tier 2 PHP Showcase
// Category: Pattern Matching
// Module: pattern_binding.php

function destructure_tuple($data) {
    if (is_array($data) && count($data) === 3) {
        [$a, $b, $c] = $data;
        return ['first' => $a, 'second' => $b, 'third' => $c];
    }
    return null;
}

function destructure_hash($data) {
    if (is_array($data)) {
        $name = $data['name'] ?? 'unknown';
        $age = $data['age'] ?? 0;
        return ['person' => $name, 'age' => $age];
    }
    return null;
}

function destructure_list($data) {
    if (is_array($data) && count($data) >= 2) {
        $head = $data[0];
        $tail = array_slice($data, 1);
        return ['head' => $head, 'tail' => $tail];
    }
    return null;
}

function bind_and_match($obj) {
    if (is_array($obj) && isset($obj['x'], $obj['y'])) {
        $x = $obj['x'];
        $y = $obj['y'];
        return ['bound_x' => $x, 'bound_y' => $y, 'sum' => $x + $y];
    }
    return null;
}

$result = [
    'tuple_destructure' => destructure_tuple([1, 2, 3]),
    'hash_destructure' => destructure_hash(['name' => 'Alice', 'age' => 30]),
    'list_destructure' => destructure_list([10, 20, 30, 40]),
    'bind_and_match' => bind_and_match(['x' => 5, 'y' => 10]),
];

echo json_encode($result);
?>
