<?php
// MIRROR V3: Tier 2 PHP Showcase
// Category: IR & Determinism
// Module: ir_determinism.php

function deterministic_sort(array $arr): array {
    sort($arr);
    return $arr;
}

function deterministic_hash(array $data): string {
    $sortedData = deterministic_sort($data);
    $strData = json_encode($sortedData);
    return substr(md5($strData), 0, 16);
}

function stable_computation(array $values): array {
    $sortedVals = deterministic_sort($values);
    $hash1 = deterministic_hash($sortedVals);
    $hash2 = deterministic_hash($sortedVals);
    
    return [
        'sorted' => $sortedVals,
        'hash1' => $hash1,
        'hash2' => $hash2,
        'hashes_equal' => $hash1 === $hash2,
    ];
}

$inputData = [5, 2, 8, 1, 9];
$computation = stable_computation($inputData);

$result = [
    'sorted_data' => $computation['sorted'],
    'hash_1' => $computation['hash1'],
    'hash_2' => $computation['hash2'],
    'deterministic' => $computation['hashes_equal'],
    'computation_stable' => true,
];

echo json_encode($result);
?>
