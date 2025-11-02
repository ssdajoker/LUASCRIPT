/**
 * Simple tokenizer for the LUASCRIPT TypeScript pipeline.
 */

export type TokenType =
  | 'LET'
  | 'CONST'
  | 'VAR'
  | 'IF'
  | 'ELSE'
  | 'IDENTIFIER'
  | 'NUMBER'
  | 'STRING'
  | 'BOOLEAN'
  | 'LPAREN'
  | 'RPAREN'
  | 'LBRACE'
  | 'RBRACE'
  | 'SEMICOLON'
  | 'ASSIGN'
  | 'OPERATOR'
  | 'COMMA'
  | 'EOF';

export interface Token {
  type: TokenType;
  lexeme: string;
  literal?: string | number | boolean;
  line: number;
  column: number;
  endLine: number;
  endColumn: number;
  start: number;
  end: number;
}

const KEYWORDS: Record<string, TokenType> = {
  let: 'LET',
  const: 'CONST',
  var: 'VAR',
  if: 'IF',
  else: 'ELSE',
  true: 'BOOLEAN',
  false: 'BOOLEAN',
};

export class Tokenizer {
  private position = 0;
  private line = 1;
  private column = 1;
  private tokens: Token[] = [];

  constructor(private readonly source: string) {}

  public tokenize(): Token[] {
    while (!this.isAtEnd()) {
      this.skipWhitespace();
      if (this.isAtEnd()) break;

      const start = this.position;
      const startLine = this.line;
      const startColumn = this.column;
      const char = this.peek();

      if (this.isAlpha(char)) {
        this.tokenizeIdentifier(start, startLine, startColumn);
      } else if (this.isDigit(char)) {
        this.tokenizeNumber(start, startLine, startColumn);
      } else if (char === '"' || char === '\'') {
        this.tokenizeString(char, start, startLine, startColumn);
      } else {
        this.tokenizeSymbol(start, startLine, startColumn);
      }
    }

    this.tokens.push({
      type: 'EOF',
      lexeme: '',
      line: this.line,
      column: this.column,
      endLine: this.line,
      endColumn: this.column,
      start: this.position,
      end: this.position,
    });

    return this.tokens;
  }

  private tokenizeIdentifier(start: number, line: number, column: number): void {
    while (!this.isAtEnd() && this.isAlphaNumeric(this.peek())) {
      this.advance();
    }

    const lexeme = this.source.slice(start, this.position);
    const type = KEYWORDS[lexeme] ?? 'IDENTIFIER';
    const literal = type === 'BOOLEAN' ? lexeme === 'true' : undefined;

    this.tokens.push({
      type,
      lexeme,
      literal,
      line,
      column,
      endLine: this.line,
      endColumn: this.column,
      start,
      end: this.position,
    });
  }

  private tokenizeNumber(start: number, line: number, column: number): void {
    while (!this.isAtEnd() && this.isDigit(this.peek())) {
      this.advance();
    }

    if (!this.isAtEnd() && this.peek() === '.' && this.isDigit(this.peekNext())) {
      this.advance();
      while (!this.isAtEnd() && this.isDigit(this.peek())) {
        this.advance();
      }
    }

    const lexeme = this.source.slice(start, this.position);
    this.tokens.push({
      type: 'NUMBER',
      lexeme,
      literal: Number(lexeme),
      line,
      column,
      endLine: this.line,
      endColumn: this.column,
      start,
      end: this.position,
    });
  }

  private tokenizeString(quote: string, start: number, line: number, column: number): void {
    this.advance(); // consume opening quote
    let value = '';

    while (!this.isAtEnd() && this.peek() !== quote) {
      if (this.peek() === '\\' && this.peekNext()) {
        value += this.peek();
        this.advance();
      }
      value += this.peek();
      this.advance();
    }

    if (this.isAtEnd()) {
      throw new Error(`Unterminated string at line ${line}`);
    }

    this.advance(); // closing quote

    this.tokens.push({
      type: 'STRING',
      lexeme: value,
      literal: value,
      line,
      column,
      endLine: this.line,
      endColumn: this.column,
      start,
      end: this.position,
    });
  }

  private tokenizeSymbol(start: number, line: number, column: number): void {
    const char = this.advance();
    let type: TokenType | null = null;
    let lexeme = char;

    switch (char) {
      case '(':
        type = 'LPAREN';
        break;
      case ')':
        type = 'RPAREN';
        break;
      case '{':
        type = 'LBRACE';
        break;
      case '}':
        type = 'RBRACE';
        break;
      case ';':
        type = 'SEMICOLON';
        break;
      case ',':
        type = 'COMMA';
        break;
      case '=':
        type = 'ASSIGN';
        break;
      case '>':
      case '<':
      case '+':
      case '-':
      case '*':
      case '/':
        type = 'OPERATOR';
        break;
      default:
        throw new Error(`Unexpected character '${char}' at line ${line}, column ${column}`);
    }

    this.tokens.push({
      type,
      lexeme,
      line,
      column,
      endLine: this.line,
      endColumn: this.column,
      start,
      end: this.position,
    });
  }

  private skipWhitespace(): void {
    while (!this.isAtEnd()) {
      const char = this.peek();
      if (char === ' ' || char === '\t' || char === '\r') {
        this.advance();
      } else if (char === '\n') {
        this.advance();
        this.line++;
        this.column = 1;
      } else {
        break;
      }
    }
  }

  private advance(): string {
    const char = this.source[this.position];
    this.position++;
    this.column++;
    return char;
  }

  private peek(): string {
    return this.source[this.position];
  }

  private peekNext(): string {
    return this.source[this.position + 1];
  }

  private isAtEnd(): boolean {
    return this.position >= this.source.length;
  }

  private isAlpha(char: string): boolean {
    return /[a-zA-Z_]/.test(char);
  }

  private isDigit(char: string): boolean {
    return /[0-9]/.test(char);
  }

  private isAlphaNumeric(char: string): boolean {
    return this.isAlpha(char) || this.isDigit(char);
  }
}
