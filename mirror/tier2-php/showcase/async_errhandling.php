<?php
// MIRROR V3: Tier 2 PHP Showcase
// Category: Async & Control Flow
// Module: async_errhandling.php

function try_catch(callable $tryFunc, callable $catchFunc = null): array {
    try {
        $result = $tryFunc();
        return [
            'success' => true,
            'value' => $result,
        ];
    } catch (Exception $e) {
        if ($catchFunc) {
            $catchFunc($e);
        }
        return [
            'success' => false,
            'error' => $e->getMessage(),
        ];
    }
}

function risky_operation(int $value): int {
    if ($value < 0) {
        throw new Exception('negative value');
    }
    return $value * 2;
}

function divide_safe(int $a, int $b): array {
    try {
        return ['result' => $a / $b, 'success' => true];
    } catch (DivisionByZeroError $e) {
        return ['result' => null, 'success' => false, 'error' => 'division by zero'];
    }
}

$result1 = try_catch(fn() => risky_operation(10));
$result2 = try_catch(fn() => risky_operation(-5));
$divideOk = divide_safe(10, 2);
$divideError = divide_safe(10, 0);

$result = [
    'success_1' => $result1['success'],
    'value_1' => $result1['value'],
    'success_2' => $result2['success'],
    'divide_ok' => $divideOk['result'],
    'divide_error_handled' => !$divideError['success'],
    'error_handling_active' => true,
];

echo json_encode($result);
?>
