<?php
// MIRROR V3: Tier 2 PHP Showcase
// Category: Type System
// Module: type_generics.php

class Box {
    private $item;
    
    public function __construct($item) {
        $this->item = $item;
    }
    
    public function extract() {
        return $this->item;
    }
    
    public function transform(callable $fn) {
        return new Box($fn($this->item));
    }
}

class Pair {
    private $key;
    private $value;
    
    public function __construct($key, $value) {
        $this->key = $key;
        $this->value = $value;
    }
    
    public function getKey() {
        return $this->key;
    }
    
    public function getValue() {
        return $this->value;
    }
}

$result = [
    'box_int' => (new Box(100))->extract(),
    'box_str' => (new Box('generic'))->extract(),
    'pair_ks' => (new Pair('key', 'string'))->getKey(),
    'pair_vi' => (new Pair('value', 42))->getValue(),
    'generic_active' => true,
];

echo json_encode($result);
?>
