/**
 * Lightweight parser that produces Ternary AST nodes with support for if/else.
 */

import { Tokenizer, type Token, type TokenType } from './tokenizer';
import type { TernaryASTNode, NodeSemanticInfo, SourceRange } from '../agents/resolver-agent';
import type { InferredType } from '../core/symbol-table';

interface NodeBuild {
  node: TernaryASTNode;
  start: Token;
  end: Token;
}

export class SimpleParser {
  private tokens: Token[] = [];
  private current = 0;

  constructor(private readonly source: string) {}

  public parseProgram(): TernaryASTNode {
    this.tokens = new Tokenizer(this.source).tokenize();
    this.current = 0;

    const statements: TernaryASTNode[] = [];
    const startToken = this.peek();

    while (!this.isAtEnd()) {
      const stmt = this.parseStatement();
      if (stmt) {
        statements.push(stmt.node);
      }
    }

  const endToken = this.previous();
  return this.buildNode('Program', startToken, endToken, { children: statements }).node;
  }

  private parseStatement(): NodeBuild | null {
    if (this.match('LET', 'CONST', 'VAR')) {
      return this.parseVariableDeclaration(this.previous());
    }

    if (this.match('IF')) {
      return this.parseIfStatement(this.previous());
    }

    if (this.match('LBRACE')) {
      return this.parseBlockStatement(this.previous());
    }

    if (this.check('EOF')) {
      return null;
    }

    const expression = this.parseExpression();
    const semicolon = this.consume('SEMICOLON', 'Expected ";" after expression');
    return this.buildNode('ExpressionStatement', expression.start, semicolon, {
      children: [expression.node],
    });
  }

  private parseVariableDeclaration(kindToken: Token): NodeBuild {
    const identifierToken = this.consume('IDENTIFIER', 'Expected variable name');
    const idNode = this.buildIdentifier(identifierToken);

    let initializer: NodeBuild | null = null;
    if (this.match('ASSIGN')) {
      initializer = this.parseExpression();
    }

    const semicolon = this.consume('SEMICOLON', 'Expected ";" after variable declaration');

    const semantic: NodeSemanticInfo = {
      symbolName: identifierToken.lexeme,
      inferredType: initializer ? this.inferType(initializer.node) : 'unknown',
    };

    const children = [idNode.node];
    if (initializer) {
      children.push(initializer.node);
    }

    return this.buildNode('VariableDeclaration', kindToken, semicolon, {
      children,
      semantic,
    });
  }

  private parseIfStatement(ifToken: Token): NodeBuild {
    this.consume('LPAREN', 'Expected "(" after "if"');
    const test = this.parseExpression();
    this.consume('RPAREN', 'Expected ")" after condition');

    const consequent = this.parseStatement();
    let alternate: NodeBuild | null = null;

    if (this.match('ELSE')) {
      alternate = this.parseStatement();
    }

    const children: TernaryASTNode[] = [test.node, consequent?.node].filter(Boolean) as TernaryASTNode[];
    const endToken = alternate ? alternate.end : consequent?.end ?? test.end;

    if (alternate) {
      children.push(alternate.node);
    }

    return this.buildNode('IfStatement', ifToken, endToken, {
      children,
    });
  }

  private parseBlockStatement(lbrace: Token): NodeBuild {
    const statements: TernaryASTNode[] = [];

    while (!this.check('RBRACE') && !this.isAtEnd()) {
      const stmt = this.parseStatement();
      if (stmt) {
        statements.push(stmt.node);
      }
    }

    const rbrace = this.consume('RBRACE', 'Expected "}" to close block');
    return this.buildNode('BlockStatement', lbrace, rbrace, { children: statements });
  }

  private parseExpression(): NodeBuild {
    return this.parseAssignment();
  }

  private parseAssignment(): NodeBuild {
    const left = this.parseComparison();

    if (this.match('ASSIGN')) {
      const equals = this.previous();
      const value = this.parseAssignment();

      if (left.node.type !== 'Identifier') {
        throw new Error(`Invalid assignment target at line ${equals.line}`);
      }

      const semantic: NodeSemanticInfo = {
        symbolName: left.node.semantic?.symbolName ?? left.node.source_text,
        inferredType: this.inferType(value.node),
      };

      return this.buildNode('AssignmentExpression', left.start, value.end, {
        children: [left.node, value.node],
        semantic,
      });
    }

    return left;
  }

  private parseComparison(): NodeBuild {
    let expr = this.parseTerm();

    while (this.matchOperator('>', '<')) {
      const operator = this.previous();
      const right = this.parseTerm();
      expr = this.buildNode('BinaryExpression', expr.start, right.end, {
        children: [expr.node, right.node],
        semantic: { symbolName: operator.lexeme },
      });
    }

    return expr;
  }

  private parseTerm(): NodeBuild {
    let expr = this.parseFactor();

    while (this.matchOperator('+', '-')) {
      const operator = this.previous();
      const right = this.parseFactor();
      expr = this.buildNode('BinaryExpression', expr.start, right.end, {
        children: [expr.node, right.node],
        semantic: { symbolName: operator.lexeme },
      });
    }

    return expr;
  }

  private parseFactor(): NodeBuild {
    let expr = this.parsePrimary();

    while (this.matchOperator('*', '/')) {
      const operator = this.previous();
      const right = this.parsePrimary();
      expr = this.buildNode('BinaryExpression', expr.start, right.end, {
        children: [expr.node, right.node],
        semantic: { symbolName: operator.lexeme },
      });
    }

    return expr;
  }

  private parsePrimary(): NodeBuild {
    if (this.match('NUMBER')) {
      const token = this.previous();
      return this.buildNode('Literal', token, token, {
        semantic: { inferredType: 'number' },
        sourceOverride: token.lexeme,
      });
    }

    if (this.match('STRING')) {
      const token = this.previous();
      return this.buildNode('Literal', token, token, {
        semantic: { inferredType: 'string' },
        sourceOverride: token.lexeme,
      });
    }

    if (this.match('BOOLEAN')) {
      const token = this.previous();
      return this.buildNode('Literal', token, token, {
        semantic: { inferredType: 'boolean' },
        sourceOverride: token.lexeme,
      });
    }

    if (this.match('IDENTIFIER')) {
      const token = this.previous();
      return this.buildIdentifier(token);
    }

    if (this.match('LPAREN')) {
      const start = this.previous();
      const expr = this.parseExpression();
      const end = this.consume('RPAREN', 'Expected ")" after expression');
      return this.buildNode('ParenthesizedExpression', start, end, {
        children: [expr.node],
      });
    }

    throw new Error(`Unexpected token ${this.peek().type} at line ${this.peek().line}`);
  }

  private buildIdentifier(token: Token): NodeBuild {
    return this.buildNode('Identifier', token, token, {
      semantic: { symbolName: token.lexeme },
      sourceOverride: token.lexeme,
    });
  }

  private inferType(node: TernaryASTNode): InferredType {
    switch (node.semantic?.inferredType) {
      case 'number':
      case 'string':
      case 'boolean':
        return node.semantic.inferredType;
      default:
        if (node.type === 'Literal') {
          if (/^\d/.test(node.source_text)) return 'number';
          if (node.source_text === 'true' || node.source_text === 'false') return 'boolean';
          return 'string';
        }
        return 'unknown';
    }
  }

  private buildNode(
    type: string,
    start: Token,
    end: Token,
    options: {
      children?: TernaryASTNode[];
      semantic?: NodeSemanticInfo;
      state?: number;
      sourceOverride?: string;
    } = {}
  ): NodeBuild {
    const children = options.children ?? [];
    const node: TernaryASTNode = {
      type,
      state: options.state ?? 1,
      source_text: options.sourceOverride ?? this.source.slice(start.start, end.end),
      potential_interpretations: [],
      children,
      semantic: options.semantic,
      range: this.buildRange(start, end),
    };

    return { node, start, end };
  }

  private buildRange(start: Token, end: Token): SourceRange {
    return {
      start: { line: Math.max(0, start.line - 1), column: Math.max(0, start.column - 1) },
      end: { line: Math.max(0, end.endLine - 1), column: Math.max(0, end.endColumn - 1) },
    };
  }

  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private matchOperator(...operators: string[]): boolean {
    if (this.check('OPERATOR') && operators.includes(this.peek().lexeme)) {
      this.advance();
      return true;
    }
    return false;
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) {
      return this.advance();
    }
    const token = this.peek();
    throw new Error(`${message}. Found ${token.type} at line ${token.line}`);
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private advance(): Token {
    if (!this.isAtEnd()) {
      this.current++;
    }
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.peek().type === 'EOF';
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private previous(): Token {
    return this.tokens[this.current - 1] ?? this.tokens[0];
  }
}
