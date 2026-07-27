<?php
// MIRROR V3: Tier 2 PHP Showcase
// Category: Async & Control Flow
// Module: async_parallel.php

function execute_parallel(array $tasks): array {
    $results = [];
    foreach ($tasks as $task) {
        $results[] = $task();
    }
    return $results;
}

function create_task(int $value, int $multiplier): callable {
    return fn() => $value * $multiplier;
}

function batch_execute(array $items): array {
    $tasks = array_map(fn($x) => create_task($x, 2), $items);
    $results = execute_parallel($tasks);
    return [
        'items' => $items,
        'results' => $results,
        'count' => count($results),
    ];
}

$tasks = [
    create_task(10, 2),
    create_task(20, 3),
    create_task(30, 4),
];

$results = execute_parallel($tasks);
$batchResults = batch_execute([5, 10, 15]);

$result = [
    'task_results' => $results,
    'result_1' => $results[0],
    'result_2' => $results[1],
    'result_3' => $results[2],
    'batch_count' => $batchResults['count'],
    'parallel_active' => true,
];

echo json_encode($result);
?>
