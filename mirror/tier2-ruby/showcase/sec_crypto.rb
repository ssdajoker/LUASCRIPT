# MIRROR V3: Tier 2 Ruby Showcase
# Category: Security
# Module: sec_crypto.rb
# Purpose: Demonstrate cryptographic patterns

require 'digest'

def simple_hash(value)
  return "" unless value.is_a?(String)
  Digest::SHA256.hexdigest(value)[0..15]
end

def verify_hash(value, expected_hash)
  simple_hash(value) == expected_hash
end

def hash_password(password, salt = "default")
  combined = "#{salt}:#{password}"
  simple_hash(combined)
end

def verify_password(password, hashed, salt = "default")
  hash_password(password, salt) == hashed
end

secret = "my_secret_key"
secret_hash = simple_hash(secret)

password = "secure_password"
password_hash = hash_password(password, "user_salt")

result = {
  secret_hash: secret_hash,
  verified_secret: verify_hash(secret, secret_hash),
  verified_wrong: verify_hash("wrong", secret_hash),
  password_hashed: password_hash.length > 0,
  password_verified: verify_password(password, password_hash, "user_salt"),
  crypto_active: true,
}

puts result.inspect
