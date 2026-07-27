<?php
// MIRROR V3: Tier 2 PHP Showcase
// Category: Async & Control Flow
// Module: async_promises.php

class Promise {
    private $state = 'pending';
    private $value = null;
    private $callbacks = [];
    
    public function __construct(callable $executor) {
        $executor(function($result) {
            if ($this->state === 'pending') {
                $this->state = 'fulfilled';
                $this->value = $result;
                foreach ($this->callbacks as $callback) {
                    $callback($result);
                }
            }
        });
    }
    
    public function then(callable $callback): self {
        if ($this->state === 'fulfilled') {
            $callback($this->value);
        } else {
            $this->callbacks[] = $callback;
        }
        return $this;
    }
    
    public function getValue() {
        return $this->value;
    }
    
    public function getState(): string {
        return $this->state;
    }
}

$p1 = new Promise(fn($resolve) => $resolve(42));
$p2 = new Promise(fn($resolve) => $resolve('hello'));

$result = [
    'promise_state' => $p1->getState(),
    'promise_value' => $p1->getValue(),
    'promise_2_value' => $p2->getValue(),
    'promise_created' => true,
];

echo json_encode($result);
?>
