# MIRROR V3: Tier 2 Ruby Showcase
# Category: IR & Determinism
# Module: ir_canonical.rb
# Purpose: Demonstrate IR canonicalization

def canonical_form(expr)
  if expr.is_a?(Hash)
    case expr[:op]
    when "add"
      left = canonical_form(expr[:left])
      right = canonical_form(expr[:right])
      
      if left.is_a?(Numeric) && right.is_a?(Numeric)
        return left + right
      end
      
      { op: "add", left: left, right: right }
    
    when "mul"
      left = canonical_form(expr[:left])
      right = canonical_form(expr[:right])
      
      if left.is_a?(Numeric) && right.is_a?(Numeric)
        return left * right
      end
      
      { op: "mul", left: left, right: right }
    end
  end
  
  expr
end

expr1 = { op: "add", left: 2, right: 3 }
expr2 = { op: "mul", left: 4, right: 5 }
expr3 = { op: "add", left: { op: "mul", left: 2, right: 3 }, right: 4 }

result = {
  canon_add: canonical_form(expr1),
  canon_mul: canonical_form(expr2),
  canon_nested: canonical_form(expr3),
  canonicalization_active: true,
}

puts result.inspect
