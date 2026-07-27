// MIRROR V3: Tier 2 Dart Showcase
// Category: IR & Determinism
// Module: ir_canonical.dart

dynamic canonicalForm(dynamic expr) {
  if (expr is Map) {
    if (expr['op'] == 'add') {
      final left = canonicalForm(expr['left']);
      final right = canonicalForm(expr['right']);
      
      if (left is num && right is num) {
        return left + right;
      }
      
      return {'op': 'add', 'left': left, 'right': right};
    } else if (expr['op'] == 'mul') {
      final left = canonicalForm(expr['left']);
      final right = canonicalForm(expr['right']);
      
      if (left is num && right is num) {
        return left * right;
      }
      
      return {'op': 'mul', 'left': left, 'right': right};
    }
  }
  
  return expr;
}

void main() {
  final expr1 = {'op': 'add', 'left': 2, 'right': 3};
  final expr2 = {'op': 'mul', 'left': 4, 'right': 5};
  final expr3 = {
    'op': 'add',
    'left': {'op': 'mul', 'left': 2, 'right': 3},
    'right': 4,
  };
  
  final result = <String, dynamic>{
    'canonAdd': canonicalForm(expr1),
    'canonMul': canonicalForm(expr2),
    'canonNested': canonicalForm(expr3),
    'canonicalizationActive': true,
  };
  print(result);
}
