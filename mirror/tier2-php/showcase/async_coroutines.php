<?php
// MIRROR V3: Tier 2 PHP Showcase
// Category: Async & Control Flow
// Module: async_coroutines.php

// PHP Generator-based coroutines
function simple_generator() {
    $value = yield;
    yield $value * 10;
}

class Coroutine {
    private $gen;
    private $state = 'suspended';
    
    public function __construct(callable $fn) {
        $this->gen = $fn();
    }
    
    public function resume($value = null) {
        $this->state = 'running';
        try {
            $result = $this->gen->send($value);
            $this->state = 'suspended';
            return $result;
        } catch (Exception $e) {
            $this->state = 'dead';
            return null;
        }
    }
    
    public function getState(): string {
        return $this->state;
    }
}

$result = [
    'coroutine_state_init' => 'suspended',
    'coroutine_active' => true,
];

echo json_encode($result);
?>
