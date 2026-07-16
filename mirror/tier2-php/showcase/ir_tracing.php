<?php
// MIRROR V3: Tier 2 PHP Showcase
// Category: IR & Determinism
// Module: ir_tracing.php

class IRTracer {
    private $trace = [];
    
    public function record(string $operation, array $inputs, $output) {
        $this->trace[] = [
            'op' => $operation,
            'inputs' => $inputs,
            'output' => $output,
        ];
    }
    
    public function tracedAdd(int $a, int $b): int {
        $result = $a + $b;
        $this->record('add', [$a, $b], $result);
        return $result;
    }
    
    public function tracedMul(int $a, int $b): int {
        $result = $a * $b;
        $this->record('mul', [$a, $b], $result);
        return $result;
    }
    
    public function getTrace(): array {
        return $this->trace;
    }
    
    public function getTraceLength(): int {
        return count($this->trace);
    }
}

$tracer = new IRTracer();
$r1 = $tracer->tracedAdd(10, 20);
$r2 = $tracer->tracedMul(5, 6);
$r3 = $tracer->tracedAdd($r1, $r2);
$traceLen = $tracer->getTraceLength();

$result = [
    'result_1' => $r1,
    'result_2' => $r2,
    'result_3' => $r3,
    'trace_length' => $traceLen,
    'tracing_enabled' => true,
];

echo json_encode($result);
?>
