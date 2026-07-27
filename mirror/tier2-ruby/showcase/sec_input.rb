# MIRROR V3: Tier 2 Ruby Showcase
# Category: Security
# Module: sec_input.rb
# Purpose: Demonstrate input validation patterns

def validate_input(value, rules)
  return false unless value.is_a?(String)
  
  return false if rules[:min_length] && value.length < rules[:min_length]
  return false if rules[:max_length] && value.length > rules[:max_length]
  return false if rules[:not_empty] && value.empty?
  return false if rules[:alphanumeric] && !value.match?(/\A[a-zA-Z0-9]*\z/)
  
  true
end

def sanitize_input(value)
  return "" unless value.is_a?(String)
  
  dangerous = ['<', '>', '"', "'", '&', ';']
  sanitized = value
  dangerous.each { |char| sanitized = sanitized.gsub(char, '') }
  
  sanitized.strip
end

def validate_email(email)
  return false unless email.is_a?(String)
  email.include?('@') && email.include?('.')
end

result = {
  valid_hello: validate_input("hello", {min_length: 3, max_length: 10}),
  invalid_short: validate_input("hi", {min_length: 3}),
  invalid_empty: validate_input("", {not_empty: true}),
  sanitized: sanitize_input("hello<script>"),
  valid_email: validate_email("user@example.com"),
  input_validation_active: true,
}

puts result.inspect
