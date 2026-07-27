<?php
// MIRROR V3: Tier 2 PHP Showcase
// Category: Metaprogramming
// Module: meta_ast.php

class ASTNode {
    public $nodeType;
    public $value;
    public $children = [];
    
    public function __construct(string $nodeType, $value = null, array $children = []) {
        $this->nodeType = $nodeType;
        $this->value = $value;
        $this->children = $children;
    }
    
    public function traverse(callable $callback) {
        $callback($this);
        foreach ($this->children as $child) {
            $child->traverse($callback);
        }
    }
}

function build_ast_tree(): ASTNode {
    $root = new ASTNode('program');
    $root->children[] = new ASTNode('function', 'add', [
        new ASTNode('param', 'x'),
        new ASTNode('param', 'y'),
    ]);
    return $root;
}

function analyze_ast(ASTNode $tree): array {
    $counts = [];
    $tree->traverse(function($node) use (&$counts) {
        $counts[$node->nodeType] = ($counts[$node->nodeType] ?? 0) + 1;
    });
    return $counts;
}

$result = [
    'ast_root_type' => 'program',
    'ast_analysis' => analyze_ast(build_ast_tree()),
    'ast_functional' => true,
];

echo json_encode($result);
?>
