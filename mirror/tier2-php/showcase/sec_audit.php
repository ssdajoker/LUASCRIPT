<?php
// MIRROR V3: Tier 2 PHP Showcase
// Category: Security
// Module: sec_audit.php

class AuditLog {
    private $entries = [];
    
    public function logEvent(string $eventType, string $details): int {
        $this->entries[] = [
            'type' => $eventType,
            'details' => $details,
            'timestamp' => date('c'),
        ];
        return count($this->entries);
    }
    
    public function getCount(): int {
        return count($this->entries);
    }
    
    public function getEventsByType(string $eventType): array {
        return array_filter($this->entries, fn($e) => $e['type'] === $eventType);
    }
}

$audit = new AuditLog();
$audit->logEvent('startup', 'system initialized');
$audit->logEvent('login', 'user authenticated');
$audit->logEvent('access', 'admin access attempted');
$audit->logEvent('warning', 'multiple failed login attempts');

function check_security($audit, $operation) {
    $audit->logEvent('security_check', $operation);
    
    if ($operation === 'admin_access') {
        $audit->logEvent('warning', 'admin access attempted');
        return false;
    }
    
    return true;
}

check_security($audit, 'read_data');
check_security($audit, 'admin_access');

$result = [
    'total_events' => $audit->getCount(),
    'startup_events' => count($audit->getEventsByType('startup')),
    'warning_events' => count($audit->getEventsByType('warning')),
    'admin_blocked' => !check_security($audit, 'admin_access'),
    'auditing_active' => true,
];

echo json_encode($result);
?>
