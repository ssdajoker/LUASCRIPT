<?php
// MIRROR V3: Tier 2 PHP Showcase
// Category: Type System
// Module: type_advanced.php

class GenericContainer {
    private $value;
    
    public function __construct($value) {
        $this->value = $value;
    }
    
    public function getValue() {
        return $this->value;
    }
    
    public function map(callable $func) {
        return new GenericContainer($func($this->value));
    }
}

function create_int_container(): GenericContainer {
    return new GenericContainer(42);
}

function create_str_container(): GenericContainer {
    return new GenericContainer('typed');
}

$result = [
    'int_container' => create_int_container()->getValue(),
    'str_container' => create_str_container()->getValue(),
    'mapped_value' => create_int_container()->map(fn($x) => $x * 2)->getValue(),
    'generic_demo' => true,
];

echo json_encode($result);
?>
