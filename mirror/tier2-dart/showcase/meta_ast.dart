// MIRROR V3: Tier 2 Dart Showcase
// Category: Metaprogramming
// Module: meta_ast.dart

class ASTNode {
  final String nodeType;
  final dynamic value;
  final List<ASTNode> children;
  
  ASTNode(this.nodeType, [this.value, this.children = const []]);
  
  void traverse(Function(ASTNode) callback) {
    callback(this);
    for (final child in children) {
      child.traverse(callback);
    }
  }
}

ASTNode buildASTTree() {
  final root = ASTNode('program');
  final funcNode = ASTNode('function', 'add', [
    ASTNode('param', 'x'),
    ASTNode('param', 'y'),
  ]);
  return root;
}

Map<String, int> analyzeAST(ASTNode tree) {
  final counts = <String, int>{};
  tree.traverse((node) {
    counts[node.nodeType] = (counts[node.nodeType] ?? 0) + 1;
  });
  return counts;
}

void main() {
  final result = <String, dynamic>{
    'astRootType': 'program',
    'astAnalysis': analyzeAST(buildASTTree()),
    'astFunctional': true,
  };
  print(result);
}
