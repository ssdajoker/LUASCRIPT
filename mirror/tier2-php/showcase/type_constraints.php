<?php
// MIRROR V3: Tier 2 PHP Showcase
// Category: Type System
// Module: type_constraints.php

class ConstrainedValue {
    private $value;
    private $valueType;
    
    public function __construct($value, string $valueType) {
        if (gettype($value) !== $valueType) {
            throw new TypeError("Expected $valueType, got " . gettype($value));
        }
        $this->value = $value;
        $this->valueType = $valueType;
    }
    
    public function getValue() {
        return $this->value;
    }
}

class BoundedInt {
    private $value;
    private $min;
    private $max;
    
    public function __construct(int $value, int $minVal = 0, int $maxVal = 100) {
        if ($value < $minVal || $value > $maxVal) {
            throw new ValueError("Value $value outside bounds [$minVal, $maxVal]");
        }
        $this->value = $value;
        $this->min = $minVal;
        $this->max = $maxVal;
    }
    
    public function getValue(): int {
        return $this->value;
    }
}

function validate_number(int $n, int $minVal = -100, int $maxVal = 100): bool {
    return $n >= $minVal && $n <= $maxVal;
}

$result = [
    'constrained_int' => (new ConstrainedValue(42, 'integer'))->getValue(),
    'bounded_value' => (new BoundedInt(50, 0, 100))->getValue(),
    'validate_valid' => validate_number(50),
    'validate_invalid' => validate_number(200, 0, 100),
    'constraints_active' => true,
];

echo json_encode($result);
?>
