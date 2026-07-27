<?php
// MIRROR V3: Tier 2 PHP Showcase
// Category: Optimization
// Module: perf_caching.php

class CachedFibonacci {
    private $cache = [];
    private $hits = 0;
    private $misses = 0;
    
    public function compute(int $n): int {
        if (isset($this->cache[$n])) {
            $this->hits++;
            return $this->cache[$n];
        }
        
        $this->misses++;
        $result = $n < 2 ? $n : $this->compute($n - 1) + $this->compute($n - 2);
        
        $this->cache[$n] = $result;
        return $result;
    }
    
    public function getStats(): array {
        return [
            'hits' => $this->hits,
            'misses' => $this->misses,
            'cache_size' => count($this->cache),
        ];
    }
}

$fib = new CachedFibonacci();
$fib10 = $fib->compute(10);
$fib20 = $fib->compute(20);
$stats = $fib->getStats();

$result = [
    'fib_10' => $fib10,
    'fib_20' => $fib20,
    'cache_hits' => $stats['hits'],
    'cache_misses' => $stats['misses'],
    'cache_enabled' => true,
];

echo json_encode($result);
?>
