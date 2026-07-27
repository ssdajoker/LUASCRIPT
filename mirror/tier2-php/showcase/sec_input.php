<?php
// MIRROR V3: Tier 2 PHP Showcase
// Category: Security
// Module: sec_input.php

function validate_input(string $value, array $rules): bool {
    if ($rules['min_length'] ?? false) {
        if (strlen($value) < $rules['min_length']) return false;
    }
    
    if ($rules['max_length'] ?? false) {
        if (strlen($value) > $rules['max_length']) return false;
    }
    
    if ($rules['not_empty'] ?? false) {
        if (strlen($value) === 0) return false;
    }
    
    if ($rules['alphanumeric'] ?? false) {
        if (!ctype_alnum($value)) return false;
    }
    
    return true;
}

function sanitize_input(string $value): string {
    $dangerous = ['<', '>', '"', "'", '&', ';'];
    return trim(str_replace($dangerous, '', $value));
}

function validate_email(string $email): bool {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

$result = [
    'valid_hello' => validate_input('hello', ['min_length' => 3, 'max_length' => 10]),
    'invalid_short' => validate_input('hi', ['min_length' => 3]),
    'invalid_empty' => validate_input('', ['not_empty' => true]),
    'sanitized' => sanitize_input('hello<script>'),
    'valid_email' => validate_email('user@example.com'),
    'input_validation_active' => true,
];

echo json_encode($result);
?>
