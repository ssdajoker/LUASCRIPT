<?php
// MIRROR V3: Tier 2 PHP Showcase
// Category: Security
// Module: sec_crypto.php

function simple_hash(string $value): string {
    return substr(hash('sha256', $value), 0, 16);
}

function verify_hash(string $value, string $expectedHash): bool {
    return simple_hash($value) === $expectedHash;
}

function hash_password(string $password, string $salt = 'default'): string {
    $combined = "$salt:$password";
    return simple_hash($combined);
}

function verify_password(string $password, string $hashed, string $salt = 'default'): bool {
    return hash_password($password, $salt) === $hashed;
}

$secret = 'my_secret_key';
$secretHash = simple_hash($secret);

$password = 'secure_password';
$passwordHash = hash_password($password, 'user_salt');

$result = [
    'secret_hash' => $secretHash,
    'verified_secret' => verify_hash($secret, $secretHash),
    'verified_wrong' => verify_hash('wrong', $secretHash),
    'password_hashed' => strlen($passwordHash) > 0,
    'password_verified' => verify_password($password, $passwordHash, 'user_salt'),
    'crypto_active' => true,
];

echo json_encode($result);
?>
