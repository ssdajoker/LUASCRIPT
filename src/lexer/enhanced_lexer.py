#!/usr/bin/env python3
"""
LUASCRIPT Enhanced Lexer
Fixes critical issues identified in comprehensive audit:
- Mathematical Unicode operator support (π, ℯ, ×, →, ∑, ∫, etc.)
- Proper template string interpolation with ${} expressions
- Performance optimizations and error reporting

Author: Steve Jobs + Donald Knuth Leadership Team
Priority: CRITICAL - Foundation for mathematical programming revolution
"""

import re
import unicodedata
from enum import Enum, auto
from dataclasses import dataclass
from typing import List, Optional, Iterator, Dict, Set

class TokenType(Enum):
    # Literals
    NUMBER = auto()
    STRING = auto()
    TEMPLATE_STRING = auto()
    TEMPLATE_START = auto()
    TEMPLATE_MIDDLE = auto() 
    TEMPLATE_END = auto()
    TEMPLATE_EXPRESSION = auto()
    BOOLEAN = auto()
    NULL = auto()
    UNDEFINED = auto()
    
    # Mathematical Constants (Unicode Support)
    MATH_PI = auto()           # π
    MATH_E = auto()            # ℯ
    MATH_PHI = auto()          # φ (golden ratio)  
    MATH_INFINITY = auto()     # ∞
    MATH_SQRT2 = auto()        # √2
    MATH_SQRT3 = auto()        # √3
    
    # Mathematical Operators (Unicode)
    MULTIPLY_UNICODE = auto()   # ×
    DIVIDE_UNICODE = auto()     # ÷
    MINUS_UNICODE = auto()      # −  
    PLUS_MINUS = auto()         # ±
    SQRT = auto()               # √
    ARROW_RIGHT = auto()        # →
    ARROW_LEFT = auto()         # ←
    ARROW_DOUBLE = auto()       # ⇒
    ARROW_LEFT_RIGHT = auto()   # ↔
    
    # Mathematical Functions (Unicode)
    SUMMATION = auto()          # ∑
    PRODUCT = auto()           # ∏
    INTEGRAL = auto()          # ∫
    PARTIAL = auto()           # ∂
    NABLA = auto()             # ∇
    DELTA = auto()             # Δ
    
    # Function Composition (Unicode)
    COMPOSITION = auto()       # ∘ (ring operator)
    BINARY_COMPOSITION = auto() # ⊙ (odot operator)
    LAMBDA = auto()            # λ (lambda)
    
    # Set Theory & Logic (Unicode)
    ELEMENT_OF = auto()        # ∈
    NOT_ELEMENT_OF = auto()    # ∉
    SUBSET = auto()            # ⊂
    SUPERSET = auto()          # ⊃
    UNION = auto()             # ∪
    INTERSECTION = auto()      # ∩
    EMPTY_SET = auto()         # ∅
    
    # Comparison (Unicode)
    LESS_EQUAL_UNICODE = auto()    # ≤
    GREATER_EQUAL_UNICODE = auto() # ≥
    NOT_EQUAL_UNICODE = auto()     # ≠
    APPROXIMATELY = auto()         # ≈
    PROPORTIONAL = auto()         # ∝
    
    # Mathematical Superscripts & Subscripts
    SUPERSCRIPT_NUMBER = auto()    # ⁰¹²³⁴⁵⁶⁷⁸⁹
    SUBSCRIPT_NUMBER = auto()      # ₀₁₂₃₄₅₆₇₈₉
    
    # Identifiers
    IDENTIFIER = auto()
    
    # Keywords - Core JavaScript
    LET = auto()
    CONST = auto()
    VAR = auto()
    FUNCTION = auto()
    CLASS = auto()
    STRUCT = auto()
    IF = auto()
    ELSE = auto()
    FOR = auto()
    WHILE = auto()
    DO = auto()
    BREAK = auto()
    CONTINUE = auto()
    RETURN = auto()
    TRY = auto()
    CATCH = auto()
    FINALLY = auto()
    THROW = auto()
    NEW = auto()
    THIS = auto()
    EXTENDS = auto()
    STATIC = auto()
    TRUE = auto()
    FALSE = auto()
    OF = auto()
    IN = auto()
    INSTANCEOF = auto()
    TYPEOF = auto()
    VOID = auto()
    DELETE = auto()
    ASYNC = auto()
    AWAIT = auto()
    YIELD = auto()
    IMPORT = auto()
    EXPORT = auto()
    FROM = auto()
    DEFAULT = auto()
    AS = auto()
    
    # Keywords - LUASCRIPT Mathematical Extensions
    NEURAL = auto()
    TENSOR = auto()
    SIMD = auto()
    PARALLEL = auto()
    FAST = auto()
    CPU_FRIENDLY = auto()
    MATCH = auto()
    WHEN = auto()
    
    # Types
    INT8 = auto()
    INT16 = auto()
    INT32 = auto()
    INT64 = auto()
    UINT8 = auto()
    UINT16 = auto()
    UINT32 = auto()
    UINT64 = auto()
    FLOAT32 = auto()
    FLOAT64 = auto()
    REAL = auto()
    COMPLEX = auto()
    
    # Operators (ASCII)
    PLUS = auto()
    MINUS = auto()
    MULTIPLY = auto()
    DIVIDE = auto()
    MODULO = auto()
    POWER = auto()
    
    # Assignment
    ASSIGN = auto()
    PLUS_ASSIGN = auto()
    MINUS_ASSIGN = auto()
    MULTIPLY_ASSIGN = auto()
    DIVIDE_ASSIGN = auto()
    
    # Comparison
    EQUAL = auto()
    NOT_EQUAL = auto()
    STRICT_EQUAL = auto()
    STRICT_NOT_EQUAL = auto()
    LESS = auto()
    LESS_EQUAL = auto()
    GREATER = auto()
    GREATER_EQUAL = auto()
    
    # Logical
    AND = auto()
    OR = auto()
    NOT = auto()
    LOGICAL_AND = auto()
    LOGICAL_OR = auto()
    
    # Increment/Decrement
    INCREMENT = auto()
    DECREMENT = auto()
    
    # Arrow Function
    ARROW = auto()
    
    # Spread/Rest
    DOT_DOT_DOT = auto()
    
    # Pipeline Operators
    PIPELINE = auto()           # |>
    REVERSE_PIPELINE = auto()   # <|
    PIPE = auto()               # | (for pattern matching)
    
    # Range Operators  
    RANGE_INCLUSIVE = auto()    # ..
    RANGE_EXCLUSIVE = auto()    # ...
    
    # Punctuation
    SEMICOLON = auto()
    COMMA = auto()
    DOT = auto()
    COLON = auto()
    QUESTION = auto()
    EXCLAMATION = auto()
    
    # Brackets
    LEFT_PAREN = auto()
    RIGHT_PAREN = auto()
    LEFT_BRACE = auto()
    RIGHT_BRACE = auto()
    LEFT_BRACKET = auto()
    RIGHT_BRACKET = auto()
    
    # Special
    EOF = auto()
    NEWLINE = auto()

@dataclass
class Token:
    type: TokenType
    value: str
    line: int
    column: int
    unicode_name: Optional[str] = None  # For mathematical Unicode symbols

class LexerError(Exception):
    def __init__(self, message: str, line: int, column: int, context: str = ""):
        self.message = message
        self.line = line
        self.column = column
        self.context = context
        super().__init__(f"Lexer Error at line {line}, column {column}: {message}")

class EnhancedLexer:
    """
    LUASCRIPT Enhanced Lexer - Mathematical Unicode Support + Template String Fix
    
    Addresses critical audit findings:
    1. Mathematical Unicode operators (π, ℯ, ×, →, ∑, ∫)
    2. Proper template string interpolation ${expressions}
    3. Helpful error messages with context
    4. Performance optimization for mathematical parsing
    """
    
    # Mathematical Unicode mappings
    MATHEMATICAL_CONSTANTS = {
        'π': (TokenType.MATH_PI, 'pi'),
        'ℯ': (TokenType.MATH_E, 'e'),
        'φ': (TokenType.MATH_PHI, 'phi'),
        '∞': (TokenType.MATH_INFINITY, 'infinity'),
    }
    
    MATHEMATICAL_OPERATORS = {
        '×': (TokenType.MULTIPLY_UNICODE, 'times'),
        '÷': (TokenType.DIVIDE_UNICODE, 'divide'),
        '−': (TokenType.MINUS_UNICODE, 'minus'),
        '±': (TokenType.PLUS_MINUS, 'plus_minus'),
        '√': (TokenType.SQRT, 'square_root'),
        '→': (TokenType.ARROW_RIGHT, 'arrow_right'),
        '←': (TokenType.ARROW_LEFT, 'arrow_left'),
        '⇒': (TokenType.ARROW_DOUBLE, 'arrow_double'),
        '↔': (TokenType.ARROW_LEFT_RIGHT, 'arrow_bidirectional'),
        '≤': (TokenType.LESS_EQUAL_UNICODE, 'less_equal'),
        '≥': (TokenType.GREATER_EQUAL_UNICODE, 'greater_equal'),
        '≠': (TokenType.NOT_EQUAL_UNICODE, 'not_equal'),
        '≈': (TokenType.APPROXIMATELY, 'approximately'),
        '∝': (TokenType.PROPORTIONAL, 'proportional'),
        '∈': (TokenType.ELEMENT_OF, 'element_of'),
        '∉': (TokenType.NOT_ELEMENT_OF, 'not_element_of'),
        '⊂': (TokenType.SUBSET, 'subset'),
        '⊃': (TokenType.SUPERSET, 'superset'),
        '∪': (TokenType.UNION, 'union'),
        '∘': (TokenType.COMPOSITION, 'composition'),
        '⊙': (TokenType.BINARY_COMPOSITION, 'binary_composition'),
        'λ': (TokenType.LAMBDA, 'lambda'),
        '∩': (TokenType.INTERSECTION, 'intersection'),
        '∅': (TokenType.EMPTY_SET, 'empty_set'),
        '∑': (TokenType.SUMMATION, 'summation'),
        '∏': (TokenType.PRODUCT, 'product'),
        '∫': (TokenType.INTEGRAL, 'integral'),
        '∂': (TokenType.PARTIAL, 'partial'),
        '∇': (TokenType.NABLA, 'nabla'),
        'Δ': (TokenType.DELTA, 'delta'),
        
        # Superscript numbers ⁰¹²³⁴⁵⁶⁷⁸⁹
        '⁰': (TokenType.SUPERSCRIPT_NUMBER, '0'),
        '¹': (TokenType.SUPERSCRIPT_NUMBER, '1'),
        '²': (TokenType.SUPERSCRIPT_NUMBER, '2'),
        '³': (TokenType.SUPERSCRIPT_NUMBER, '3'),
        '⁴': (TokenType.SUPERSCRIPT_NUMBER, '4'),
        '⁵': (TokenType.SUPERSCRIPT_NUMBER, '5'),
        '⁶': (TokenType.SUPERSCRIPT_NUMBER, '6'),
        '⁷': (TokenType.SUPERSCRIPT_NUMBER, '7'),
        '⁸': (TokenType.SUPERSCRIPT_NUMBER, '8'),
        '⁹': (TokenType.SUPERSCRIPT_NUMBER, '9'),
        
        # Subscript numbers ₀₁₂₃₄₅₆₇₈₉
        '₀': (TokenType.SUBSCRIPT_NUMBER, '0'),
        '₁': (TokenType.SUBSCRIPT_NUMBER, '1'),
        '₂': (TokenType.SUBSCRIPT_NUMBER, '2'),
        '₃': (TokenType.SUBSCRIPT_NUMBER, '3'),
        '₄': (TokenType.SUBSCRIPT_NUMBER, '4'),
        '₅': (TokenType.SUBSCRIPT_NUMBER, '5'),
        '₆': (TokenType.SUBSCRIPT_NUMBER, '6'),
        '₇': (TokenType.SUBSCRIPT_NUMBER, '7'),
        '₈': (TokenType.SUBSCRIPT_NUMBER, '8'),
        '₉': (TokenType.SUBSCRIPT_NUMBER, '9'),
    }
    
    KEYWORDS = {
        # JavaScript core
        'let': TokenType.LET,
        'const': TokenType.CONST,
        'var': TokenType.VAR,
        'function': TokenType.FUNCTION,
        'fast': TokenType.FAST,
        'class': TokenType.CLASS,
        'struct': TokenType.STRUCT,
        'if': TokenType.IF,
        'else': TokenType.ELSE,
        'for': TokenType.FOR,
        'while': TokenType.WHILE,
        'do': TokenType.DO,
        'break': TokenType.BREAK,
        'continue': TokenType.CONTINUE,
        'return': TokenType.RETURN,
        'try': TokenType.TRY,
        'catch': TokenType.CATCH,
        'finally': TokenType.FINALLY,
        'throw': TokenType.THROW,
        'new': TokenType.NEW,
        'this': TokenType.THIS,
        'extends': TokenType.EXTENDS,
        'static': TokenType.STATIC,
        'true': TokenType.TRUE,
        'false': TokenType.FALSE,
        'null': TokenType.NULL,
        'undefined': TokenType.UNDEFINED,
        'of': TokenType.OF,
        'in': TokenType.IN,
        'instanceof': TokenType.INSTANCEOF,
        'typeof': TokenType.TYPEOF,
        'void': TokenType.VOID,
        'delete': TokenType.DELETE,
        'async': TokenType.ASYNC,
        'await': TokenType.AWAIT,
        'yield': TokenType.YIELD,
        'import': TokenType.IMPORT,
        'export': TokenType.EXPORT,
        'from': TokenType.FROM,
        'default': TokenType.DEFAULT,
        'as': TokenType.AS,
        
        # LUASCRIPT mathematical extensions
        'neural': TokenType.NEURAL,
        'tensor': TokenType.TENSOR,
        'simd': TokenType.SIMD,
        'parallel': TokenType.PARALLEL,
        'fast': TokenType.FAST,
        'cpu_friendly': TokenType.CPU_FRIENDLY,
        'match': TokenType.MATCH,
        'when': TokenType.WHEN,
        
        # Types
        'int8': TokenType.INT8,
        'int16': TokenType.INT16,
        'int32': TokenType.INT32,
        'int64': TokenType.INT64,
        'uint8': TokenType.UINT8,
        'uint16': TokenType.UINT16,
        'uint32': TokenType.UINT32,
        'uint64': TokenType.UINT64,
        'float32': TokenType.FLOAT32,
        'float64': TokenType.FLOAT64,
        'real': TokenType.REAL,
        'complex': TokenType.COMPLEX,
    }
    
    def __init__(self, source: str, filename: str = "<string>"):
        self.source = source
        self.filename = filename
        self.tokens: List[Token] = []
        self.start = 0
        self.current = 0
        self.line = 1
        self.column = 1
        
    def tokenize(self) -> List[Token]:
        """Tokenize the entire source with enhanced error reporting"""
        try:
            while not self.is_at_end():
                self.start = self.current
                self.scan_token()
                
            self.tokens.append(Token(TokenType.EOF, "", self.line, self.column))
            return self.tokens
        except Exception as e:
            context = self._get_error_context()
            if isinstance(e, LexerError):
                e.context = context
            raise e
    
    def _get_error_context(self, radius: int = 20) -> str:
        """Get context around current position for error reporting"""
        start = max(0, self.current - radius)
        end = min(len(self.source), self.current + radius)
        context = self.source[start:end]
        pointer_pos = self.current - start
        
        lines = context.split('\n')
        if len(lines) > 1:
            # Multi-line context
            return f"...{context}...\n" + " " * (pointer_pos) + "^"
        else:
            return f"...{context}...\n" + " " * (3 + pointer_pos) + "^"
    
    def is_at_end(self) -> bool:
        return self.current >= len(self.source)
        
    def scan_token(self):
        """Enhanced token scanning with Unicode support"""
        c = self.advance()
        
        # Skip whitespace (except newlines)
        if c in ' \r\t':
            return
            
        # Newlines
        if c == '\n':
            self.add_token(TokenType.NEWLINE)
            self.line += 1
            self.column = 1
            return
            
        # Comments
        if c == '/':
            if self.peek() == '/':
                self._scan_line_comment()
                return
            elif self.peek() == '*':
                self._scan_block_comment()
                return
            else:
                self.add_token(TokenType.DIVIDE)
                return
        
        # Template strings (FIXED: Proper ${} interpolation)
        if c == '`':
            self._scan_template_string()
            return
            
        # Strings
        if c in '"\'':
            self._scan_string(c)
            return
            
        # Mathematical Unicode operators and constants (NEW: Unicode Support)
        # Check BEFORE digits to handle superscript/subscript numbers properly
        if self._is_mathematical_unicode(c):
            self._scan_mathematical_unicode(c)
            return
        
        # Numbers
        if c.isdigit():
            self._scan_number()
            return
            
        # Pipeline and logical OR operators
        if c == '|':
            if self.peek() == '>':
                self.advance()  # consume '>'
                self.add_token(TokenType.PIPELINE)
            elif self.peek() == '|':
                self.advance()  # consume second '|'
                self.add_token(TokenType.LOGICAL_OR)
            else:
                # Standalone | for pattern matching or bitwise OR
                self.add_token(TokenType.OR)
            return
            
        if c == '<' and self.peek() == '|':
            self.advance()  # consume '|'
            self.add_token(TokenType.REVERSE_PIPELINE)
            return
        
        # Range operators and spread
        if c == '.' and self.peek() == '.':
            self.advance()  # consume second '.'
            if self.peek() == '.':
                self.advance()  # consume third '.'
                self.add_token(TokenType.DOT_DOT_DOT)
            else:
                self.add_token(TokenType.RANGE_INCLUSIVE)
            return
        
        # Standard ASCII operators
        if self._scan_ascii_operator(c):
            return
            
        # Punctuation
        punctuation_map = {
            '(': TokenType.LEFT_PAREN,
            ')': TokenType.RIGHT_PAREN,
            '{': TokenType.LEFT_BRACE,
            '}': TokenType.RIGHT_BRACE,
            '[': TokenType.LEFT_BRACKET,
            ']': TokenType.RIGHT_BRACKET,
            ',': TokenType.COMMA,
            '.': TokenType.DOT,
            ';': TokenType.SEMICOLON,
            ':': TokenType.COLON,
            '?': TokenType.QUESTION,
            '!': TokenType.EXCLAMATION,
        }
        
        if c in punctuation_map:
            self.add_token(punctuation_map[c])
            return
            
        # Identifiers and keywords
        if c.isalpha() or c == '_' or c == '$':
            self._scan_identifier()
            return
            
        # Unknown character
        char_desc = f"'{c}'"
        if ord(c) > 127:  # Unicode character
            try:
                unicode_name = unicodedata.name(c)
                char_desc = f"'{c}' (Unicode: {unicode_name})"
            except ValueError:
                char_desc = f"'{c}' (Unicode: U+{ord(c):04X})"
        
        raise LexerError(f"Unexpected character {char_desc}", self.line, self.column)
    
    def _scan_template_string(self):
        """FIXED: Proper template string scanning with ${} interpolation support"""
        # Template strings can contain expressions like ${variable}
        # We need to properly tokenize these for the parser
        
        value = ""
        expressions = []
        
        while self.peek() != '`' and not self.is_at_end():
            if self.peek() == '$' and self.peek_next() == '{':
                # Save the string part before the expression
                if value:
                    if not expressions:  # First part
                        self.add_token(TokenType.TEMPLATE_START, value)
                    else:  # Middle part
                        self.add_token(TokenType.TEMPLATE_MIDDLE, value)
                    value = ""
                
                # Skip ${ 
                self.advance()  # $
                self.advance()  # {
                
                # Tokenize the expression inside ${}
                expr_start = self.current
                brace_count = 1
                
                while brace_count > 0 and not self.is_at_end():
                    c = self.advance()
                    if c == '{':
                        brace_count += 1
                    elif c == '}':
                        brace_count -= 1
                
                expr_text = self.source[expr_start:self.current-1]
                self.add_token(TokenType.TEMPLATE_EXPRESSION, expr_text)
                expressions.append(expr_text)
                
            elif self.peek() == '\n':
                value += self.advance()
                self.line += 1
                self.column = 1
            elif self.peek() == '\\':
                # Handle escape sequences
                self.advance()  # consume backslash
                escaped = self.advance()
                escape_map = {
                    'n': '\n', 'r': '\r', 't': '\t', '\\': '\\',
                    '`': '`', '$': '$'
                }
                value += escape_map.get(escaped, escaped)
            else:
                value += self.advance()
                
        if self.is_at_end():
            raise LexerError("Unterminated template string", self.line, self.column)
            
        # Consume closing backtick
        self.advance()
        
        # Add final part
        if expressions:
            self.add_token(TokenType.TEMPLATE_END, value)
        else:
            # No expressions, just a regular template string
            self.add_token(TokenType.TEMPLATE_STRING, value)
    
    def _scan_string(self, quote_char: str):
        """Scan regular string literals"""
        value = ""
        while self.peek() != quote_char and not self.is_at_end():
            if self.peek() == '\n':
                self.line += 1
                self.column = 1
            if self.peek() == '\\':
                self.advance()  # consume backslash
                escaped = self.advance()
                escape_map = {
                    'n': '\n', 'r': '\r', 't': '\t', '\\': '\\',
                    '"': '"', "'": "'", '`': '`'
                }
                value += escape_map.get(escaped, escaped)
            else:
                value += self.advance()
                
        if self.is_at_end():
            raise LexerError(f"Unterminated string literal", self.line, self.column)
            
        self.advance()  # Consume closing quote
        self.add_token(TokenType.STRING, value)
    
    def _scan_number(self):
        """Scan number literals with scientific notation support"""
        # Integer part
        while self.peek().isdigit():
            self.advance()
            
        # Decimal part
        if self.peek() == '.' and self.peek_next().isdigit():
            self.advance()  # consume '.'
            while self.peek().isdigit():
                self.advance()
                
        # Scientific notation
        if self.peek().lower() == 'e':
            self.advance()
            if self.peek() in '+-':
                self.advance()
            if not self.peek().isdigit():
                raise LexerError("Invalid scientific notation", self.line, self.column)
            while self.peek().isdigit():
                self.advance()
                
        value = self.source[self.start:self.current]
        self.add_token(TokenType.NUMBER, value)
    
    def _is_mathematical_unicode(self, char: str) -> bool:
        """Check if character is a mathematical Unicode symbol"""
        return (char in self.MATHEMATICAL_CONSTANTS or 
                char in self.MATHEMATICAL_OPERATORS)
    
    def _scan_mathematical_unicode(self, char: str):
        """NEW: Scan mathematical Unicode operators and constants"""
        if char in self.MATHEMATICAL_CONSTANTS:
            token_type, name = self.MATHEMATICAL_CONSTANTS[char]
            self.add_token(token_type, char, unicode_name=name)
        elif char in self.MATHEMATICAL_OPERATORS:
            token_type, name = self.MATHEMATICAL_OPERATORS[char]
            
            # For superscript/subscript numbers, swap value and unicode_name
            # so the parser gets the numeric value ('2') instead of Unicode char ('²')
            if token_type in (TokenType.SUPERSCRIPT_NUMBER, TokenType.SUBSCRIPT_NUMBER):
                self.add_token(token_type, name, unicode_name=char)
            else:
                self.add_token(token_type, char, unicode_name=name)
    
    def _scan_ascii_operator(self, c: str) -> bool:
        """Scan ASCII operators with lookahead"""
        if c == '=':
            if self.peek() == '=':
                self.advance()
                if self.peek() == '=':
                    self.advance()
                    self.add_token(TokenType.STRICT_EQUAL)
                else:
                    self.add_token(TokenType.EQUAL)
            elif self.peek() == '>':
                self.advance()
                self.add_token(TokenType.ARROW)
            else:
                self.add_token(TokenType.ASSIGN)
            return True
            
        if c == '!':
            if self.peek() == '=':
                self.advance()
                if self.peek() == '=':
                    self.advance()
                    self.add_token(TokenType.STRICT_NOT_EQUAL)
                else:
                    self.add_token(TokenType.NOT_EQUAL)
            else:
                self.add_token(TokenType.NOT)
            return True
            
        if c == '<':
            if self.peek() == '=':
                self.advance()
                self.add_token(TokenType.LESS_EQUAL)
            else:
                self.add_token(TokenType.LESS)
            return True
            
        if c == '>':
            if self.peek() == '=':
                self.advance()
                self.add_token(TokenType.GREATER_EQUAL)
            else:
                self.add_token(TokenType.GREATER)
            return True
        
        if c == '+':
            if self.peek() == '=':
                self.advance()
                self.add_token(TokenType.PLUS_ASSIGN)
            elif self.peek() == '+':
                self.advance()
                self.add_token(TokenType.INCREMENT)
            else:
                self.add_token(TokenType.PLUS)
            return True
            
        if c == '-':
            if self.peek() == '=':
                self.advance()
                self.add_token(TokenType.MINUS_ASSIGN)
            elif self.peek() == '-':
                self.advance()
                self.add_token(TokenType.DECREMENT)
            else:
                self.add_token(TokenType.MINUS)
            return True
            
        if c == '*':
            if self.peek() == '=':
                self.advance()
                self.add_token(TokenType.MULTIPLY_ASSIGN)
            elif self.peek() == '*':
                self.advance()
                self.add_token(TokenType.POWER)
            else:
                self.add_token(TokenType.MULTIPLY)
            return True
            
        if c == '&':
            if self.peek() == '&':
                self.advance()
                self.add_token(TokenType.LOGICAL_AND)
            else:
                self.add_token(TokenType.AND)
            return True
            
        if c == '|':
            if self.peek() == '|':
                self.advance()
                self.add_token(TokenType.LOGICAL_OR)
            else:
                self.add_token(TokenType.OR)
            return True
        
        single_char_ops = {
            '/': TokenType.DIVIDE,
            '%': TokenType.MODULO,
            '^': TokenType.POWER,
        }
        
        if c in single_char_ops:
            if c == '/' and self.peek() == '=':
                self.advance()
                self.add_token(TokenType.DIVIDE_ASSIGN)
            else:
                self.add_token(single_char_ops[c])
            return True
            
        return False
    
    def _scan_identifier(self):
        """Scan identifiers and keywords"""
        while (self.peek().isalnum() or self.peek() in '_$' or 
               self._is_valid_identifier_unicode(self.peek())):
            self.advance()
            
        text = self.source[self.start:self.current]
        token_type = self.KEYWORDS.get(text, TokenType.IDENTIFIER)
        self.add_token(token_type, text)
    
    def _is_valid_identifier_unicode(self, char: str) -> bool:
        """Check if Unicode character is valid in identifier (future extension)"""
        # For now, stick to ASCII identifiers
        # Future: could allow mathematical subscripts, Greek letters, etc.
        return False
    
    def _scan_line_comment(self):
        """Scan single-line comment"""
        while self.peek() != '\n' and not self.is_at_end():
            self.advance()
    
    def _scan_block_comment(self):
        """Scan multi-line comment"""
        self.advance()  # consume '*'
        while not self.is_at_end():
            if self.peek() == '*' and self.peek_next() == '/':
                self.advance()  # consume '*'
                self.advance()  # consume '/'
                break
            if self.peek() == '\n':
                self.line += 1
                self.column = 1
            self.advance()
    
    def advance(self) -> str:
        """Consume and return current character"""
        if self.is_at_end():
            return '\0'
        self.current += 1
        self.column += 1
        return self.source[self.current - 1]
        
    def peek(self) -> str:
        """Look at current character without consuming"""
        if self.is_at_end():
            return '\0'
        return self.source[self.current]
        
    def peek_next(self) -> str:
        """Look at next character without consuming"""
        if self.current + 1 >= len(self.source):
            return '\0'
        return self.source[self.current + 1]
        
    def add_token(self, token_type: TokenType, value: Optional[str] = None, 
                  unicode_name: Optional[str] = None):
        """Add token with optional Unicode name"""
        text = value if value is not None else self.source[self.start:self.current]
        token = Token(token_type, text, self.line, self.column - len(text), unicode_name)
        self.tokens.append(token)

def tokenize_source(source: str, filename: str = "<string>") -> List[Token]:
    """Enhanced tokenization with mathematical Unicode support"""
    lexer = EnhancedLexer(source, filename)
    return lexer.tokenize()

if __name__ == "__main__":
    # Test the enhanced lexer with mathematical notation
    test_source = '''
    // Mathematical constants and operations
    let radius = 5.0
    let area = π × radius^2
    let circumference = 2 × π × radius
    
    // Template strings with interpolation (FIXED!)
    let greeting = `Hello, ${name}! Area is ${area.toFixed(2)}`
    
    // Mathematical functions with Unicode
    gaussian(μ, σ²) = (1/√(2×π×σ²)) × ℯ^(-((x-μ)²)/(2×σ²))
    
    // Pipeline operations
    let result = data |> filter(x → x > 0) |> map(x → x × 2) |> reduce((a,b) → a + b)
    
    // Pattern matching with mathematical guards
    factorial(n) = match n
      | n ≤ 1 → 1
      | _ → n × factorial(n - 1)
    '''
    
    try:
        tokens = tokenize_source(test_source)
        print(f"✅ Successfully tokenized {len(tokens)} tokens")
        
        # Show mathematical tokens
        math_tokens = [t for t in tokens if t.unicode_name or t.type.name.startswith('MATH')]
        print(f"📐 Found {len(math_tokens)} mathematical tokens:")
        for token in math_tokens:
            print(f"  {token.value} → {token.type.name} ({token.unicode_name or 'ascii'})")
            
    except Exception as e:
        print(f"❌ Lexer test failed: {e}")
