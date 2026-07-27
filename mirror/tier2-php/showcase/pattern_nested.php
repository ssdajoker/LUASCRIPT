<?php
// MIRROR V3: Tier 2 PHP Showcase
// Category: Pattern Matching
// Module: pattern_nested.php

function match_nested_hash($data) {
    if (!is_array($data)) return ['found' => false];
    
    if (isset($data['user']) && is_array($data['user'])) {
        $user = $data['user'];
        if (isset($user['profile']) && is_array($user['profile'])) {
            $profile = $user['profile'];
            $name = $profile['name'] ?? 'unknown';
            return ['found' => true, 'name' => $name];
        }
    }
    return ['found' => false];
}

function match_nested_list($data) {
    if (is_array($data) && count($data) > 0) {
        $first = $data[0];
        if (is_array($first) && count($first) > 0) {
            $inner = $first[0];
            return ['outer' => $first, 'inner' => $inner];
        }
    }
    return null;
}

function traverse_structure($obj, int $depth = 0) {
    if ($depth > 3) return null;
    
    if (is_array($obj)) {
        foreach ($obj as $k => $v) {
            if (is_array($v) || is_object($v)) {
                traverse_structure($v, $depth + 1);
            }
        }
        return 'traversed_array';
    }
    return null;
}

$result = [
    'nested_hash_found' => match_nested_hash(['user' => ['profile' => ['name' => 'Alice']]]),
    'nested_hash_notfound' => match_nested_hash(['data' => 'simple']),
    'nested_list' => match_nested_list([[1, 2, 3], 4, 5]),
    'traversed' => traverse_structure(['a' => ['b' => ['c' => 1]]]),
];

echo json_encode($result);
?>
