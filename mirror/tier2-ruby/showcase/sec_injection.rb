# MIRROR V3: Tier 2 Ruby Showcase
# Category: Security
# Module: sec_injection.rb
# Purpose: Demonstrate injection prevention

def escape_sql(value)
  return "" unless value.is_a?(String)
  
  value
    .gsub("'", "''")
    .gsub('"', '""')
    .gsub("\\", "\\\\")
end

def validate_query(query)
  return false unless query.is_a?(String)
  
  forbidden = ["DROP", "DELETE", "UPDATE", "INSERT", "ALTER"]
  upper_query = query.upcase
  
  forbidden.none? { |keyword| upper_query.include?(keyword) }
end

def sanitize_html(content)
  return "" unless content.is_a?(String)
  
  content
    .gsub(/<script[^>]*>.*?<\/script>/i, '')
    .gsub(/on\w+\s*=/i, '')
end

result = {
  escaped_quote: escape_sql("user's name"),
  valid_select: validate_query("SELECT * FROM users"),
  invalid_drop: validate_query("DROP TABLE users"),
  invalid_delete: validate_query("DELETE FROM data"),
  sanitized_html: sanitize_html("hello<script>alert(1)</script>"),
  injection_prevention_active: true,
}

puts result.inspect
