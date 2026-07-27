// MIRROR V3: Tier 2 Dart Showcase
// Category: Security
// Module: sec_crypto.dart

import 'dart:convert';
import 'package:crypto/crypto.dart';

String simpleHash(String value) {
  return sha256.convert(utf8.encode(value)).toString().substring(0, 16);
}

bool verifyHash(String value, String expectedHash) {
  return simpleHash(value) == expectedHash;
}

String hashPassword(String password, {String salt = 'default'}) {
  final combined = '$salt:$password';
  return simpleHash(combined);
}

bool verifyPassword(String password, String hashed, {String salt = 'default'}) {
  return hashPassword(password, salt: salt) == hashed;
}

void main() {
  final secret = 'my_secret_key';
  final secretHash = simpleHash(secret);
  
  final password = 'secure_password';
  final passwordHash = hashPassword(password, salt: 'user_salt');
  
  final result = <String, dynamic>{
    'secretHash': secretHash,
    'verifiedSecret': verifyHash(secret, secretHash),
    'verifiedWrong': verifyHash('wrong', secretHash),
    'passwordHashed': passwordHash.isNotEmpty,
    'passwordVerified': verifyPassword(password, passwordHash, salt: 'user_salt'),
    'cryptoActive': true,
  };
  print(result);
}
