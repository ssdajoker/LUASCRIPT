#!/usr/bin/env python3
"""
LUASCRIPT Enhanced Parser
Implements JavaScript-like syntax parsing for full programming language support

Expands from mathematical functions to complete language constructs:
- Variable declarations (let, const, var)
- Control flow (if/else, for, while)
- Function declarations (traditional + arrow functions)
- Object-oriented programming (classes, inheritance)
- Modern JavaScript features (destructuring, spread, etc.)

Author: Steve Jobs + Donald Knuth Leadership Team
Priority: CRITICAL - Core parser for JavaScript-like syntax expansion
"""

from typing import List, Dict, Set, Optional, Any, Union, Tuple
from enum import Enum
from dataclasses import dataclass
import sys
import os

# Import token types from enhanced lexer
sys.path.append(os.path.join(os.path.dirname(__file__), '../lexer'))
from enhanced_lexer import Token, TokenType, tokenize_source

# Enhanced AST Node definitions for full JavaScript-like syntax
class ASTNode:
    """Base class for all AST nodes"""
    pass

@dataclass
class Program(ASTNode):
    """Root program node containing all statements"""
    statements: List[ASTNode]

# Variable Declarations
@dataclass
class VariableDeclaration(ASTNode):
    """Variable declaration: let x = 5, const PI = 3.14"""
    kind: str  # 'let', 'const', 'var'
    declarations: List['VariableDeclarator']

@dataclass
class VariableDeclarator(ASTNode):
    """Individual variable declarator within declaration"""
    id: 'Identifier'
    init: Optional[ASTNode] = None
    type_annotation: Optional[str] = None

# Function Declarations
@dataclass
class FunctionDeclaration(ASTNode):
    """Function declaration: function add(a, b) { return a + b; }"""
    name: str
    parameters: List['Parameter']
    body: 'BlockStatement'
    return_type: Optional[str] = None
    is_mathematical: bool = False  # f(x) = expr syntax
    is_arrow: bool = False

@dataclass
class ArrowFunctionExpression(ASTNode):
    """Arrow function: (a, b) => a + b"""
    parameters: List['Parameter']
    body: ASTNode  # Can be expression or block
    is_async: bool = False

@dataclass
class Parameter(ASTNode):
    """Function parameter"""
    name: str
    type_annotation: Optional[str] = None
    default_value: Optional[ASTNode] = None

# Control Flow Statements
@dataclass
class IfStatement(ASTNode):
    """If statement with optional else"""
    test: ASTNode
    consequent: ASTNode
    alternate: Optional[ASTNode] = None

@dataclass
class ForStatement(ASTNode):
    """Traditional for loop: for (init; test; update) body"""
    init: Optional[ASTNode]
    test: Optional[ASTNode]
    update: Optional[ASTNode]
    body: ASTNode

@dataclass
class ForOfStatement(ASTNode):
    """For-of loop: for (item of array) body"""
    left: ASTNode  # Variable declaration or identifier
    right: ASTNode  # Iterable expression
    body: ASTNode

@dataclass
class WhileStatement(ASTNode):
    """While loop: while (condition) body"""
    test: ASTNode
    body: ASTNode

@dataclass
class TryStatement(ASTNode):
    """Try-catch-finally statement"""
    block: 'BlockStatement'
    handler: Optional['CatchClause'] = None
    finalizer: Optional['BlockStatement'] = None

@dataclass
class CatchClause(ASTNode):
    """Catch clause in try statement"""
    param: Optional['Identifier']
    body: 'BlockStatement'

# Object-Oriented Programming
@dataclass
class ClassDeclaration(ASTNode):
    """Class declaration with optional inheritance"""
    name: str
    superclass: Optional[ASTNode]
    body: List[ASTNode]  # Method definitions

@dataclass
class MethodDefinition(ASTNode):
    """Method definition within class"""
    key: 'Identifier'
    value: FunctionDeclaration
    kind: str  # 'method', 'constructor', 'get', 'set'
    static: bool = False

@dataclass
class NewExpression(ASTNode):
    """New expression: new Class(args)"""
    callee: ASTNode
    arguments: List[ASTNode]

# Statements and Expressions
@dataclass
class BlockStatement(ASTNode):
    """Block statement: { statements }"""
    statements: List[ASTNode]

@dataclass
class ExpressionStatement(ASTNode):
    """Expression used as statement"""
    expression: ASTNode

@dataclass
class ReturnStatement(ASTNode):
    """Return statement"""
    argument: Optional[ASTNode] = None

@dataclass
class BreakStatement(ASTNode):
    """Break statement"""
    label: Optional[str] = None

@dataclass
class ContinueStatement(ASTNode):
    """Continue statement"""
    label: Optional[str] = None

@dataclass
class ThrowStatement(ASTNode):
    """Throw statement"""
    argument: ASTNode

# Expressions
@dataclass
class CallExpression(ASTNode):
    """Function call: func(args)"""
    callee: ASTNode
    arguments: List[ASTNode]

@dataclass
class MemberExpression(ASTNode):
    """Member access: obj.prop or obj[prop]"""
    object: ASTNode
    property: ASTNode
    computed: bool = False

@dataclass
class AssignmentExpression(ASTNode):
    """Assignment: x = value"""
    left: ASTNode
    operator: str  # '=', '+=', '-=', etc.
    right: ASTNode

@dataclass
class BinaryExpression(ASTNode):
    """Binary operation: a + b"""
    left: ASTNode
    operator: str
    right: ASTNode

@dataclass
class UnaryExpression(ASTNode):
    """Unary operation: !x, -x, ++x"""
    operator: str
    argument: ASTNode
    prefix: bool = True

@dataclass
class UpdateExpression(ASTNode):
    """Update expression: x++, ++x"""
    operator: str  # '++', '--'
    argument: ASTNode
    prefix: bool = True

@dataclass
class ConditionalExpression(ASTNode):
    """Ternary operator: test ? consequent : alternate"""
    test: ASTNode
    consequent: ASTNode
    alternate: ASTNode

# Literals and Identifiers
@dataclass
class Identifier(ASTNode):
    """Identifier: variable name with optional subscript"""
    name: str
    subscript: Optional[str] = None  # For mathematical subscripts like x₂

@dataclass
class Literal(ASTNode):
    """Literal value: number, string, boolean, null"""
    value: Union[str, int, float, bool, None]
    raw: Optional[str] = None

@dataclass
class ArrayExpression(ASTNode):
    """Array literal: [1, 2, 3]"""
    elements: List[Optional[ASTNode]]  # None for holes

@dataclass
class ObjectExpression(ASTNode):
    """Object literal: {key: value}"""
    properties: List['Property']

@dataclass
class Property(ASTNode):
    """Object property"""
    key: ASTNode
    value: ASTNode
    kind: str = 'init'  # 'init', 'get', 'set'
    method: bool = False
    shorthand: bool = False
    computed: bool = False

# Template Literals
@dataclass
class TemplateLiteral(ASTNode):
    """Template literal: `Hello ${name}`"""
    quasis: List['TemplateElement']
    expressions: List[ASTNode]

@dataclass
class TemplateElement(ASTNode):
    """Template literal element"""
    value: str
    tail: bool = False

# Modern JavaScript Features
@dataclass
class SpreadElement(ASTNode):
    """Spread element: ...array"""
    argument: ASTNode

@dataclass
class RestElement(ASTNode):
    """Rest element in destructuring: ...rest"""
    argument: ASTNode

@dataclass
class ArrayPattern(ASTNode):
    """Array destructuring pattern: [a, b, c]"""
    elements: List[Optional[ASTNode]]

@dataclass
class ObjectPattern(ASTNode):
    """Object destructuring pattern: {a, b, c}"""
    properties: List[ASTNode]

@dataclass
class AssignmentPattern(ASTNode):
    """Assignment pattern with default: a = 5"""
    left: ASTNode
    right: ASTNode

# Parser Error Classes
class ParseError(Exception):
    """Base parser error"""
    def __init__(self, message: str, token: Optional[Token] = None):
        self.message = message
        self.token = token
        super().__init__(f"Parse Error: {message}")

class EnhancedParser:
    """
    Enhanced LUASCRIPT Parser
    
    Implements recursive descent parsing for JavaScript-like syntax:
    - Variable declarations (let, const, var)
    - Control flow statements (if, for, while, try/catch)
    - Function declarations (traditional + arrow functions)
    - Object-oriented programming (classes, inheritance)
    - Modern JavaScript features (destructuring, spread, etc.)
    """
    
    def __init__(self):
        self.tokens: List[Token] = []
        self.current = 0
        self.scope_stack: List[Set[str]] = [set()]
        self.in_function = False
        self.in_loop = False
        self.in_class = False
    
    def is_type_token(self) -> bool:
        """Check if current token is a type token"""
        type_tokens = {
            TokenType.INT8, TokenType.INT16, TokenType.INT32, TokenType.INT64,
            TokenType.UINT8, TokenType.UINT16, TokenType.UINT32, TokenType.UINT64,
            TokenType.FLOAT32, TokenType.FLOAT64, TokenType.REAL, TokenType.COMPLEX
        }
        return self.check_any(*type_tokens)
        
    def parse(self, source: str, filename: str = "<string>") -> Program:
        """Main parsing entry point"""
        try:
            # Tokenize source code
            self.tokens = tokenize_source(source, filename)
            self.current = 0
            
            # Parse program
            return self.parse_program()
            
        except Exception as e:
            raise ParseError(f"Failed to parse {filename}: {e}")
    
    def parse_program(self) -> Program:
        """Parse complete program"""
        statements = []
        
        while not self.is_at_end():
            # Skip newlines at top level
            if self.match(TokenType.NEWLINE):
                continue
                
            stmt = self.parse_statement()
            if stmt:
                statements.append(stmt)
                
        return Program(statements)
    
    def parse_statement(self) -> Optional[ASTNode]:
        """Parse any statement"""
        try:
            # Variable declarations
            if self.match(TokenType.LET):
                return self.parse_variable_declaration('let')
            elif self.match(TokenType.CONST):
                return self.parse_variable_declaration('const')
            elif self.match(TokenType.VAR):
                return self.parse_variable_declaration('var')
            
            # Control flow
            elif self.match(TokenType.IF):
                return self.parse_if_statement()
            elif self.match(TokenType.FOR):
                return self.parse_for_statement()
            elif self.match(TokenType.WHILE):
                return self.parse_while_statement()
            elif self.match(TokenType.TRY):
                return self.parse_try_statement()
            
            # Function declarations (including fast functions)
            elif self.match(TokenType.FAST):
                # LUASCRIPT performance hint: fast function
                if self.match(TokenType.FUNCTION):
                    return self.parse_function_declaration()  # Ignore 'fast' hint for now
                else:
                    self.error("Expected 'function' after 'fast'")
            elif self.match(TokenType.FUNCTION):
                return self.parse_function_declaration()
            
            # Class declarations
            elif self.match(TokenType.CLASS):
                return self.parse_class_declaration()
            
            # Control statements
            elif self.match(TokenType.RETURN):
                return self.parse_return_statement()
            elif self.match(TokenType.BREAK):
                return self.parse_break_statement()
            elif self.match(TokenType.CONTINUE):
                return self.parse_continue_statement()
            elif self.match(TokenType.THROW):
                return self.parse_throw_statement()
            
            # Block statement
            elif self.check(TokenType.LEFT_BRACE):
                return self.parse_block_statement()
            
            # Mathematical function: f(x) = expr
            elif self.is_mathematical_function():
                return self.parse_mathematical_function()
            
            # Expression statement
            else:
                return self.parse_expression_statement()
                
        except ParseError:
            raise
        except Exception as e:
            raise ParseError(f"Unexpected error parsing statement: {e}")
    
    def parse_variable_declaration(self, kind: str) -> VariableDeclaration:
        """Parse variable declaration: let x = 5, let [a, b] = arr, let {x, y} = obj"""
        declarations = []
        
        while True:
            # Parse identifier OR destructuring pattern
            id_node = None
            type_annotation = None
            
            if self.check(TokenType.IDENTIFIER):
                # Simple identifier: let x = 5
                name = self.advance().value
                id_node = Identifier(name)
                
                # Optional type annotation
                if self.match(TokenType.COLON):
                    type_annotation = self.parse_type_annotation()
            
            elif self.check(TokenType.LEFT_BRACKET):
                # Array destructuring: let [a, b, c] = array
                id_node = self.parse_array_pattern()
                
            elif self.check(TokenType.LEFT_BRACE):
                # Object destructuring: let {x, y} = obj  
                id_node = self.parse_object_pattern()
                
            else:
                raise ParseError(f"Expected identifier or destructuring pattern in {kind} declaration")
            
            # Optional initializer
            init = None
            if self.match(TokenType.ASSIGN):
                init = self.parse_assignment_expression()
            elif kind == 'const':
                raise ParseError("const declaration must have initializer")
            
            declarations.append(VariableDeclarator(id_node, init, type_annotation))
            
            # Check for more declarations
            if not self.match(TokenType.COMMA):
                break
        
        self.consume_statement_terminator()
        return VariableDeclaration(kind, declarations)
    
    def parse_if_statement(self) -> IfStatement:
        """Parse if statement"""
        self.consume(TokenType.LEFT_PAREN, "Expected '(' after 'if'")
        test = self.parse_expression()
        self.consume(TokenType.RIGHT_PAREN, "Expected ')' after if condition")
        
        consequent = self.parse_statement()
        
        alternate = None
        if self.match(TokenType.ELSE):
            alternate = self.parse_statement()
        
        return IfStatement(test, consequent, alternate)
    
    def parse_for_statement(self) -> ASTNode:
        """
        Steve Jobs Emergency Fix: Bulletproof For-Loop Parsing
        Guaranteed to work or fail gracefully
        """
        self.consume(TokenType.LEFT_PAREN, "Expected '(' after 'for'")
        
        # EMERGENCY FIX: Completely separate for-of and traditional parsing
        # This eliminates the broken checkpoint mechanism
        
        # Strategy: Look ahead to determine for-loop type WITHOUT consuming tokens
        is_for_of = self._is_for_of_pattern()
        
        if is_for_of:
            return self._parse_for_of_statement()
        else:
            return self._parse_traditional_for_statement()

    def _is_for_of_pattern(self) -> bool:
        """
        Look ahead to detect for-of pattern without consuming tokens
        Patterns: 'item of', 'let item of', 'const item of', 'var item of'
        """
        saved_position = self.current
        
        try:
            # Skip optional let/const/var
            if self.check_any(TokenType.LET, TokenType.CONST, TokenType.VAR):
                self.advance()
            
            # Must have identifier
            if not self.check(TokenType.IDENTIFIER):
                return False
            self.advance()
            
            # Check for 'of' keyword
            result = self.check(TokenType.OF)
            return result
            
        except Exception:
            return False
        finally:
            # GUARANTEED restoration - no matter what happens
            self.current = saved_position

    def _parse_for_of_statement(self) -> 'ForOfStatement':
        """Parse for-of with clean, simple logic"""
        # Parse variable or identifier
        if self.check_any(TokenType.LET, TokenType.CONST, TokenType.VAR):
            kind = self.advance().value
            name = self.consume(TokenType.IDENTIFIER, "Expected identifier").value
            left = VariableDeclaration(kind, [VariableDeclarator(Identifier(name))])
        else:
            name = self.consume(TokenType.IDENTIFIER, "Expected identifier").value
            left = Identifier(name)
        
        self.consume(TokenType.OF, "Expected 'of' in for-of loop")
        right = self.parse_expression()
        self.consume(TokenType.RIGHT_PAREN, "Expected ')' after for-of")
        
        # Parse body
        old_in_loop = self.in_loop
        self.in_loop = True
        body = self.parse_statement()
        self.in_loop = old_in_loop
        
        return ForOfStatement(left, right, body)

    def _parse_traditional_for_statement(self) -> 'ForStatement':
        """Parse traditional for-loop with bulletproof logic"""
        # Parse initialization  
        init = None
        if not self.check(TokenType.SEMICOLON):
            if self.check_any(TokenType.LET, TokenType.CONST, TokenType.VAR):
                # Manual variable declaration parsing for for-loop context
                kind_token = self.advance()  # consume let/const/var
                name_token = self.consume(TokenType.IDENTIFIER, "Expected variable name")
                
                if self.check(TokenType.ASSIGN):
                    self.advance()  # consume =
                    value = self.parse_expression_with_context("variable initializer")
                    declarator = VariableDeclarator(Identifier(name_token.value), value)
                else:
                    declarator = VariableDeclarator(Identifier(name_token.value))
                
                init = VariableDeclaration(kind_token.value, [declarator])
            else:
                init = self.parse_expression_with_context("for-loop initialization")
        
        self.consume(TokenType.SEMICOLON, "Expected ';' after for-loop initializer")
        
        # Parse condition
        test = None
        if not self.check(TokenType.SEMICOLON):
            test = self.parse_expression_with_context("for-loop condition")
        
        self.consume(TokenType.SEMICOLON, "Expected ';' after for-loop condition")
        
        # Parse update
        update = None
        if not self.check(TokenType.RIGHT_PAREN):
            update = self.parse_expression_with_context("for-loop update")
        
        self.consume(TokenType.RIGHT_PAREN, "Expected ')' after for-loop clauses")
        
        # Parse body
        old_in_loop = self.in_loop
        self.in_loop = True
        body = self.parse_statement()
        self.in_loop = old_in_loop
        
        return ForStatement(init, test, update, body)

    def parse_expression_with_context(self, context: str = "expression") -> ASTNode:
        """
        Parse expression with context information for better error messages
        """
        try:
            return self.parse_expression()
        except ParseError as e:
            # Enhance error message with context
            raise ParseError(f"In {context}: {str(e)}")
    
    def parse_while_statement(self) -> WhileStatement:
        """Parse while statement"""
        self.consume(TokenType.LEFT_PAREN, "Expected '(' after 'while'")
        test = self.parse_expression()
        self.consume(TokenType.RIGHT_PAREN, "Expected ')' after while condition")
        
        old_in_loop = self.in_loop
        self.in_loop = True
        body = self.parse_statement()
        self.in_loop = old_in_loop
        
        return WhileStatement(test, body)
    
    def parse_try_statement(self) -> TryStatement:
        """Parse try-catch-finally statement"""
        block = self.parse_block_statement()
        
        handler = None
        if self.match(TokenType.CATCH):
            param = None
            if self.match(TokenType.LEFT_PAREN):
                if self.check(TokenType.IDENTIFIER):
                    param = Identifier(self.advance().value)
                self.consume(TokenType.RIGHT_PAREN, "Expected ')' after catch parameter")
            
            body = self.parse_block_statement()
            handler = CatchClause(param, body)
        
        finalizer = None
        if self.match(TokenType.FINALLY):
            finalizer = self.parse_block_statement()
        
        if not handler and not finalizer:
            raise ParseError("Missing catch or finally after try")
        
        return TryStatement(block, handler, finalizer)
    
    def parse_function_declaration(self) -> FunctionDeclaration:
        """Parse function declaration"""
        name = self.consume(TokenType.IDENTIFIER, "Expected function name").value
        
        self.consume(TokenType.LEFT_PAREN, "Expected '(' after function name")
        parameters = self.parse_parameter_list()
        self.consume(TokenType.RIGHT_PAREN, "Expected ')' after parameters")
        
        # Optional return type annotation
        return_type = None
        if self.match(TokenType.COLON):
            if self.check(TokenType.IDENTIFIER) or self.is_type_token():
                return_type = self.advance().value
        
        old_in_function = self.in_function
        self.in_function = True
        body = self.parse_block_statement()
        self.in_function = old_in_function
        
        return FunctionDeclaration(name, parameters, body, return_type)
    
    def parse_class_declaration(self) -> ClassDeclaration:
        """Parse class declaration"""
        name = self.consume(TokenType.IDENTIFIER, "Expected class name").value
        
        superclass = None
        if self.match(TokenType.EXTENDS):
            superclass = Identifier(self.consume(TokenType.IDENTIFIER, "Expected superclass name").value)
        
        self.consume(TokenType.LEFT_BRACE, "Expected '{' before class body")
        
        methods = []
        old_in_class = self.in_class
        self.in_class = True
        
        while not self.check(TokenType.RIGHT_BRACE) and not self.is_at_end():
            if self.match(TokenType.NEWLINE):
                continue
            
            method = self.parse_method_definition()
            methods.append(method)
        
        self.in_class = old_in_class
        self.consume(TokenType.RIGHT_BRACE, "Expected '}' after class body")
        
        return ClassDeclaration(name, superclass, methods)
    
    def parse_method_definition(self) -> MethodDefinition:
        """Parse class method definition"""
        static = False
        if self.match(TokenType.STATIC):
            static = True
        
        # Determine method kind
        kind = 'method'
        if self.check(TokenType.IDENTIFIER) and self.peek().value == 'constructor':
            kind = 'constructor'
        
        key = Identifier(self.consume(TokenType.IDENTIFIER, "Expected method name").value)
        
        self.consume(TokenType.LEFT_PAREN, "Expected '(' after method name")
        parameters = self.parse_parameter_list()
        self.consume(TokenType.RIGHT_PAREN, "Expected ')' after method parameters")
        
        # Optional return type annotation
        return_type = None
        if self.match(TokenType.COLON):
            if self.check(TokenType.IDENTIFIER) or self.is_type_token():
                return_type = self.advance().value
        
        old_in_function = self.in_function
        self.in_function = True
        body = self.parse_block_statement()
        self.in_function = old_in_function
        
        func = FunctionDeclaration(key.name, parameters, body, return_type)
        return MethodDefinition(key, func, kind, static)
    
    def parse_mathematical_function(self) -> FunctionDeclaration:
        """Parse mathematical function: f(x) = expression"""
        name = self.consume(TokenType.IDENTIFIER, "Expected function name").value
        
        self.consume(TokenType.LEFT_PAREN, "Expected '(' after function name")
        parameters = self.parse_parameter_list()
        self.consume(TokenType.RIGHT_PAREN, "Expected ')' after parameters")
        
        self.consume(TokenType.ASSIGN, "Expected '=' in mathematical function")
        
        # Parse expression
        expr = self.parse_expression()
        
        # Create return statement
        return_stmt = ReturnStatement(expr)
        body = BlockStatement([return_stmt])
        
        self.consume_statement_terminator()
        
        return FunctionDeclaration(name, parameters, body, is_mathematical=True)
    
    def parse_parameter_list(self) -> List[Parameter]:
        """Parse function parameter list"""
        parameters = []
        
        while not self.check(TokenType.RIGHT_PAREN) and not self.is_at_end():
            if self.match(TokenType.DOT_DOT_DOT):
                # Rest parameter
                name = self.consume(TokenType.IDENTIFIER, "Expected parameter name after '...'").value
                param = Parameter(name)
                param.is_rest = True
                parameters.append(param)
                break
            
            name = self.consume(TokenType.IDENTIFIER, "Expected parameter name").value
            
            # Optional type annotation
            type_annotation = None
            if self.match(TokenType.COLON):
                if self.check(TokenType.IDENTIFIER) or self.is_type_token():
                    type_annotation = self.advance().value
            
            # Optional default value
            default_value = None
            if self.match(TokenType.ASSIGN):
                default_value = self.parse_assignment_expression()
            
            parameters.append(Parameter(name, type_annotation, default_value))
            
            if not self.match(TokenType.COMMA):
                break
        
        return parameters
    
    def parse_block_statement(self) -> BlockStatement:
        """Parse block statement: { statements }"""
        self.consume(TokenType.LEFT_BRACE, "Expected '{'")
        
        statements = []
        while not self.check(TokenType.RIGHT_BRACE) and not self.is_at_end():
            if self.match(TokenType.NEWLINE):
                continue
            
            stmt = self.parse_statement()
            if stmt:
                statements.append(stmt)
        
        self.consume(TokenType.RIGHT_BRACE, "Expected '}'")
        return BlockStatement(statements)
    
    def parse_return_statement(self) -> ReturnStatement:
        """Parse return statement"""
        if not self.in_function:
            raise ParseError("return statement outside function")
        
        argument = None
        if not self.check_statement_terminator():
            argument = self.parse_expression()
        
        self.consume_statement_terminator()
        return ReturnStatement(argument)
    
    def parse_break_statement(self) -> BreakStatement:
        """Parse break statement"""
        if not self.in_loop:
            raise ParseError("break statement outside loop")
        
        self.consume_statement_terminator()
        return BreakStatement()
    
    def parse_continue_statement(self) -> ContinueStatement:
        """Parse continue statement"""
        if not self.in_loop:
            raise ParseError("continue statement outside loop")
        
        self.consume_statement_terminator()
        return ContinueStatement()
    
    def parse_throw_statement(self) -> ThrowStatement:
        """Parse throw statement"""
        if self.check_statement_terminator():
            raise ParseError("throw statement missing expression")
        
        argument = self.parse_expression()
        self.consume_statement_terminator()
        return ThrowStatement(argument)
    
    def parse_expression_statement(self) -> ExpressionStatement:
        """Parse expression statement"""
        expr = self.parse_expression()
        self.consume_statement_terminator()
        return ExpressionStatement(expr)
    
    # Expression parsing methods
    def parse_expression(self) -> ASTNode:
        """Parse expression (assignment level)"""
        return self.parse_assignment_expression()
    
    def parse_assignment_expression(self) -> ASTNode:
        """Parse assignment expression including arrow functions"""
        # Check for arrow functions: (x, y) => body or x => body
        if self.check(TokenType.IDENTIFIER) or self.check(TokenType.LEFT_PAREN):
            # Save current position to backtrack if not an arrow function
            start_pos = self.current
            
            # Try to parse arrow function parameters
            parameters = []
            if self.match(TokenType.LEFT_PAREN):
                # Parenthesized parameters: (x, y) => body or () => body
                if not self.check(TokenType.RIGHT_PAREN):
                    # Parse parameter list
                    parameters.append(Parameter(self.consume(TokenType.IDENTIFIER, "Expected parameter name").value))
                    while self.match(TokenType.COMMA):
                        parameters.append(Parameter(self.consume(TokenType.IDENTIFIER, "Expected parameter name").value))
                
                if not self.match(TokenType.RIGHT_PAREN):
                    # Not valid arrow function syntax, backtrack
                    self.current = start_pos
                    expr = self.parse_conditional_expression()
                else:
                    # Check for arrow
                    if self.match(TokenType.ARROW):
                        # Parse arrow function body
                        body = self.parse_assignment_expression()
                        return ArrowFunctionExpression(parameters, body)
                    else:
                        # Not an arrow function, backtrack
                        self.current = start_pos
                        expr = self.parse_conditional_expression()
            elif self.check(TokenType.IDENTIFIER):
                # Single parameter without parentheses: x => body
                next_pos = self.current + 1
                if next_pos < len(self.tokens) and self.tokens[next_pos].type == TokenType.ARROW:
                    # This is an arrow function
                    param_name = self.advance().value
                    parameters.append(Parameter(param_name))
                    self.consume(TokenType.ARROW, "Expected '=>' in arrow function")
                    body = self.parse_assignment_expression()
                    return ArrowFunctionExpression(parameters, body)
                else:
                    # Not an arrow function
                    expr = self.parse_conditional_expression()
            else:
                expr = self.parse_conditional_expression()
        else:
            expr = self.parse_conditional_expression()
        
        # Check for assignment operators
        if self.match_any(TokenType.ASSIGN, TokenType.PLUS_ASSIGN, TokenType.MINUS_ASSIGN):
            operator = self.previous().value
            right = self.parse_assignment_expression()
            return AssignmentExpression(expr, operator, right)
        
        return expr
    
    def parse_conditional_expression(self) -> ASTNode:
        """Parse ternary conditional expression"""
        expr = self.parse_logical_or_expression()
        
        if self.match(TokenType.QUESTION):
            consequent = self.parse_assignment_expression()
            self.consume(TokenType.COLON, "Expected ':' after '?' in ternary")
            alternate = self.parse_assignment_expression()
            return ConditionalExpression(expr, consequent, alternate)
        
        return expr
    
    def parse_logical_or_expression(self) -> ASTNode:
        """Parse logical OR expression"""
        expr = self.parse_logical_and_expression()
        
        while self.match_any(TokenType.OR, TokenType.LOGICAL_OR):
            operator = self.previous().value
            right = self.parse_logical_and_expression()
            expr = BinaryExpression(expr, operator, right)
        
        return expr
    
    def parse_logical_and_expression(self) -> ASTNode:
        """Parse logical AND expression"""
        expr = self.parse_equality_expression()
        
        while self.match_any(TokenType.AND, TokenType.LOGICAL_AND):
            operator = self.previous().value
            right = self.parse_equality_expression()
            expr = BinaryExpression(expr, operator, right)
        
        return expr
    
    def parse_equality_expression(self) -> ASTNode:
        """Parse equality expression"""
        expr = self.parse_relational_expression()
        
        while self.match_any(TokenType.EQUAL, TokenType.NOT_EQUAL, 
                            TokenType.STRICT_EQUAL, TokenType.STRICT_NOT_EQUAL,
                            TokenType.NOT_EQUAL_UNICODE):
            operator = self.previous().value
            right = self.parse_relational_expression()
            expr = BinaryExpression(expr, operator, right)
        
        return expr
    
    def parse_relational_expression(self) -> ASTNode:
        """Parse relational expression"""
        expr = self.parse_additive_expression()
        
        while self.match_any(TokenType.LESS, TokenType.GREATER, 
                            TokenType.LESS_EQUAL, TokenType.GREATER_EQUAL,
                            TokenType.LESS_EQUAL_UNICODE, TokenType.GREATER_EQUAL_UNICODE):
            operator = self.previous().value
            right = self.parse_additive_expression()
            expr = BinaryExpression(expr, operator, right)
        
        return expr
    
    def parse_additive_expression(self) -> ASTNode:
        """Parse additive expression"""
        expr = self.parse_multiplicative_expression()
        
        while self.match_any(TokenType.PLUS, TokenType.MINUS, TokenType.MINUS_UNICODE):
            operator = self.previous().value
            right = self.parse_multiplicative_expression()
            expr = BinaryExpression(expr, operator, right)
        
        return expr
    
    def parse_multiplicative_expression(self) -> ASTNode:
        """Parse multiplicative expression"""
        expr = self.parse_unary_expression()
        
        while self.match_any(TokenType.MULTIPLY, TokenType.DIVIDE, TokenType.MODULO,
                            TokenType.MULTIPLY_UNICODE, TokenType.DIVIDE_UNICODE):
            operator = self.previous().value
            right = self.parse_unary_expression()
            expr = BinaryExpression(expr, operator, right)
        
        return expr
    
    def parse_unary_expression(self) -> ASTNode:
        """Parse unary expression"""
        if self.match_any(TokenType.NOT, TokenType.MINUS, TokenType.PLUS, 
                         TokenType.MINUS_UNICODE, TokenType.SQRT):
            operator = self.previous().value
            expr = self.parse_unary_expression()
            return UnaryExpression(operator, expr)
        
        if self.match_any(TokenType.INCREMENT, TokenType.DECREMENT):
            operator = self.previous().value
            expr = self.parse_postfix_expression()
            return UpdateExpression(operator, expr, prefix=True)
        
        return self.parse_postfix_expression()
    
    def parse_postfix_expression(self) -> ASTNode:
        """Parse postfix expression"""
        expr = self.parse_call_expression()
        
        # Handle postfix increment/decrement
        if self.match_any(TokenType.INCREMENT, TokenType.DECREMENT):
            operator = self.previous().value
            return UpdateExpression(operator, expr, prefix=False)
        
        # Handle superscript numbers as exponentiation
        if self.match(TokenType.SUPERSCRIPT_NUMBER):
            superscript_value = self.previous().value
            try:
                power = Literal(int(superscript_value))
            except ValueError:
                power = Literal(float(superscript_value))
            return BinaryExpression(expr, '^', power)
        
        return expr
    
    def parse_call_expression(self) -> ASTNode:
        """Parse call and member expressions"""
        expr = self.parse_primary_expression()
        
        while True:
            if self.match(TokenType.LEFT_PAREN):
                # Function call
                args = self.parse_argument_list()
                self.consume(TokenType.RIGHT_PAREN, "Expected ')' after arguments")
                expr = CallExpression(expr, args)
            
            elif self.match(TokenType.DOT):
                # Member access: obj.prop
                name = self.consume(TokenType.IDENTIFIER, "Expected property name after '.'").value
                expr = MemberExpression(expr, Identifier(name), computed=False)
            
            elif self.match(TokenType.LEFT_BRACKET):
                # Computed member access: obj[prop]
                prop = self.parse_expression()
                self.consume(TokenType.RIGHT_BRACKET, "Expected ']' after computed property")
                expr = MemberExpression(expr, prop, computed=True)
            
            else:
                break
        
        return expr
    
    def parse_argument_list(self) -> List[ASTNode]:
        """Parse function call argument list"""
        args = []
        
        while not self.check(TokenType.RIGHT_PAREN) and not self.is_at_end():
            if self.match(TokenType.DOT_DOT_DOT):
                # Spread argument
                arg = self.parse_assignment_expression()
                args.append(SpreadElement(arg))
            else:
                args.append(self.parse_assignment_expression())
            
            if not self.match(TokenType.COMMA):
                break
        
        return args
    
    def parse_primary_expression(self) -> ASTNode:
        """Parse primary expressions"""
        # Literals
        if self.match(TokenType.TRUE):
            return Literal(True)
        if self.match(TokenType.FALSE):
            return Literal(False)
        if self.match(TokenType.NULL):
            return Literal(None)
        if self.match(TokenType.UNDEFINED):
            return Literal(None)  # Treat as null in Lua
        
        # Numbers
        if self.match(TokenType.NUMBER):
            value = self.previous().value
            try:
                return Literal(int(value))
            except ValueError:
                return Literal(float(value))
        
        # Strings
        if self.match(TokenType.STRING):
            return Literal(self.previous().value)
        
        # Mathematical constants
        if self.match_any(TokenType.MATH_PI, TokenType.MATH_E, TokenType.MATH_PHI, TokenType.MATH_INFINITY):
            return Identifier(self.previous().value)  # Will be handled in code generation
        
        # Template literals
        if self.match_any(TokenType.TEMPLATE_STRING, TokenType.TEMPLATE_START):
            # Get the already consumed token
            first_token = self.previous()
            return self.parse_template_literal(first_token)
        
        # This keyword
        if self.match(TokenType.THIS):
            return Identifier('this')
        
        # Identifiers (with optional subscripts)
        if self.match(TokenType.IDENTIFIER):
            name = self.previous().value
            subscript = None
            
            # Check for subscript numbers after identifier
            if self.check(TokenType.SUBSCRIPT_NUMBER):
                subscript = self.advance().value
                
            return Identifier(name, subscript)
        
        # Array literals
        if self.match(TokenType.LEFT_BRACKET):
            return self.parse_array_expression()
        
        # Object literals
        if self.match(TokenType.LEFT_BRACE):
            return self.parse_object_expression()
        
        # Parenthesized expressions
        if self.match(TokenType.LEFT_PAREN):
            # Check for arrow function: (a, b) => expr
            if self.is_arrow_function():
                return self.parse_arrow_function()
            
            expr = self.parse_expression()
            self.consume(TokenType.RIGHT_PAREN, "Expected ')' after expression")
            return expr
        
        # Arrow function with single parameter: x => expr
        if self.check(TokenType.IDENTIFIER) and self.peek_ahead(1) and self.peek_ahead(1).type == TokenType.ARROW:
            return self.parse_arrow_function()
        
        # New expression
        if self.match(TokenType.NEW):
            callee = self.parse_member_expression()
            args = []
            if self.match(TokenType.LEFT_PAREN):
                args = self.parse_argument_list()
                self.consume(TokenType.RIGHT_PAREN, "Expected ')' after new arguments")
            return NewExpression(callee, args)
        
        raise ParseError(f"Unexpected token: {self.peek().value}")
    
    def parse_template_literal(self, first_token: Token = None) -> TemplateLiteral:
        """Parse template literal"""
        quasis = []
        expressions = []
        
        # Handle the already consumed first token
        if first_token and first_token.type in (TokenType.TEMPLATE_STRING, TokenType.TEMPLATE_START):
            is_tail = first_token.type == TokenType.TEMPLATE_END
            quasis.append(TemplateElement(first_token.value, is_tail))
            
            if is_tail:
                return TemplateLiteral(quasis, expressions)
        
        # Handle different template token types
        while (self.check_any(TokenType.TEMPLATE_STRING, TokenType.TEMPLATE_START,
                             TokenType.TEMPLATE_MIDDLE, TokenType.TEMPLATE_END,
                             TokenType.TEMPLATE_EXPRESSION) and not self.is_at_end()):
            
            if self.match(TokenType.TEMPLATE_EXPRESSION):
                # Expression inside ${}
                expr_text = self.previous().value
                # Parse the expression text as an actual expression
                if expr_text.strip():
                    # For now, treat simple identifiers correctly
                    if expr_text.isidentifier():
                        expressions.append(Identifier(expr_text))
                    else:
                        # More complex expressions would need proper parsing
                        expressions.append(Literal(expr_text))
            elif self.match_any(TokenType.TEMPLATE_START, TokenType.TEMPLATE_MIDDLE, 
                               TokenType.TEMPLATE_END, TokenType.TEMPLATE_STRING):
                # Template text parts
                text = self.previous().value
                is_tail = self.previous().type == TokenType.TEMPLATE_END
                quasis.append(TemplateElement(text, is_tail))
                
                if is_tail:
                    break
        
        return TemplateLiteral(quasis, expressions)
    
    def parse_array_expression(self) -> ArrayExpression:
        """Parse array literal"""
        elements = []
        
        while not self.check(TokenType.RIGHT_BRACKET) and not self.is_at_end():
            if self.match(TokenType.COMMA):
                # Hole in array
                elements.append(None)
            elif self.match(TokenType.DOT_DOT_DOT):
                # Spread element
                expr = self.parse_assignment_expression()
                elements.append(SpreadElement(expr))
            else:
                elements.append(self.parse_assignment_expression())
            
            if not self.match(TokenType.COMMA):
                break
        
        self.consume(TokenType.RIGHT_BRACKET, "Expected ']' after array elements")
        return ArrayExpression(elements)
    
    def parse_object_expression(self) -> ObjectExpression:
        """Parse object literal"""
        properties = []
        
        while not self.check(TokenType.RIGHT_BRACE) and not self.is_at_end():
            if self.match(TokenType.DOT_DOT_DOT):
                # Spread properties
                expr = self.parse_assignment_expression()
                # Handle as special property for now
                properties.append(Property(Literal("..."), expr))
            else:
                prop = self.parse_property()
                properties.append(prop)
            
            if not self.match(TokenType.COMMA):
                break
        
        self.consume(TokenType.RIGHT_BRACE, "Expected '}' after object properties")
        return ObjectExpression(properties)
    
    def parse_property(self) -> Property:
        """Parse object property"""
        # Computed property: [key]: value
        computed = False
        if self.match(TokenType.LEFT_BRACKET):
            computed = True
            key = self.parse_expression()
            self.consume(TokenType.RIGHT_BRACKET, "Expected ']' after computed property")
        else:
            # Regular property key
            if self.check(TokenType.IDENTIFIER):
                key = Identifier(self.advance().value)
            elif self.check(TokenType.STRING):
                key = Literal(self.advance().value)
            elif self.check(TokenType.NUMBER):
                key = Literal(self.advance().value)
            else:
                raise ParseError("Expected property name")
        
        # Check for shorthand: {x} instead of {x: x}
        if isinstance(key, Identifier) and not computed and not self.check(TokenType.COLON):
            return Property(key, key, shorthand=True)
        
        # Method definition: {method() {}}
        if self.match(TokenType.LEFT_PAREN):
            parameters = self.parse_parameter_list()
            self.consume(TokenType.RIGHT_PAREN, "Expected ')' after method parameters")
            body = self.parse_block_statement()
            
            func = FunctionDeclaration(key.name if isinstance(key, Identifier) else str(key.value),
                                     parameters, body)
            return Property(key, func, method=True, computed=computed)
        
        # Regular property: {key: value}
        self.consume(TokenType.COLON, "Expected ':' after property key")
        value = self.parse_assignment_expression()
        
        return Property(key, value, computed=computed)
    
    def parse_arrow_function(self) -> ArrowFunctionExpression:
        """Parse arrow function"""
        parameters = []
        
        if self.check(TokenType.LEFT_PAREN):
            # Multiple parameters: (a, b) => expr
            self.advance()  # consume (
            parameters = self.parse_parameter_list()
            self.consume(TokenType.RIGHT_PAREN, "Expected ')' after arrow function parameters")
        else:
            # Single parameter: x => expr
            name = self.consume(TokenType.IDENTIFIER, "Expected parameter name").value
            parameters = [Parameter(name)]
        
        self.consume(TokenType.ARROW, "Expected '=>' in arrow function")
        
        # Parse body (expression or block)
        if self.check(TokenType.LEFT_BRACE):
            body = self.parse_block_statement()
        else:
            # Expression body - wrap in return statement
            expr = self.parse_assignment_expression()
            body = expr
        
        return ArrowFunctionExpression(parameters, body)
    
    def parse_member_expression(self) -> ASTNode:
        """Parse member expression for new operator"""
        expr = self.parse_primary_expression()
        
        while self.match_any(TokenType.DOT, TokenType.LEFT_BRACKET):
            if self.previous().type == TokenType.DOT:
                name = self.consume(TokenType.IDENTIFIER, "Expected property name").value
                expr = MemberExpression(expr, Identifier(name), computed=False)
            else:
                prop = self.parse_expression()
                self.consume(TokenType.RIGHT_BRACKET, "Expected ']'")
                expr = MemberExpression(expr, prop, computed=True)
        
        return expr
    
    def parse_array_pattern(self) -> ArrayPattern:
        """Parse array destructuring pattern: [a, b, c]"""
        self.consume(TokenType.LEFT_BRACKET, "Expected '['")
        elements = []
        
        while not self.check(TokenType.RIGHT_BRACKET) and not self.is_at_end():
            if self.match(TokenType.COMMA):
                # Hole in array pattern: [a, , c]
                elements.append(None)
            elif self.match(TokenType.DOT_DOT_DOT):
                # Rest element: [...rest]
                name = self.consume(TokenType.IDENTIFIER, "Expected identifier after '...'").value
                elements.append(RestElement(Identifier(name)))
                break  # Rest element must be last
            else:
                # Regular identifier or nested pattern
                if self.check(TokenType.IDENTIFIER):
                    name = self.advance().value
                    elements.append(Identifier(name))
                elif self.check(TokenType.LEFT_BRACKET):
                    # Nested array pattern: [a, [b, c]]
                    elements.append(self.parse_array_pattern())
                elif self.check(TokenType.LEFT_BRACE):
                    # Nested object pattern: [a, {b, c}]
                    elements.append(self.parse_object_pattern())
                else:
                    raise ParseError("Expected identifier or pattern in array destructuring")
            
            if not self.check(TokenType.RIGHT_BRACKET):
                if not self.match(TokenType.COMMA):
                    break
        
        self.consume(TokenType.RIGHT_BRACKET, "Expected ']'")
        return ArrayPattern(elements)
    
    def parse_object_pattern(self) -> ObjectPattern:
        """Parse object destructuring pattern: {x, y, z: newName}"""
        self.consume(TokenType.LEFT_BRACE, "Expected '{'")
        properties = []
        
        while not self.check(TokenType.RIGHT_BRACE) and not self.is_at_end():
            if self.match(TokenType.DOT_DOT_DOT):
                # Rest element: {...rest}
                name = self.consume(TokenType.IDENTIFIER, "Expected identifier after '...'").value
                properties.append(RestElement(Identifier(name)))
                break  # Rest element must be last
            else:
                # Property: x or x: newName
                key_name = self.consume(TokenType.IDENTIFIER, "Expected property name").value
                key = Identifier(key_name)
                
                if self.match(TokenType.COLON):
                    # Renamed property: x: newName
                    if self.check(TokenType.IDENTIFIER):
                        value = Identifier(self.advance().value)
                    elif self.check(TokenType.LEFT_BRACKET):
                        value = self.parse_array_pattern()
                    elif self.check(TokenType.LEFT_BRACE):
                        value = self.parse_object_pattern()
                    else:
                        raise ParseError("Expected identifier or pattern after ':'")
                    
                    properties.append(Property(key, value, shorthand=False))
                else:
                    # Shorthand property: {x} same as {x: x}
                    properties.append(Property(key, key, shorthand=True))
            
            if not self.check(TokenType.RIGHT_BRACE):
                if not self.match(TokenType.COMMA):
                    break
        
        self.consume(TokenType.RIGHT_BRACE, "Expected '}'")
        return ObjectPattern(properties)

    def parse_variable_declaration_or_identifier(self) -> ASTNode:
        """Parse variable declaration or identifier for for-of loops"""
        if self.match_any(TokenType.LET, TokenType.CONST, TokenType.VAR):
            kind = self.previous().value
            name = self.consume(TokenType.IDENTIFIER, "Expected identifier").value
            return VariableDeclaration(kind, [VariableDeclarator(Identifier(name))])
        else:
            name = self.consume(TokenType.IDENTIFIER, "Expected identifier").value
            return Identifier(name)
    
    # Helper methods
    def is_mathematical_function(self) -> bool:
        """Check if current position is mathematical function: f(x) = expr"""
        if not self.check(TokenType.IDENTIFIER):
            return False
        if not self.peek_ahead(1) or self.peek_ahead(1).type != TokenType.LEFT_PAREN:
            return False
        
        # Look for = after parameter list
        i = self.current + 2
        paren_count = 1
        while i < len(self.tokens) and paren_count > 0:
            if self.tokens[i].type == TokenType.LEFT_PAREN:
                paren_count += 1
            elif self.tokens[i].type == TokenType.RIGHT_PAREN:
                paren_count -= 1
            i += 1
        
        return i < len(self.tokens) and self.tokens[i].type == TokenType.ASSIGN
    
    def is_arrow_function(self) -> bool:
        """Check if current position is arrow function"""
        # Look ahead for => after parameter list
        i = self.current
        if self.tokens[i].type == TokenType.LEFT_PAREN:
            paren_count = 1
            i += 1
            while i < len(self.tokens) and paren_count > 0:
                if self.tokens[i].type == TokenType.LEFT_PAREN:
                    paren_count += 1
                elif self.tokens[i].type == TokenType.RIGHT_PAREN:
                    paren_count -= 1
                i += 1
        
        return i < len(self.tokens) and self.tokens[i].type == TokenType.ARROW
    
    def match(self, token_type: TokenType) -> bool:
        """Check if current token matches type and advance if so"""
        if self.check(token_type):
            self.advance()
            return True
        return False
    
    def match_any(self, *token_types: TokenType) -> bool:
        """Check if current token matches any of the given types"""
        for token_type in token_types:
            if self.check(token_type):
                self.advance()
                return True
        return False
    
    def check(self, token_type: TokenType) -> bool:
        """Check if current token is of given type"""
        if self.is_at_end():
            return False
        return self.peek().type == token_type
    
    def check_any(self, *token_types: TokenType) -> bool:
        """Check if current token matches any of the given types"""
        return any(self.check(token_type) for token_type in token_types)
    
    def check_statement_terminator(self) -> bool:
        """Check for statement terminator (newline, semicolon, or EOF)"""
        return self.check_any(TokenType.NEWLINE, TokenType.SEMICOLON, TokenType.EOF)
    
    def check_type_token(self) -> bool:
        """Check if current token is a built-in type token"""
        type_tokens = {
            TokenType.INT8, TokenType.INT16, TokenType.INT32, TokenType.INT64,
            TokenType.UINT8, TokenType.UINT16, TokenType.UINT32, TokenType.UINT64,
            TokenType.FLOAT32, TokenType.FLOAT64, TokenType.REAL, TokenType.COMPLEX
        }
        return self.check_any(*type_tokens)
    
    def parse_type_annotation(self) -> str:
        """Parse type annotation including generic types like Array<int32>"""
        # Parse the base type (identifier or built-in type)
        if self.check(TokenType.IDENTIFIER):
            base_type = self.advance().value
        elif self.check_type_token():
            base_type = self.advance().value
        else:
            raise ParseError("Expected type in type annotation")
        
        # Check for generic type parameters <T>
        if self.match(TokenType.LESS):
            generic_args = []
            
            # Parse first type argument
            generic_args.append(self.parse_type_annotation())
            
            # Parse additional type arguments separated by commas
            while self.match(TokenType.COMMA):
                generic_args.append(self.parse_type_annotation())
            
            self.consume(TokenType.GREATER, "Expected '>' after generic type arguments")
            
            # Build generic type string
            args_str = ", ".join(generic_args)
            return f"{base_type}<{args_str}>"
        else:
            return base_type
    
    def advance(self) -> Token:
        """Consume current token and return it"""
        if not self.is_at_end():
            self.current += 1
        return self.previous()
    
    def is_at_end(self) -> bool:
        """Check if we're at end of tokens"""
        return self.current >= len(self.tokens) or self.peek().type == TokenType.EOF
    
    def peek(self) -> Token:
        """Return current token without advancing"""
        if self.current >= len(self.tokens):
            return Token(TokenType.EOF, "", self.current, self.current)
        return self.tokens[self.current]
    
    def peek_ahead(self, distance: int) -> Optional[Token]:
        """Look ahead by distance tokens"""
        pos = self.current + distance
        if pos >= len(self.tokens):
            return None
        return self.tokens[pos]
    
    def previous(self) -> Token:
        """Return previous token"""
        if self.current > 0:
            return self.tokens[self.current - 1]
        return self.tokens[0]
    
    def consume(self, token_type: TokenType, message: str) -> Token:
        """Consume token of expected type or raise error"""
        if self.check(token_type):
            return self.advance()
        
        current_token = self.peek()
        raise ParseError(f"{message}. Got {current_token.type.name}: '{current_token.value}'")
    
    def consume_statement_terminator(self):
        """Consume statement terminator (optional)"""
        self.match_any(TokenType.SEMICOLON, TokenType.NEWLINE)

# Main parsing function
def parse_source(source: str, filename: str = "<string>") -> Program:
    """Parse LUASCRIPT source code into AST"""
    parser = EnhancedParser()
    return parser.parse(source, filename)

if __name__ == "__main__":
    # Test the parser with sample code
    test_code = """
    let x = 5;
    const PI = 3.14159;
    
    function add(a, b) {
        return a + b;
    }
    
    class Vector {
        constructor(x, y) {
            this.x = x;
            this.y = y;
        }
        
        magnitude() {
            return √(this.x² + this.y²);
        }
    }
    
    let v = new Vector(3, 4);
    console.log(v.magnitude());
    """
    
    try:
        ast = parse_source(test_code, "test.ls")
        print("✅ Parsing successful!")
        print(f"📊 Generated AST with {len(ast.statements)} top-level statements")
    except ParseError as e:
        print(f"❌ Parse error: {e}")
