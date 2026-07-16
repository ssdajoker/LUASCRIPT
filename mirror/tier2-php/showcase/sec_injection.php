<?php
// MIRROR V3: Tier 2 PHP Showcase
// Category: Security
// Module: sec_injection.php

function escape_sql(string $value): string {
    return str_replace(
        ["'", '"', "\\"],
        ["''", '""', "\\\\"],
        $value
    );
}

function validate_query(string $query): bool {
    $forbidden = ['DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER'];
    $upperQuery = strtoupper($query);
    
    foreach ($forbidden as $keyword) {
        if (strpos($upperQuery, $keyword) !== false) {
            return false;
        }
    }
    
    return true;
}

function sanitize_html(string $content): string {
    $content = preg_replace('/<script[^>]*>.*?<\/script>/i', '', $content);
    $content = preg_replace('/on\w+\s*=/i', '', $content);
    return $content;
}

$result = [
    'escaped_quote' => escape_sql("user's name"),
    'valid_select' => validate_query('SELECT * FROM users'),
    'invalid_drop' => validate_query('DROP TABLE users'),
    'invalid_delete' => validate_query('DELETE FROM data'),
    'sanitized_html' => sanitize_html('hello<script>alert(1)</script>'),
    'injection_prevention_active' => true,
];

echo json_encode($result);
?>
