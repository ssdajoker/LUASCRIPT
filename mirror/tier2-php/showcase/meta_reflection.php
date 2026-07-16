<?php
// MIRROR V3: Tier 2 PHP Showcase
// Category: Metaprogramming
// Module: meta_reflection.php

function reflect_object($obj) {
    return [
        'type' => gettype($obj),
        'class' => get_class($obj),
        'methods_count' => count(get_class_methods($obj)),
    ];
}

function reflect_function(callable $func) {
    if (is_array($func)) {
        return [
            'name' => $func[1],
            'class' => $func[0],
            'callable' => true,
        ];
    }
    return ['callable' => is_callable($func)];
}

function get_attributes($obj): array {
    $attrs = [];
    foreach (get_object_vars($obj) as $name => $value) {
        $attrs[$name] = gettype($value);
    }
    return $attrs;
}

class ReflectedClass {
    private $x;
    private $y;
    
    public function __construct($x, $y) {
        $this->x = $x;
        $this->y = $y;
    }
    
    public function method() {
        return "{$this->x}:{$this->y}";
    }
}

$result = [
    'reflect_int' => reflect_object(42),
    'reflect_str' => reflect_object('hello'),
    'reflect_list' => reflect_object([1, 2, 3]),
    'class_attrs' => count(get_attributes(new ReflectedClass(1, 'a'))),
];

echo json_encode($result);
?>
