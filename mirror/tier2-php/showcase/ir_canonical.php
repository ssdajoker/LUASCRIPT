<?php
// MIRROR V3: Tier 2 PHP Showcase
// Category: IR & Determinism
// Module: ir_canonical.php

function canonical_form($expr) {
    if (is_array($expr)) {
        if (($expr['op'] ?? null) === 'add') {
            $left = canonical_form($expr['left']);
            $right = canonical_form($expr['right']);
            
            if (is_numeric($left) && is_numeric($right)) {
                return $left + $right;
            }
            
            return ['op' => 'add', 'left' => $left, 'right' => $right];
        } elseif (($expr['op'] ?? null) === 'mul') {
            $left = canonical_form($expr['left']);
            $right = canonical_form($expr['right']);
            
            if (is_numeric($left) && is_numeric($right)) {
                return $left * $right;
            }
            
            return ['op' => 'mul', 'left' => $left, 'right' => $right];
        }
    }
    
    return $expr;
}

$expr1 = ['op' => 'add', 'left' => 2, 'right' => 3];
$expr2 = ['op' => 'mul', 'left' => 4, 'right' => 5];
$expr3 = ['op' => 'add', 'left' => ['op' => 'mul', 'left' => 2, 'right' => 3], 'right' => 4];

$result = [
    'canon_add' => canonical_form($expr1),
    'canon_mul' => canonical_form($expr2),
    'canon_nested' => canonical_form($expr3),
    'canonicalization_active' => true,
];

echo json_encode($result);
?>
