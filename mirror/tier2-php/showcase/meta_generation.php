<?php
// MIRROR V3: Tier 2 PHP Showcase
// Category: Metaprogramming
// Module: meta_generation.php

function generate_adder(int $n): callable {
    return fn($x) => $x + $n;
}

function generate_multiplier(int $n): callable {
    return fn($x) => $x * $n;
}

function compose_generators(callable ...$generators): callable {
    return function($x) use ($generators) {
        $result = $x;
        foreach ($generators as $gen) {
            $result = $gen($result);
        }
        return $result;
    };
}

function meta_factory(string $op, int $value): callable {
    return match($op) {
        'add' => generate_adder($value),
        'mul' => generate_multiplier($value),
        default => fn($x) => $x,
    };
}

$add10 = generate_adder(10);
$mul5 = generate_multiplier(5);
$composed = compose_generators(
    generate_adder(5),
    generate_multiplier(2)
);

$result = [
    'add_10_to_20' => $add10(20),
    'mul_5_to_10' => $mul5(10),
    'composed_30' => $composed(10),
    'factory_add' => meta_factory('add', 100)(50),
    'factory_mul' => meta_factory('mul', 3)(7),
];

echo json_encode($result);
?>
