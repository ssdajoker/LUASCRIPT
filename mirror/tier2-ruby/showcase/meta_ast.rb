# MIRROR V3: Tier 2 Ruby Showcase
# Category: Metaprogramming
# Module: meta_ast.rb
# Purpose: Demonstrate AST-like patterns

class ASTNode
  attr_accessor :node_type, :value, :children
  
  def initialize(node_type, value = nil, children = [])
    @node_type = node_type
    @value = value
    @children = children
  end
  
  def traverse(&block)
    block.call(self)
    @children.each { |child| child.traverse(&block) }
  end
end

def build_ast_tree
  root = ASTNode.new("program")
  root.children << ASTNode.new("function", "add", [
    ASTNode.new("param", "x"),
    ASTNode.new("param", "y"),
  ])
  root
end

def analyze_ast(tree)
  counts = {}
  tree.traverse do |node|
    counts[node.node_type] ||= 0
    counts[node.node_type] += 1
  end
  counts
end

result = {
  ast_root_type: "program",
  ast_analysis: analyze_ast(build_ast_tree()),
  ast_functional: true,
}

puts result.inspect
