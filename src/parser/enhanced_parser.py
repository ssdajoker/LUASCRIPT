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
from dataclasses import dataclass, field
from copy import deepcopy
import sys
import os

# Import token types from enhanced lexer
sys.path.append(os.path.join(os.path.dirname(__file__), '../lexer'))
from enhanced_lexer import Token, TokenType, tokenize_source

KNOWN_LUASCRIPT_DIAGNOSTICS = {
    "async_unsupported": "async is not supported in LuaScript V0",
    "lua_continue_no_compatible_lowering": "No policy-compatible lowering for continue on lua target",
    "js_prototype_forbidden": "Forbidden capability used by meta policy: js.prototype",
}

LUASCRIPT_PROFILE_DEFINITIONS = {
    "portable_v1": {
        "targets": {
            "lua": {
                "requires": ["lua.goto"],
                "adapters": {
                    "indexing": "zero_based",
                    "length": "array_length_property",
                    "slicing": "runtime_slice",
                    "truthiness": "js_truthy",
                    "string_coercion": "explicit_tostring",
                    "multiple_returns": "packed_array",
                },
                "diagnostics": {
                    "async": KNOWN_LUASCRIPT_DIAGNOSTICS["async_unsupported"],
                },
            },
            "javascript": {
                "requires": ["js.console"],
                "adapters": {
                    "truthiness": "js_truthy",
                },
                "diagnostics": {
                    "async": KNOWN_LUASCRIPT_DIAGNOSTICS["async_unsupported"],
                },
            },
            "python": {
                "requires": ["python.print"],
                "forbid": ["python.imports"],
                "adapters": {
                    "indexing": "zero_based",
                    "length": "array_length_property",
                    "slicing": "runtime_slice",
                    "truthiness": "js_truthy",
                    "string_coercion": "explicit_tostring",
                    "multiple_returns": "packed_array",
                },
                "diagnostics": {
                    "async": KNOWN_LUASCRIPT_DIAGNOSTICS["async_unsupported"],
                },
            },
            "luascript": {
                "requires": ["js.console"],
                "forbid": ["js.prototype"],
                "adapters": {
                    "indexing": "zero_based",
                    "length": "array_length_property",
                    "slicing": "runtime_slice",
                    "truthiness": "js_truthy",
                    "string_coercion": "explicit_tostring",
                    "multiple_returns": "packed_array",
                },
                "diagnostics": {
                    "async": KNOWN_LUASCRIPT_DIAGNOSTICS["async_unsupported"],
                },
            },
        }
    },
    "portable_semantics_v1": {
        "targets": {
            "lua": {
                "adapters": {
                    "indexing": "zero_based",
                    "length": "array_length_property",
                    "slicing": "runtime_slice",
                    "truthiness": "js_truthy",
                    "string_coercion": "explicit_tostring",
                    "multiple_returns": "packed_array",
                },
            },
            "javascript": {
                "requires": ["js.console"],
                "adapters": {
                    "indexing": "zero_based",
                    "length": "array_length_property",
                    "slicing": "runtime_slice",
                    "truthiness": "js_truthy",
                    "string_coercion": "explicit_tostring",
                    "multiple_returns": "packed_array",
                },
            },
            "python": {
                "requires": ["python.print"],
                "forbid": ["python.imports"],
                "adapters": {
                    "indexing": "zero_based",
                    "length": "array_length_property",
                    "slicing": "runtime_slice",
                    "truthiness": "js_truthy",
                    "string_coercion": "explicit_tostring",
                    "multiple_returns": "packed_array",
                },
            },
            "luascript": {
                "requires": ["js.console"],
                "forbid": ["js.prototype"],
                "adapters": {
                    "indexing": "zero_based",
                    "length": "array_length_property",
                    "slicing": "runtime_slice",
                    "truthiness": "js_truthy",
                    "string_coercion": "explicit_tostring",
                    "multiple_returns": "packed_array",
                },
            },
        }
    }
}

def merge_unique_list(existing: Optional[List[str]], incoming: Optional[List[str]]) -> List[str]:
    return list(dict.fromkeys(list(existing or []) + list(incoming or [])))

def merge_luascript_target_policy(target_policy: Dict[str, Any], incoming_policy: Dict[str, Any]) -> Dict[str, Any]:
    if not incoming_policy:
        return target_policy

    target_policy["requires"] = merge_unique_list(target_policy.get("requires"), incoming_policy.get("requires"))
    target_policy["forbid"] = merge_unique_list(target_policy.get("forbid"), incoming_policy.get("forbid"))
    target_policy["resolve"] = {**target_policy.get("resolve", {}), **incoming_policy.get("resolve", {})}
    target_policy["adapters"] = {**target_policy.get("adapters", {}), **incoming_policy.get("adapters", {})}
    target_policy["diagnostics"] = {**target_policy.get("diagnostics", {}), **incoming_policy.get("diagnostics", {})}
    target_policy["repairs"] = {**target_policy.get("repairs", {}), **incoming_policy.get("repairs", {})}
    return target_policy

def apply_luascript_profile_to_policy(
    policy: Dict[str, Any],
    profile_name: str,
    *,
    record_profile: bool = True,
    record_implicit: bool = False,
) -> None:
    profile = LUASCRIPT_PROFILE_DEFINITIONS.get(profile_name)
    if profile is None:
        raise ParseError(f"Unsupported meta profile: {profile_name}")

    if record_profile and profile_name not in policy["profiles"]:
        policy["profiles"].append(profile_name)
    if record_implicit:
        implicit_profiles = policy.setdefault("implicitProfiles", [])
        if profile_name not in implicit_profiles:
            implicit_profiles.append(profile_name)

    for target_name, target_policy in profile.get("targets", {}).items():
        merged = policy["targets"].setdefault(target_name, {})
        merge_luascript_target_policy(merged, deepcopy(target_policy))

# Enhanced AST Node definitions for full JavaScript-like syntax
class ASTNode:
    """Base class for all AST nodes"""
    pass

@dataclass
class Program(ASTNode):
    """Root program node containing all statements"""
    statements: List[ASTNode]
    meta_policy: Optional[Dict[str, Any]] = None
    verify_policy: Optional[Dict[str, Any]] = None

@dataclass
class ParseArtifact:
    """Parser-owned artifact used by compiler, tests, and harnesses."""
    program: Program
    tokens: List[Token]
    meta_policy: Dict[str, Any]
    verify_policy: Dict[str, Any]
    feature_slices: Set[str]

@dataclass
class MetaBlock(ASTNode):
    """Compile-time LUASCRIPT meta block."""
    targets: List['TargetBlock']
    profiles: List[str] = field(default_factory=list)

@dataclass
class TargetBlock(ASTNode):
    """Target-specific compile-time policies."""
    name: str
    policies: List[ASTNode]

@dataclass
class ResolvePolicy(ASTNode):
    """Feature resolver policy for a target."""
    capability: str
    strategy: str

@dataclass
class DiagnosticPolicy(ASTNode):
    """Unsupported-feature diagnostic policy for a target."""
    feature: str
    status: str
    message: str

@dataclass
class RequiresPolicy(ASTNode):
    """Required target capability policy."""
    capability: str

@dataclass
class ForbidPolicy(ASTNode):
    """Forbidden target capability policy."""
    capability: str

@dataclass
class AdapterPolicy(ASTNode):
    """Semantic adapter policy for a target."""
    feature: str
    strategy: str

@dataclass
class RepairBlock(ASTNode):
    """Compile-time canonical repair block."""
    targets: List['TargetBlock']

@dataclass
class RepairPolicy(ASTNode):
    """Canonical lowering repair policy for a target."""
    feature: str
    strategy: str

@dataclass
class VerifyBlock(ASTNode):
    """Compile-time verification assertions for local harnesses."""
    assertions: List[ASTNode]

@dataclass
class VerifyStdout(ASTNode):
    expected: str

@dataclass
class VerifyDiagnostic(ASTNode):
    expected: str

@dataclass
class VerifyFeature(ASTNode):
    expected: str

@dataclass
class VerifyNoFeature(ASTNode):
    unexpected: str

@dataclass
class VerifyProfile(ASTNode):
    expected: str

@dataclass
class VerifyNoProfile(ASTNode):
    unexpected: str

@dataclass
class VerifyImplicitProfile(ASTNode):
    expected: str

@dataclass
class VerifyNoImplicitProfile(ASTNode):
    unexpected: str

@dataclass
class VerifyLuaStdout(ASTNode):
    expected: str

@dataclass
class VerifyLuaRuntimeError(ASTNode):
    expected: str

@dataclass
class VerifyLuaPolicy(ASTNode):
    expected: str

@dataclass
class VerifyLuaNotPolicy(ASTNode):
    unexpected: str

@dataclass
class VerifyLuaRepair(ASTNode):
    expected: str

@dataclass
class VerifyJavaScriptPolicy(ASTNode):
    expected: str

@dataclass
class VerifyJavaScriptNotPolicy(ASTNode):
    unexpected: str

@dataclass
class VerifyJavaScriptRepair(ASTNode):
    expected: str

@dataclass
class VerifyPythonPolicy(ASTNode):
    expected: str

@dataclass
class VerifyPythonNotPolicy(ASTNode):
    unexpected: str

@dataclass
class VerifyPythonRepair(ASTNode):
    expected: str

@dataclass
class VerifyPythonStdout(ASTNode):
    expected: str

@dataclass
class VerifyPythonRuntimeError(ASTNode):
    expected: str

@dataclass
class VerifyPythonContains(ASTNode):
    expected: str

@dataclass
class VerifyPythonNotContains(ASTNode):
    unexpected: str

@dataclass
class VerifyLuaContains(ASTNode):
    expected: str

@dataclass
class VerifyLuaNotContains(ASTNode):
    unexpected: str

@dataclass
class VerifyJavaScriptContains(ASTNode):
    expected: str

@dataclass
class VerifyJavaScriptStdout(ASTNode):
    expected: str

@dataclass
class VerifyJavaScriptRuntimeError(ASTNode):
    expected: str

@dataclass
class VerifyJavaScriptNotContains(ASTNode):
    unexpected: str

@dataclass
class VerifyLuascriptContains(ASTNode):
    expected: str

@dataclass
class VerifyLuascriptStdout(ASTNode):
    expected: str

@dataclass
class VerifyLuascriptRuntimeError(ASTNode):
    expected: str

@dataclass
class VerifyLuascriptNotContains(ASTNode):
    unexpected: str

@dataclass
class VerifyLuascriptPolicy(ASTNode):
    expected: str

@dataclass
class VerifyLuascriptNotPolicy(ASTNode):
    unexpected: str

@dataclass
class VerifyLuascriptRepair(ASTNode):
    expected: str

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

@dataclass
class PipelineExpression(ASTNode):
    """Pipeline expression: value |> transform"""
    left: ASTNode
    right: ASTNode

@dataclass
class CompositionExpression(ASTNode):
    """Function composition expression: f ∘ g or f ⊙ g"""
    left: ASTNode
    operator: str
    right: ASTNode

@dataclass
class OperatorSectionExpression(ASTNode):
    """Binary operator section used as a function: (+), (×), (mod)"""
    operator: str

@dataclass
class RangeExpression(ASTNode):
    """Range expression inside array literals: [start..end]"""
    start: ASTNode
    end: ASTNode
    step: Optional[ASTNode] = None
    inclusive: bool = True

@dataclass
class LimitDirection(ASTNode):
    """Mathematical limit direction: n → ∞"""
    variable: 'Identifier'
    target: ASTNode

@dataclass
class MathBinderExpression(ASTNode):
    """Mathematical binder expression: ∑[n = 1..5](n²)."""
    operator: str
    variable: 'Identifier'
    lower: ASTNode
    upper: ASTNode
    body: ASTNode
    step_or_resolution: Optional[ASTNode] = None

@dataclass
class MathDerivativeExpression(ASTNode):
    """Native derivative expression: ∂_{x=2}(x³)."""
    variable: 'Identifier'
    point: ASTNode
    body: ASTNode
    step: Optional[ASTNode] = None

@dataclass
class MathLimitExpression(ASTNode):
    """Native limit expression: lim_{n→∞}((1 + 1/n)^n)."""
    direction: LimitDirection
    body: ASTNode

@dataclass
class LetInExpression(ASTNode):
    """Mathematical let-in expression: let x = value in expr"""
    bindings: List['VariableDeclarator']
    body: ASTNode

@dataclass
class SequenceExpression(ASTNode):
    """Comma-separated expression sequence where the final expression is the value"""
    expressions: List[ASTNode]

@dataclass
class CompositionFunctionDeclaration(ASTNode):
    """Mathematical composition declaration: (f ∘ g)(x) = f(g(x))"""
    operator: str
    left_name: str
    right_name: str
    parameters: List['Parameter']

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
        self.block_depth = 0
        self.seen_executable_statement = False
        self.meta_policy: Dict[str, Any] = {
            "targets": {},
            "profiles": [],
            "declaredTargets": {},
            "implicitProfiles": [],
        }
        apply_luascript_profile_to_policy(
            self.meta_policy,
            "portable_semantics_v1",
            record_profile=False,
            record_implicit=True,
        )
        self.verify_policy: Dict[str, Any] = {}
        self.stop_before_integral_differential = False
    
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

            if self.check_any(TokenType.META, TokenType.REPAIR, TokenType.VERIFY) and self.seen_executable_statement:
                raise ParseError("compile-time blocks must appear before executable statements", self.peek())

            stmt = self.parse_statement()
            if stmt:
                statements.append(stmt)
                if not isinstance(stmt, (MetaBlock, RepairBlock)):
                    if isinstance(stmt, VerifyBlock):
                        continue
                    self.seen_executable_statement = True
                
        return Program(statements, self.meta_policy, self.verify_policy)
    
    def parse_statement(self) -> Optional[ASTNode]:
        """Parse any statement"""
        try:
            # Variable declarations
            if self.match(TokenType.META):
                if self.block_depth != 0:
                    raise ParseError("meta blocks are only supported at top level in LUASCRIPT V0")
                if self.check(TokenType.IDENTIFIER) and self.peek().value == "profile":
                    return self.parse_meta_profile_statement()
                return self.parse_meta_block()

            if self.match(TokenType.REPAIR):
                if self.block_depth != 0:
                    raise ParseError("repair blocks are only supported at top level in LUASCRIPT V0")
                return self.parse_repair_block()

            if self.match(TokenType.VERIFY):
                if self.block_depth != 0:
                    raise ParseError("verify blocks are only supported at top level in LUASCRIPT V0")
                return self.parse_verify_block()

            if self.check(TokenType.ASYNC):
                self.raise_configured_diagnostic("async")

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

            # Mathematical composition declaration: (f ∘ g)(x) = expr
            elif self.is_composition_function():
                return self.parse_composition_function()
            
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
                id_node = Identifier(self.parse_identifier_name("Expected identifier in declaration"))
                
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

    def parse_meta_block(self) -> MetaBlock:
        """Parse a top-level compile-time meta block."""
        self.consume(TokenType.LEFT_BRACE, "Expected '{' after 'meta'")
        targets = []

        while not self.check(TokenType.RIGHT_BRACE) and not self.is_at_end():
            if self.match(TokenType.NEWLINE):
                continue
            targets.append(self.parse_target_block())

        self.consume(TokenType.RIGHT_BRACE, "Expected '}' after meta block")
        return MetaBlock(targets)

    def parse_meta_profile_statement(self) -> MetaBlock:
        """Parse meta profile <name>; and expand it into target policies."""
        profile_keyword = self.consume(TokenType.IDENTIFIER, "Expected 'profile' after 'meta'").value
        if profile_keyword != "profile":
            raise ParseError(f"Expected 'profile' after 'meta'. Got '{profile_keyword}'")

        profile_name = self.consume_policy_name("Expected meta profile name")
        self.consume_statement_terminator()
        apply_luascript_profile_to_policy(self.meta_policy, profile_name)

        return MetaBlock([], [profile_name])

    def parse_target_block(self) -> TargetBlock:
        """Parse target <name> { ... } inside a meta block."""
        self.consume(TokenType.TARGET, "Expected 'target' in meta block")
        target_name = self.consume_policy_name("Expected target name")
        if target_name not in {"lua", "javascript", "python", "luascript"}:
            raise ParseError(f"Unsupported meta target: {target_name}")

        self.consume(TokenType.LEFT_BRACE, "Expected '{' after meta target")
        policies = []

        while not self.check(TokenType.RIGHT_BRACE) and not self.is_at_end():
            if self.match(TokenType.NEWLINE):
                continue

            if self.check(TokenType.RESOLVE):
                policies.append(self.parse_resolve_policy(target_name))
            elif self.check(TokenType.DIAGNOSE):
                policies.append(self.parse_diagnostic_policy(target_name))
            elif self.check(TokenType.REQUIRES):
                policies.append(self.parse_requires_policy(target_name))
            elif self.check(TokenType.FORBID):
                policies.append(self.parse_forbid_policy(target_name))
            elif self.check(TokenType.ADAPT):
                policies.append(self.parse_adapter_policy(target_name))
            else:
                raise ParseError(f"Expected 'resolve', 'diagnose', 'requires', 'forbid', or 'adapt' in target {target_name} block. Got {self.peek().value}")

        self.consume(TokenType.RIGHT_BRACE, "Expected '}' after meta target block")
        self.validate_target_capabilities(target_name)
        return TargetBlock(target_name, policies)

    def ensure_target_policy_pair(self, target_name: str) -> Tuple[Dict[str, Any], Dict[str, Any]]:
        effective = self.meta_policy["targets"].setdefault(target_name, {})
        declared = self.meta_policy.setdefault("declaredTargets", {}).setdefault(target_name, {})
        return effective, declared

    def validate_target_capabilities(self, target_name: str):
        """Validate capability policy relationships after a target block is parsed."""
        target_policy = self.meta_policy.get("targets", {}).get(target_name, {})
        requires = set(target_policy.get("requires", []))
        forbid = set(target_policy.get("forbid", []))
        resolve = target_policy.get("resolve", {})

        if requires.intersection(forbid):
            capability = sorted(requires.intersection(forbid))[0]
            raise ParseError(f"Conflicting capability policy: {capability} is both required and forbidden")

        if target_name == "lua" and resolve.get("continue") == "label_goto" and "lua.goto" not in requires:
            raise ParseError("resolve continue using label_goto requires lua.goto")

        if target_name == "lua" and resolve.get("continue") == "label_goto" and "lua.goto" in forbid:
            raise ParseError("Forbidden capability used by meta policy: lua.goto")

    def parse_resolve_policy(self, target_name: str) -> ResolvePolicy:
        """Parse resolve <capability> using <strategy>;."""
        self.consume(TokenType.RESOLVE, "Expected 'resolve'")
        capability = self.consume_policy_name("Expected resolver capability")
        self.consume(TokenType.USING, "Expected 'using' after resolver capability")
        strategy = self.consume_policy_name("Expected resolver strategy")
        self.consume_statement_terminator()

        allowed_strategies = {
            "lua": {"continue": "label_goto"},
            "javascript": {"continue": "native_continue"},
            "python": {"continue": "native_continue"},
            "luascript": {"continue": "native_continue"},
        }
        allowed_strategy = allowed_strategies.get(target_name, {}).get(capability)
        if not allowed_strategy:
            raise ParseError(f"Unsupported meta resolver: {capability}")
        if strategy != allowed_strategy:
            raise ParseError(f"Unsupported meta strategy for {capability}: {strategy}")

        effective_policy, declared_policy = self.ensure_target_policy_pair(target_name)
        effective_policy.setdefault("resolve", {})[capability] = strategy
        declared_policy.setdefault("resolve", {})[capability] = strategy
        return ResolvePolicy(capability, strategy)

    def parse_diagnostic_policy(self, target_name: str) -> DiagnosticPolicy:
        """Parse diagnose <feature> as unsupported "message";."""
        self.consume(TokenType.DIAGNOSE, "Expected 'diagnose'")
        feature = self.consume_policy_name("Expected diagnostic feature")
        self.consume(TokenType.AS, "Expected 'as' after diagnostic feature")
        status = self.consume_policy_name("Expected diagnostic status")
        message = self.consume(TokenType.STRING, "Expected diagnostic message").value
        self.consume_statement_terminator()

        if feature != "async":
            raise ParseError(f"Unsupported meta diagnostic feature: {feature}")
        if status != "unsupported":
            raise ParseError(f"Unsupported meta diagnostic status for {feature}: {status}")

        effective_policy, declared_policy = self.ensure_target_policy_pair(target_name)
        effective_policy.setdefault("diagnostics", {})[feature] = message
        declared_policy.setdefault("diagnostics", {})[feature] = message
        return DiagnosticPolicy(feature, status, message)

    def parse_requires_policy(self, target_name: str) -> RequiresPolicy:
        """Parse requires <capability>;."""
        self.consume(TokenType.REQUIRES, "Expected 'requires'")
        capability = self.consume_dotted_policy_name("Expected required capability")
        self.consume_statement_terminator()

        allowed = {
            "lua": {"lua.goto"},
            "javascript": {"js.console"},
            "python": {"python.print"},
            "luascript": {"js.console"},
        }.get(target_name, set())
        if capability not in allowed:
            raise ParseError(f"Unsupported required capability for {target_name}: {capability}")

        effective_policy, declared_policy = self.ensure_target_policy_pair(target_name)
        effective_policy["requires"] = merge_unique_list(effective_policy.get("requires"), [capability])
        declared_policy["requires"] = merge_unique_list(declared_policy.get("requires"), [capability])
        return RequiresPolicy(capability)

    def parse_forbid_policy(self, target_name: str) -> ForbidPolicy:
        """Parse forbid <capability>;."""
        self.consume(TokenType.FORBID, "Expected 'forbid'")
        capability = self.consume_dotted_policy_name("Expected forbidden capability")
        self.consume_statement_terminator()

        allowed = {
            "lua": {"js.prototype", "lua.goto"},
            "javascript": {"js.prototype"},
            "python": {"python.imports"},
            "luascript": {"js.prototype"},
        }.get(target_name, set())
        if capability not in allowed:
            raise ParseError(f"Unsupported forbidden capability for {target_name}: {capability}")

        effective_policy, declared_policy = self.ensure_target_policy_pair(target_name)
        effective_policy["forbid"] = merge_unique_list(effective_policy.get("forbid"), [capability])
        declared_policy["forbid"] = merge_unique_list(declared_policy.get("forbid"), [capability])
        return ForbidPolicy(capability)

    def parse_adapter_policy(self, target_name: str) -> AdapterPolicy:
        """Parse adapt <feature> using <strategy>;."""
        self.consume(TokenType.ADAPT, "Expected 'adapt'")
        feature = self.consume_policy_name("Expected adapter feature")
        self.consume(TokenType.USING, "Expected 'using' after adapter feature")
        strategy = self.consume_policy_name("Expected adapter strategy")
        self.consume_statement_terminator()

        allowed = {
            "indexing": "zero_based",
            "length": "array_length_property",
            "slicing": "runtime_slice",
            "truthiness": "js_truthy",
            "string_coercion": "explicit_tostring",
            "multiple_returns": "packed_array",
        }
        if feature not in allowed:
            raise ParseError(f"Unsupported meta adapter: {feature}")
        if strategy != allowed[feature]:
            raise ParseError(f"Unsupported meta adapter strategy for {feature}: {strategy}")

        effective_policy, declared_policy = self.ensure_target_policy_pair(target_name)
        effective_policy.setdefault("adapters", {})[feature] = strategy
        declared_policy.setdefault("adapters", {})[feature] = strategy
        return AdapterPolicy(feature, strategy)

    def parse_repair_block(self) -> RepairBlock:
        """Parse a top-level canonical repair block."""
        self.consume(TokenType.LEFT_BRACE, "Expected '{' after 'repair'")
        targets = []

        while not self.check(TokenType.RIGHT_BRACE) and not self.is_at_end():
            if self.match(TokenType.NEWLINE):
                continue
            targets.append(self.parse_repair_target_block())

        self.consume(TokenType.RIGHT_BRACE, "Expected '}' after repair block")
        return RepairBlock(targets)

    def parse_repair_target_block(self) -> TargetBlock:
        """Parse target <name> { lower ... } inside a repair block."""
        self.consume(TokenType.TARGET, "Expected 'target' in repair block")
        target_name = self.consume_policy_name("Expected repair target name")
        if target_name not in {"lua", "javascript", "python"}:
            raise ParseError(f"Unsupported repair target: {target_name}")

        self.consume(TokenType.LEFT_BRACE, "Expected '{' after repair target")
        policies = []

        while not self.check(TokenType.RIGHT_BRACE) and not self.is_at_end():
            if self.match(TokenType.NEWLINE):
                continue
            if self.check(TokenType.LOWER):
                policies.append(self.parse_repair_policy(target_name))
            else:
                raise ParseError(f"Expected 'lower' in repair target {target_name} block. Got {self.peek().value}")

        self.consume(TokenType.RIGHT_BRACE, "Expected '}' after repair target block")
        return TargetBlock(target_name, policies)

    def parse_repair_policy(self, target_name: str) -> RepairPolicy:
        """Parse lower <feature> using <strategy>;."""
        self.consume(TokenType.LOWER, "Expected 'lower'")
        feature = self.consume_policy_name("Expected repair feature")
        self.consume(TokenType.USING, "Expected 'using' after repair feature")
        strategy = self.consume_policy_name("Expected repair strategy")
        self.consume_statement_terminator()

        allowed = {
            "indexing": "zero_based",
            "length": "array_length_property",
            "slicing": "runtime_slice",
            "truthiness": "js_truthy",
            "string_coercion": "explicit_tostring",
            "multiple_returns": "packed_array",
        }
        if feature not in allowed:
            raise ParseError(f"Unsupported repair feature: {feature}")
        if strategy != allowed[feature]:
            raise ParseError(f"Unsupported repair strategy for {feature}: {strategy}")

        effective_policy, declared_policy = self.ensure_target_policy_pair(target_name)
        effective_policy.setdefault("repairs", {})[feature] = strategy
        declared_policy.setdefault("repairs", {})[feature] = strategy
        return RepairPolicy(feature, strategy)

    def parse_verify_block(self) -> VerifyBlock:
        """Parse a top-level compile-time verify block."""
        self.consume(TokenType.LEFT_BRACE, "Expected '{' after 'verify'")
        assertions = []
        target_assertions = {
            "lua_stdout": ("lua_stdout", VerifyLuaStdout, "single"),
            "lua_runtime_error": ("lua_runtime_error", VerifyLuaRuntimeError, "single"),
            "lua_policy": ("lua_policy", VerifyLuaPolicy),
            "lua_not_policy": ("lua_not_policy", VerifyLuaNotPolicy),
            "lua_repair": ("lua_repair", VerifyLuaRepair),
            "lua_contains": ("lua_contains", VerifyLuaContains),
            "lua_not_contains": ("lua_not_contains", VerifyLuaNotContains),
            "js_stdout": ("javascript_stdout", VerifyJavaScriptStdout, "single"),
            "js_runtime_error": ("javascript_runtime_error", VerifyJavaScriptRuntimeError, "single"),
            "js_policy": ("javascript_policy", VerifyJavaScriptPolicy),
            "js_not_policy": ("javascript_not_policy", VerifyJavaScriptNotPolicy),
            "js_repair": ("javascript_repair", VerifyJavaScriptRepair),
            "js_contains": ("javascript_contains", VerifyJavaScriptContains),
            "js_not_contains": ("javascript_not_contains", VerifyJavaScriptNotContains),
            "python_stdout": ("python_stdout", VerifyPythonStdout, "single"),
            "python_runtime_error": ("python_runtime_error", VerifyPythonRuntimeError, "single"),
            "python_policy": ("python_policy", VerifyPythonPolicy),
            "python_not_policy": ("python_not_policy", VerifyPythonNotPolicy),
            "python_repair": ("python_repair", VerifyPythonRepair),
            "python_contains": ("python_contains", VerifyPythonContains),
            "python_not_contains": ("python_not_contains", VerifyPythonNotContains),
            "ls_stdout": ("luascript_stdout", VerifyLuascriptStdout, "single"),
            "ls_runtime_error": ("luascript_runtime_error", VerifyLuascriptRuntimeError, "single"),
            "ls_contains": ("luascript_contains", VerifyLuascriptContains),
            "ls_not_contains": ("luascript_not_contains", VerifyLuascriptNotContains),
            "ls_policy": ("luascript_policy", VerifyLuascriptPolicy),
            "ls_not_policy": ("luascript_not_policy", VerifyLuascriptNotPolicy),
            "ls_repair": ("luascript_repair", VerifyLuascriptRepair),
        }

        while not self.check(TokenType.RIGHT_BRACE) and not self.is_at_end():
            if self.match(TokenType.NEWLINE):
                continue

            assertion = self.consume_policy_name("Expected verify assertion")
            expected = self.consume(TokenType.STRING, "Expected verify assertion string").value
            self.consume_statement_terminator()

            if assertion == "stdout":
                self.verify_policy["stdout"] = expected
                assertions.append(VerifyStdout(expected))
            elif assertion == "diagnostic":
                resolved = self.resolve_verify_diagnostic(expected)
                self.verify_policy["diagnostic"] = resolved
                assertions.append(VerifyDiagnostic(resolved))
            elif assertion == "feature":
                self.verify_policy.setdefault("feature", []).append(expected)
                assertions.append(VerifyFeature(expected))
            elif assertion == "no_feature":
                self.verify_policy.setdefault("no_feature", []).append(expected)
                assertions.append(VerifyNoFeature(expected))
            elif assertion == "profile":
                self.verify_policy.setdefault("profile", []).append(expected)
                assertions.append(VerifyProfile(expected))
            elif assertion == "no_profile":
                self.verify_policy.setdefault("no_profile", []).append(expected)
                assertions.append(VerifyNoProfile(expected))
            elif assertion == "implicit_profile":
                self.verify_policy.setdefault("implicit_profile", []).append(expected)
                assertions.append(VerifyImplicitProfile(expected))
            elif assertion == "no_implicit_profile":
                self.verify_policy.setdefault("no_implicit_profile", []).append(expected)
                assertions.append(VerifyNoImplicitProfile(expected))
            elif assertion in target_assertions:
                policy_key, assertion_class, *mode = target_assertions[assertion]
                if mode and mode[0] == "single":
                    self.verify_policy[policy_key] = expected
                else:
                    self.verify_policy.setdefault(policy_key, []).append(expected)
                assertions.append(assertion_class(expected))
            else:
                raise ParseError(f"Unsupported verify assertion: {assertion}")

        self.consume(TokenType.RIGHT_BRACE, "Expected '}' after verify block")
        return VerifyBlock(assertions)

    def resolve_verify_diagnostic(self, expected: str) -> str:
        """Resolve named diagnostics used by verify { diagnostic \"...\" }."""
        if expected.isidentifier():
            if expected not in KNOWN_LUASCRIPT_DIAGNOSTICS:
                raise ParseError(f"Unknown LUASCRIPT diagnostic: {expected}")
            return KNOWN_LUASCRIPT_DIAGNOSTICS[expected]
        return expected

    def consume_policy_name(self, message: str) -> str:
        """Consume an identifier-like policy word, including reserved keywords."""
        allowed = {
            TokenType.IDENTIFIER,
            TokenType.CONTINUE,
            TokenType.ASYNC,
            TokenType.AWAIT,
            TokenType.BREAK,
            TokenType.THROW,
            TokenType.UNSUPPORTED,
            TokenType.LOWER,
        }
        if self.peek().type in allowed:
            return self.advance().value
        current_token = self.peek()
        raise ParseError(f"{message}. Got {current_token.type.name}: '{current_token.value}'")

    def consume_dotted_policy_name(self, message: str) -> str:
        """Consume a dotted policy capability such as lua.goto."""
        value = self.consume_policy_name(message)
        while self.match(TokenType.DOT):
            value += "." + self.consume_policy_name("Expected name after '.' in policy capability")
        return value

    def raise_configured_diagnostic(self, feature: str):
        """Raise a configured unsupported-feature diagnostic if one exists."""
        for target_policy in self.meta_policy.get("targets", {}).values():
            message = target_policy.get("diagnostics", {}).get(feature)
            if message:
                raise ParseError(message)

    def forbids_capability(self, capability: str) -> bool:
        """Check whether any target policy forbids a capability."""
        return any(
            capability in target_policy.get("forbid", [])
            for target_policy in self.meta_policy.get("targets", {}).values()
        )
    
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

        while self.match(TokenType.NEWLINE):
            continue

        if self.check(TokenType.OR):
            body = self.parse_pattern_branch_body()
            return FunctionDeclaration(name, parameters, body, is_mathematical=True)

        # Parse expression, allowing mathematical comma-sequence bodies.
        expressions = [self.parse_expression()]
        while self.match(TokenType.COMMA):
            while self.match(TokenType.NEWLINE):
                continue
            if self.check_statement_terminator():
                break
            expressions.append(self.parse_expression())

        expr = expressions[0] if len(expressions) == 1 else SequenceExpression(expressions)
        
        # Create return statement
        return_stmt = ReturnStatement(expr)
        body = BlockStatement([return_stmt])
        
        self.consume_statement_terminator()
        
        return FunctionDeclaration(name, parameters, body, is_mathematical=True)

    def parse_composition_function(self) -> CompositionFunctionDeclaration:
        """Parse mathematical composition declaration: (f ∘ g)(x) = expression."""
        self.consume(TokenType.LEFT_PAREN, "Expected '(' before composition declaration")
        left_name = self.parse_identifier_name("Expected left function name in composition declaration")

        if self.match(TokenType.COMPOSITION):
            operator = "∘"
        elif self.match(TokenType.BINARY_COMPOSITION):
            operator = "⊙"
        else:
            raise ParseError("Expected composition operator in declaration")

        right_name = self.parse_identifier_name("Expected right function name in composition declaration")
        self.consume(TokenType.RIGHT_PAREN, "Expected ')' after composition declaration functions")
        self.consume(TokenType.LEFT_PAREN, "Expected '(' before composition declaration parameters")
        parameters = self.parse_parameter_list()
        self.consume(TokenType.RIGHT_PAREN, "Expected ')' after composition declaration parameters")
        self.consume(TokenType.ASSIGN, "Expected '=' in composition declaration")

        # V1 composition declarations define the operator helper. The right-hand
        # formula is accepted for readability and future validation, then stripped
        # from runtime output so unsupported lambda-dot syntax does not leak.
        while not self.check_statement_terminator() and not self.is_at_end():
            self.advance()
        self.consume_statement_terminator()

        return CompositionFunctionDeclaration(operator, left_name, right_name, parameters)

    def parse_pattern_branch_body(self) -> BlockStatement:
        """Parse simple mathematical pattern branches after a function '='."""
        clauses: List[Tuple[Optional[ASTNode], ASTNode]] = []

        while self.match(TokenType.OR):
            condition = None
            if self.check(TokenType.IDENTIFIER) and self.peek().value == "_" and self.peek_ahead(1) and self.peek_ahead(1).type in self.arrow_token_types():
                self.advance()
            else:
                condition = self.parse_expression()
                if isinstance(condition, AssignmentExpression) and condition.operator == "=":
                    condition = BinaryExpression(condition.left, "==", condition.right)

            self.consume_arrow("Expected arrow in pattern branch")
            while self.match(TokenType.NEWLINE):
                continue
            result = self.parse_expression()
            clauses.append((condition, result))
            self.consume_statement_terminator()
            while self.match(TokenType.NEWLINE):
                continue

        if not clauses:
            raise ParseError("Expected at least one pattern branch")

        branch: Optional[ASTNode] = None
        for condition, result in reversed(clauses):
            return_stmt = ReturnStatement(result)
            if condition is None:
                branch = return_stmt
            else:
                alternate = BlockStatement([branch]) if branch is not None else None
                branch = IfStatement(condition, BlockStatement([return_stmt]), alternate)

        return BlockStatement([branch])
    
    def parse_parameter_list(self) -> List[Parameter]:
        """Parse function parameter list"""
        parameters = []
        
        while not self.check(TokenType.RIGHT_PAREN) and not self.is_at_end():
            if self.match(TokenType.DOT_DOT_DOT):
                # Rest parameter
                name = self.parse_identifier_name("Expected parameter name after '...'")
                param = Parameter(name)
                param.is_rest = True
                parameters.append(param)
                break
            
            name = self.parse_identifier_name("Expected parameter name")
            
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
        self.block_depth += 1
        try:
            while not self.check(TokenType.RIGHT_BRACE) and not self.is_at_end():
                if self.match(TokenType.NEWLINE):
                    continue

                stmt = self.parse_statement()
                if stmt:
                    statements.append(stmt)
        finally:
            self.block_depth -= 1
        
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
            if self.check(TokenType.LEFT_PAREN):
                # Parenthesized parameters: (x, y) => body or () => body
                if not self.is_arrow_function():
                    expr = self.parse_conditional_expression()
                else:
                    self.advance()  # consume (
                    if not self.check(TokenType.RIGHT_PAREN):
                        parameters.append(Parameter(self.parse_identifier_name("Expected parameter name")))
                        while self.match(TokenType.COMMA):
                            parameters.append(Parameter(self.parse_identifier_name("Expected parameter name")))

                    self.consume(TokenType.RIGHT_PAREN, "Expected ')' after arrow function parameters")
                    self.consume_arrow("Expected arrow in arrow function")
                    while self.match(TokenType.NEWLINE):
                        continue
                    body = self.parse_assignment_expression()
                    if isinstance(body, AssignmentExpression) and body.operator == "=":
                        body = BinaryExpression(body.left, "==", body.right)
                    return ArrowFunctionExpression(parameters, body)
            elif self.check(TokenType.IDENTIFIER):
                # Single parameter without parentheses: x => body
                next_pos = self.current + 1
                if next_pos < len(self.tokens) and self.tokens[next_pos].type in self.arrow_token_types():
                    # This is an arrow function
                    param_name = self.advance().value
                    parameters.append(Parameter(param_name))
                    self.consume_arrow("Expected arrow in arrow function")
                    while self.match(TokenType.NEWLINE):
                        continue
                    body = self.parse_assignment_expression()
                    if isinstance(body, AssignmentExpression) and body.operator == "=":
                        body = BinaryExpression(body.left, "==", body.right)
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
            if operator == "=" and not isinstance(expr, (Identifier, MemberExpression)):
                return BinaryExpression(expr, "==", right)
            return AssignmentExpression(expr, operator, right)

        if (
            self.check(TokenType.COLON)
            and self.peek_ahead(1) is not None
            and self.peek_ahead(1).type == TokenType.ASSIGN
        ):
            self.advance()
            self.advance()
            right = self.parse_assignment_expression()
            return AssignmentExpression(expr, ':=', right)
        
        return expr
    
    def parse_conditional_expression(self) -> ASTNode:
        """Parse ternary conditional expression"""
        expr = self.parse_pipeline_expression()
        
        if self.match(TokenType.QUESTION):
            consequent = self.parse_assignment_expression()
            self.consume(TokenType.COLON, "Expected ':' after '?' in ternary")
            alternate = self.parse_assignment_expression()
            return ConditionalExpression(expr, consequent, alternate)
        
        return expr

    def parse_pipeline_expression(self) -> ASTNode:
        """Parse left-associative pipeline expressions."""
        expr = self.parse_logical_or_expression()

        while True:
            checkpoint = self.current
            while self.match(TokenType.NEWLINE):
                continue
            if not self.match(TokenType.PIPELINE):
                self.current = checkpoint
                break
            right = self.parse_pipeline_stage()
            expr = PipelineExpression(expr, right)

        while self.match_any(
            TokenType.PLUS,
            TokenType.MINUS,
            TokenType.MINUS_UNICODE,
            TokenType.MULTIPLY,
            TokenType.MULTIPLY_UNICODE,
            TokenType.DOT_PRODUCT,
            TokenType.CROSS_PRODUCT,
            TokenType.TENSOR_PRODUCT,
            TokenType.DIVIDE,
            TokenType.DIVIDE_UNICODE,
            TokenType.MODULO,
            TokenType.UNION,
            TokenType.INTERSECTION,
        ):
            operator = self.previous().value
            right = self.parse_logical_or_expression()
            expr = BinaryExpression(expr, operator, right)

        return expr

    def parse_pipeline_stage(self) -> ASTNode:
        """Parse one pipeline stage without consuming the next pipeline."""
        return self.parse_call_expression()
    
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
                            TokenType.LESS_EQUAL_UNICODE, TokenType.GREATER_EQUAL_UNICODE,
                            TokenType.ELEMENT_OF, TokenType.NOT_ELEMENT_OF,
                            TokenType.SUBSET, TokenType.SUPERSET):
            operator = self.previous().value
            right = self.parse_additive_expression()
            expr = BinaryExpression(expr, operator, right)
        
        return expr
    
    def parse_additive_expression(self) -> ASTNode:
        """Parse additive expression"""
        expr = self.parse_composition_expression()
        
        while self.match_any(TokenType.PLUS, TokenType.MINUS, TokenType.MINUS_UNICODE,
                             TokenType.UNION, TokenType.INTERSECTION):
            operator = self.previous().value
            right = self.parse_composition_expression()
            expr = BinaryExpression(expr, operator, right)
        
        return expr

    def parse_composition_expression(self) -> ASTNode:
        """Parse mathematical function composition expressions."""
        expr = self.parse_multiplicative_expression()

        while self.match_any(TokenType.COMPOSITION, TokenType.BINARY_COMPOSITION):
            operator = self.previous().value
            right = self.parse_multiplicative_expression()
            expr = CompositionExpression(expr, operator, right)

        return expr
    
    def parse_multiplicative_expression(self) -> ASTNode:
        """Parse multiplicative expression"""
        expr = self.parse_exponentiation_expression()
        
        while True:
            if self.match_any(TokenType.MULTIPLY, TokenType.DIVIDE, TokenType.MODULO,
                              TokenType.MULTIPLY_UNICODE, TokenType.DIVIDE_UNICODE,
                              TokenType.DOT_PRODUCT, TokenType.CROSS_PRODUCT,
                              TokenType.TENSOR_PRODUCT):
                operator = self.previous().value
                right = self.parse_exponentiation_expression()
                expr = BinaryExpression(expr, operator, right)
            elif self.is_implicit_multiplication_boundary():
                right = self.parse_exponentiation_expression()
                expr = BinaryExpression(expr, '×', right)
            else:
                break
        
        return expr

    def parse_exponentiation_expression(self) -> ASTNode:
        """Parse exponentiation expressions."""
        expr = self.parse_unary_expression()

        if self.match(TokenType.POWER):
            operator = self.previous().value
            right = self.parse_exponentiation_expression()
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
                args = self.parse_argument_list(expr)
                self.consume(TokenType.RIGHT_PAREN, "Expected ')' after arguments")
                expr = CallExpression(expr, args)
            
            elif self.match(TokenType.DOT):
                # Member access: obj.prop
                name = self.consume(TokenType.IDENTIFIER, "Expected property name after '.'").value
                if name == "prototype" and self.forbids_capability("js.prototype"):
                    raise ParseError("Forbidden capability used by meta policy: js.prototype")
                expr = MemberExpression(expr, Identifier(name), computed=False)
            
            elif self.match(TokenType.LEFT_BRACKET):
                # Computed member access: obj[prop]
                prop = self.parse_expression()
                self.consume(TokenType.RIGHT_BRACKET, "Expected ']' after computed property")
                expr = MemberExpression(expr, prop, computed=True)
            
            else:
                break
        
        return expr
    
    def parse_argument_list(self, callee: Optional[ASTNode] = None) -> List[ASTNode]:
        """Parse function call argument list"""
        args = []
        
        while not self.check(TokenType.RIGHT_PAREN) and not self.is_at_end():
            while self.match(TokenType.NEWLINE):
                continue
            if self.check(TokenType.RIGHT_PAREN):
                break

            if self.match(TokenType.DOT_DOT_DOT):
                # Spread argument
                arg = self.parse_assignment_expression()
                args.append(SpreadElement(arg))
            elif self.is_limit_direction_argument(callee):
                variable = Identifier(self.advance().value)
                self.consume_arrow("Expected arrow in limit direction")
                target = self.parse_assignment_expression()
                args.append(LimitDirection(variable, target))
            else:
                args.append(self.parse_assignment_expression())
            
            while self.match(TokenType.NEWLINE):
                continue
            if not self.match(TokenType.COMMA):
                break
            while self.match(TokenType.NEWLINE):
                continue
        
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

        if self.match(TokenType.EMPTY_SET):
            return ArrayExpression([])
        
        # Template literals
        if self.match_any(TokenType.TEMPLATE_STRING, TokenType.TEMPLATE_START):
            # Get the already consumed token
            first_token = self.previous()
            return self.parse_template_literal(first_token)
        
        # This keyword
        if self.match(TokenType.THIS):
            return Identifier('this')

        # Mathematical let-in expressions
        if self.match(TokenType.LET):
            return self.parse_let_in_expression()

        if self.is_math_limit_binder_start():
            return self.parse_math_limit_expression()
        
        # Identifiers (with optional subscripts)
        if self.match(TokenType.IDENTIFIER):
            name = self.previous().value
            subscript = None
            
            # Check for subscript numbers after identifier
            if self.check(TokenType.SUBSCRIPT_NUMBER):
                subscript = self.advance().value
                
            return Identifier(name, subscript)

        next_token = self.peek_ahead(1)
        if (
            self.check_any(TokenType.SUMMATION, TokenType.PRODUCT, TokenType.INTEGRAL)
            and next_token is not None
            and (
                next_token.type == TokenType.POWER
                or (next_token.type == TokenType.IDENTIFIER and next_token.value == "_")
            )
        ):
            return self.parse_math_native_binder_expression()

        if (
            self.check_any(TokenType.SUMMATION, TokenType.PRODUCT, TokenType.INTEGRAL)
            and next_token is not None
            and next_token.type in (TokenType.SUBSCRIPT_NUMBER, TokenType.SUPERSCRIPT_NUMBER)
        ):
            operator = self.peek().value
            raise ParseError(
                "Compact mathematical binder glyph placement is experimental; "
                f"use {operator}[n = lower..upper](body) or {operator}_{{n=lower}}^{{upper}}(body)"
            )

        if (
            self.check(TokenType.PARTIAL)
            and next_token is not None
            and next_token.type == TokenType.IDENTIFIER
            and next_token.value == "_"
        ):
            return self.parse_math_derivative_expression()

        if (
            self.check_any(TokenType.SUMMATION, TokenType.PRODUCT, TokenType.INTEGRAL)
            and next_token is not None
            and next_token.type == TokenType.LEFT_BRACKET
        ):
            return self.parse_math_binder_expression()

        if self.check_any(
            TokenType.DELTA,
            TokenType.PARTIAL,
            TokenType.NABLA,
            TokenType.LAMBDA,
            TokenType.SUMMATION,
            TokenType.PRODUCT,
            TokenType.INTEGRAL,
        ):
            return Identifier(self.parse_identifier_name("Expected symbolic identifier"))
        
        # Array literals
        if self.match(TokenType.LEFT_BRACKET):
            return self.parse_array_expression()
        
        # Object literals
        if self.match(TokenType.LEFT_BRACE):
            return self.parse_object_expression()
        
        # Parenthesized expressions
        if self.match(TokenType.LEFT_PAREN):
            while self.match(TokenType.NEWLINE):
                continue

            if self.is_operator_section_start():
                return self.parse_operator_section()

            if self.is_parenthesized_object_start():
                return self.parse_parenthesized_object_expression()

            # Check for arrow function: (a, b) => expr
            if self.is_arrow_function():
                return self.parse_arrow_function()
            
            expr = self.parse_expression()
            if self.match(TokenType.COMMA):
                elements = [expr]
                while True:
                    while self.match(TokenType.NEWLINE):
                        continue
                    elements.append(self.parse_expression())
                    while self.match(TokenType.NEWLINE):
                        continue
                    if not self.match(TokenType.COMMA):
                        break
                self.consume(TokenType.RIGHT_PAREN, "Expected ')' after tuple elements")
                return ArrayExpression(elements)
            while self.match(TokenType.NEWLINE):
                continue
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
                args = self.parse_argument_list(callee)
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
                start = self.parse_assignment_expression()
                if self.match(TokenType.RANGE_INCLUSIVE):
                    end = self.parse_assignment_expression()
                    elements.append(RangeExpression(start, end))
                else:
                    elements.append(start)
            
            if not self.match(TokenType.COMMA):
                break
        
        self.consume(TokenType.RIGHT_BRACKET, "Expected ']' after array elements")
        return ArrayExpression(elements)

    def parse_math_binder_expression(self) -> MathBinderExpression:
        """Parse native mathematical binder syntax: ∑[n = 1..5](n²)."""
        operator_token = self.advance()
        operator_names = {
            TokenType.SUMMATION: "summation",
            TokenType.PRODUCT: "product",
            TokenType.INTEGRAL: "integral",
        }
        operator = operator_names[operator_token.type]

        self.consume(TokenType.LEFT_BRACKET, "Expected '[' after mathematical binder")
        variable = Identifier(self.parse_identifier_name("Expected binder variable"))
        self.consume(TokenType.ASSIGN, "Expected '=' after binder variable")
        lower = self.parse_assignment_expression()
        self.consume(TokenType.RANGE_INCLUSIVE, "Expected '..' in mathematical binder range")
        upper = self.parse_assignment_expression()

        step_or_resolution = None
        if self.match(TokenType.COMMA):
            step_or_resolution = self.parse_assignment_expression()

        self.consume(TokenType.RIGHT_BRACKET, "Expected ']' after mathematical binder range")
        self.consume(TokenType.LEFT_PAREN, "Expected '(' before mathematical binder body")
        body = self.parse_assignment_expression()
        self.consume(TokenType.RIGHT_PAREN, "Expected ')' after mathematical binder body")

        return MathBinderExpression(operator, variable, lower, upper, body, step_or_resolution)

    def parse_math_native_binder_expression(self) -> MathBinderExpression:
        """Parse math-native binder syntax: ∑_{n=1}^{5}(n²), ∫_{x=0}^{3, 800}(x²), ∫_{0}^{π}(sin(x)) dx, or ∫_{0}^{π} sin(x) dx."""
        operator_token = self.advance()
        operator_names = {
            TokenType.SUMMATION: "summation",
            TokenType.PRODUCT: "product",
            TokenType.INTEGRAL: "integral",
        }
        operator = operator_names[operator_token.type]

        variable = None
        lower = None
        upper = None
        step_or_resolution = None

        for _ in range(2):
            if self.is_math_lower_marker():
                if variable is not None:
                    raise ParseError("Duplicate lower bound in mathematical binder")
                variable, lower = self.parse_math_native_binder_lower_clause(
                    allow_anonymous_integral_lower=operator == "integral"
                )
            elif self.check(TokenType.POWER):
                if upper is not None:
                    raise ParseError("Duplicate upper bound in mathematical binder")
                upper, step_or_resolution = self.parse_math_native_binder_upper_clause()
            else:
                break

        if lower is None:
            raise ParseError(
                "Expected lower binder clause like _{n=1} after mathematical binder"
            )
        if upper is None:
            raise ParseError(
                "Expected upper binder clause like ^{5} after mathematical binder"
            )

        uses_integral_differential = operator == "integral" and variable is None
        if self.match(TokenType.LEFT_PAREN):
            body = self.parse_assignment_expression()
            self.consume(TokenType.RIGHT_PAREN, "Expected ')' after mathematical binder body")
        elif uses_integral_differential:
            previous_stop = self.stop_before_integral_differential
            self.stop_before_integral_differential = True
            try:
                body = self.parse_assignment_expression()
            finally:
                self.stop_before_integral_differential = previous_stop
        else:
            self.consume(TokenType.LEFT_PAREN, "Expected '(' before mathematical binder body")

        if variable is None:
            variable = self.parse_math_integral_differential()

        return MathBinderExpression(operator, variable, lower, upper, body, step_or_resolution)

    def is_math_lower_marker(self) -> bool:
        """Return true for the ASCII lower-bound marker used in math-native binders."""
        return self.check(TokenType.IDENTIFIER) and self.peek().value == "_"

    def consume_math_lower_marker(self):
        """Consume '_' when it is used as a math-native binder lower-bound marker."""
        if self.is_math_lower_marker():
            return self.advance()
        current_token = self.peek()
        raise ParseError(f"Expected '_' lower-bound marker. Got {current_token.type.name}: '{current_token.value}'")

    def parse_math_native_binder_lower_clause(self, allow_anonymous_integral_lower: bool = False) -> Tuple[Optional[Identifier], ASTNode]:
        """Parse _{n=1} or integral shorthand _{0} in math-native binder syntax."""
        self.consume_math_lower_marker()
        self.consume(TokenType.LEFT_BRACE, "Expected '{' after '_' in mathematical binder")
        if allow_anonymous_integral_lower and not self.math_lower_clause_has_assignment():
            lower = self.parse_assignment_expression()
            self.consume(TokenType.RIGHT_BRACE, "Expected '}' after lower mathematical binder bound")
            return None, lower
        variable = Identifier(self.parse_identifier_name("Expected binder variable"))
        self.consume(TokenType.ASSIGN, "Expected '=' after binder variable")
        lower = self.parse_assignment_expression()
        self.consume(TokenType.RIGHT_BRACE, "Expected '}' after lower mathematical binder bound")
        return variable, lower

    def math_lower_clause_has_assignment(self) -> bool:
        """Return true when the current braced lower clause contains a top-level '='."""
        depth = 0
        index = self.current
        while index < len(self.tokens):
            token = self.tokens[index]
            if token.type == TokenType.LEFT_BRACE:
                depth += 1
            elif token.type == TokenType.RIGHT_BRACE:
                if depth == 0:
                    return False
                depth -= 1
            elif token.type == TokenType.ASSIGN and depth == 0:
                return True
            index += 1
        return False

    def parse_math_integral_differential(self) -> Identifier:
        """Parse the required differential suffix for anonymous definite integrals."""
        if not self.check(TokenType.IDENTIFIER):
            raise ParseError("Definite integral shorthand requires a differential like dx after the body")

        token = self.advance()
        if token.value.startswith("d") and len(token.value) > 1:
            return Identifier(token.value[1:])
        if token.value == "d" and self.check(TokenType.IDENTIFIER):
            return Identifier(self.advance().value)
        raise ParseError("Definite integral shorthand requires a differential like dx after the body")

    def is_math_integral_differential_start(self) -> bool:
        """Return true when the next token can terminate a bare integral body as dx or d x."""
        if not self.check(TokenType.IDENTIFIER):
            return False
        token = self.peek()
        if token.value.startswith("d") and len(token.value) > 1:
            return True
        return (
            token.value == "d"
            and self.peek_ahead(1) is not None
            and self.peek_ahead(1).type == TokenType.IDENTIFIER
        )

    def parse_math_native_binder_upper_clause(self) -> Tuple[ASTNode, Optional[ASTNode]]:
        """Parse ^{5} or ^{5, 2} in math-native binder syntax."""
        self.consume(TokenType.POWER, "Expected '^' before upper mathematical binder bound")
        self.consume(TokenType.LEFT_BRACE, "Expected '{' after '^' in mathematical binder")
        upper = self.parse_assignment_expression()
        step_or_resolution = None
        if self.match(TokenType.COMMA):
            step_or_resolution = self.parse_assignment_expression()
        self.consume(TokenType.RIGHT_BRACE, "Expected '}' after upper mathematical binder bound")
        return upper, step_or_resolution

    def parse_math_derivative_expression(self) -> MathDerivativeExpression:
        """Parse native derivative syntax: ∂_{x=2}(x³) or ∂_{x=2, 0.0001}(x³)."""
        self.consume(TokenType.PARTIAL, "Expected '∂' before derivative binder")
        self.consume_math_lower_marker()
        self.consume(TokenType.LEFT_BRACE, "Expected '{' after '_' in derivative binder")
        variable = Identifier(self.parse_identifier_name("Expected derivative variable"))
        self.consume(TokenType.ASSIGN, "Expected '=' after derivative variable")
        point = self.parse_assignment_expression()
        step = None
        if self.match(TokenType.COMMA):
            step = self.parse_assignment_expression()
        self.consume(TokenType.RIGHT_BRACE, "Expected '}' after derivative binder point")

        self.consume(TokenType.LEFT_PAREN, "Expected '(' before derivative body")
        body = self.parse_assignment_expression()
        self.consume(TokenType.RIGHT_PAREN, "Expected ')' after derivative body")

        return MathDerivativeExpression(variable, point, body, step)

    def is_math_limit_binder_start(self) -> bool:
        """Return true for lim_{...}(...) or limit_{...}(...) native limit syntax."""
        if not self.check(TokenType.IDENTIFIER):
            return False
        token = self.peek()
        return (
            token.value in {"lim_", "limit_"}
            and self.peek_ahead(1) is not None
            and self.peek_ahead(1).type == TokenType.LEFT_BRACE
        )

    def parse_math_limit_expression(self) -> MathLimitExpression:
        """Parse native limit syntax: lim_{n→∞}((1 + 1/n)^n)."""
        self.advance()
        self.consume(TokenType.LEFT_BRACE, "Expected '{' after limit binder")
        variable = Identifier(self.parse_identifier_name("Expected limit variable"))
        if self.match(TokenType.ASSIGN):
            raise ParseError("Limit start values are not supported in V8; use lim_{n→target}(body)")
        self.consume_arrow("Expected '→' in limit binder")
        target = self.parse_assignment_expression()
        self.consume(TokenType.RIGHT_BRACE, "Expected '}' after limit binder target")

        self.consume(TokenType.LEFT_PAREN, "Expected '(' before limit body")
        body = self.parse_assignment_expression()
        self.consume(TokenType.RIGHT_PAREN, "Expected ')' after limit body")

        return MathLimitExpression(LimitDirection(variable, target), body)

    def parse_let_in_expression(self) -> LetInExpression:
        """Parse a mathematical let-in expression."""
        bindings = []
        while True:
            while self.match(TokenType.NEWLINE):
                continue
            name = self.parse_identifier_name("Expected identifier in let-in binding")
            self.consume(TokenType.ASSIGN, "Expected '=' in let-in binding")
            init = self.parse_assignment_expression()
            bindings.append(VariableDeclarator(Identifier(name), init))

            if not self.match(TokenType.COMMA):
                break
            while self.match(TokenType.NEWLINE):
                continue

        self.consume(TokenType.IN, "Expected 'in' after let-in bindings")
        while self.match(TokenType.NEWLINE):
            continue

        if self.check(TokenType.OR):
            body = self.parse_pattern_branch_body()
            return LetInExpression(bindings, body)

        sequence_expressions = []
        while True:
            body = self.parse_assignment_expression()
            if (
                isinstance(body, AssignmentExpression)
                and body.operator == "="
                and isinstance(body.left, Identifier)
                and self.match(TokenType.COMMA)
            ):
                bindings.append(VariableDeclarator(body.left, body.right))
                while self.match(TokenType.NEWLINE):
                    continue
                continue
            if self.match(TokenType.COMMA):
                sequence_expressions.append(body)
                while self.match(TokenType.NEWLINE):
                    continue
                continue
            break

        if sequence_expressions:
            sequence_expressions.append(body)
            body = SequenceExpression(sequence_expressions)

        return LetInExpression(bindings, body)

    def parse_operator_section(self) -> OperatorSectionExpression:
        """Parse a parenthesized binary operator as a function value."""
        if not self.check_any(*self.operator_section_token_types()):
            raise ParseError("Expected operator in operator section")
        operator = self.advance().value
        self.consume(TokenType.RIGHT_PAREN, "Expected ')' after operator section")
        return OperatorSectionExpression(operator)
    
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

    def parse_parenthesized_object_expression(self) -> ObjectExpression:
        """Parse mathematical tuple-object notation: (name: value, other: value)."""
        properties = []

        while not self.check(TokenType.RIGHT_PAREN) and not self.is_at_end():
            while self.match(TokenType.NEWLINE):
                continue
            if self.check(TokenType.RIGHT_PAREN):
                break

            properties.append(self.parse_property())

            while self.match(TokenType.NEWLINE):
                continue
            if not self.match(TokenType.COMMA):
                break
            while self.match(TokenType.NEWLINE):
                continue

        self.consume(TokenType.RIGHT_PAREN, "Expected ')' after tuple-object fields")
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
        
        self.consume_arrow("Expected arrow in arrow function")
        while self.match(TokenType.NEWLINE):
            continue
        
        # Parse body (expression or block)
        if self.check(TokenType.LEFT_BRACE):
            body = self.parse_block_statement()
        else:
            # Expression body - wrap in return statement
            expr = self.parse_assignment_expression()
            if isinstance(expr, AssignmentExpression) and expr.operator == "=":
                expr = BinaryExpression(expr.left, "==", expr.right)
            body = expr
        
        return ArrowFunctionExpression(parameters, body)
    
    def parse_member_expression(self) -> ASTNode:
        """Parse member expression for new operator"""
        expr = self.parse_primary_expression()
        
        while self.match_any(TokenType.DOT, TokenType.LEFT_BRACKET):
            if self.previous().type == TokenType.DOT:
                name = self.consume(TokenType.IDENTIFIER, "Expected property name").value
                if name == "prototype" and self.forbids_capability("js.prototype"):
                    raise ParseError("Forbidden capability used by meta policy: js.prototype")
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
            name = self.parse_identifier_name("Expected identifier")
            return VariableDeclaration(kind, [VariableDeclarator(Identifier(name))])
        else:
            name = self.parse_identifier_name("Expected identifier")
            return Identifier(name)
    
    # Helper methods
    def parse_identifier_name(self, message: str) -> str:
        """Parse an identifier plus an optional Unicode numeric subscript."""
        symbolic_identifiers = {
            TokenType.DELTA: "delta",
            TokenType.PARTIAL: "partial",
            TokenType.NABLA: "nabla",
            TokenType.LAMBDA: "lambda",
            TokenType.SUMMATION: "sum",
            TokenType.PRODUCT: "product",
            TokenType.INTEGRAL: "integral",
        }
        if self.check_any(*symbolic_identifiers.keys()):
            name = symbolic_identifiers[self.advance().type]
            if self.check(TokenType.IDENTIFIER):
                name = f"{name}_{self.advance().value}"
        else:
            name = self.consume(TokenType.IDENTIFIER, message).value
        if self.check(TokenType.SUBSCRIPT_NUMBER):
            name = f"{name}_{self.advance().value}"
        if self.check(TokenType.SUPERSCRIPT_NUMBER):
            name = f"{name}_{self.advance().value}"
        return name

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

    def is_composition_function(self) -> bool:
        """Check if current position is composition declaration: (f ∘ g)(x) = expr."""
        expected = [
            TokenType.LEFT_PAREN,
            TokenType.IDENTIFIER,
            None,
            TokenType.IDENTIFIER,
            TokenType.RIGHT_PAREN,
            TokenType.LEFT_PAREN,
        ]
        for offset, token_type in enumerate(expected):
            token = self.peek_ahead(offset)
            if token is None:
                return False
            if token_type is None:
                if token.type not in {TokenType.COMPOSITION, TokenType.BINARY_COMPOSITION}:
                    return False
            elif token.type != token_type:
                return False

        i = self.current + len(expected)
        paren_count = 1
        while i < len(self.tokens) and paren_count > 0:
            if self.tokens[i].type == TokenType.LEFT_PAREN:
                paren_count += 1
            elif self.tokens[i].type == TokenType.RIGHT_PAREN:
                paren_count -= 1
            i += 1

        return i < len(self.tokens) and self.tokens[i].type == TokenType.ASSIGN

    def operator_section_token_types(self) -> Set[TokenType]:
        return {
            TokenType.PLUS,
            TokenType.MINUS,
            TokenType.MINUS_UNICODE,
            TokenType.MULTIPLY,
            TokenType.MULTIPLY_UNICODE,
            TokenType.DIVIDE,
            TokenType.DIVIDE_UNICODE,
            TokenType.MODULO,
            TokenType.POWER,
        }

    def is_operator_section_start(self) -> bool:
        """Check after '(' for an operator section like (+)."""
        return (
            self.check_any(*self.operator_section_token_types())
            and self.peek_ahead(1) is not None
            and self.peek_ahead(1).type == TokenType.RIGHT_PAREN
        )

    def is_parenthesized_object_start(self) -> bool:
        """Check after '(' for tuple-object notation like (x: x)."""
        return (
            self.check_any(TokenType.IDENTIFIER, TokenType.STRING, TokenType.NUMBER)
            and self.peek_ahead(1) is not None
            and self.peek_ahead(1).type == TokenType.COLON
        )
    
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
        
        return i < len(self.tokens) and self.tokens[i].type in self.arrow_token_types()

    def arrow_token_types(self) -> Set[TokenType]:
        return {TokenType.ARROW, TokenType.ARROW_RIGHT}

    def match_arrow(self) -> bool:
        return self.match_any(TokenType.ARROW, TokenType.ARROW_RIGHT)

    def consume_arrow(self, message: str) -> Token:
        if self.match_arrow():
            return self.previous()
        raise ParseError(message, self.peek())

    def is_limit_direction_argument(self, callee: Optional[ASTNode] = None) -> bool:
        if not isinstance(callee, Identifier) or callee.name not in {"lim", "limit"}:
            return False
        return (
            self.check(TokenType.IDENTIFIER)
            and self.peek_ahead(1) is not None
            and self.peek_ahead(1).type in self.arrow_token_types()
        )

    def is_implicit_multiplication_boundary(self) -> bool:
        if self.is_at_end():
            return False
        if self.stop_before_integral_differential and self.is_math_integral_differential_start():
            return False
        previous = self.previous()
        current = self.peek()
        if previous.type not in {
            TokenType.NUMBER,
            TokenType.IDENTIFIER,
            TokenType.RIGHT_PAREN,
            TokenType.RIGHT_BRACKET,
            TokenType.MATH_PI,
            TokenType.MATH_E,
            TokenType.MATH_PHI,
            TokenType.MATH_INFINITY,
            TokenType.SUPERSCRIPT_NUMBER,
        }:
            return False
        return current.type in {
            TokenType.NUMBER,
            TokenType.IDENTIFIER,
            TokenType.LEFT_PAREN,
            TokenType.SQRT,
            TokenType.MATH_PI,
            TokenType.MATH_E,
            TokenType.MATH_PHI,
            TokenType.MATH_INFINITY,
        }
    
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

# Main parsing functions
def parse_tokens(tokens: List[Token]) -> Program:
    """Parse pre-tokenized LUASCRIPT source into the parser-owned AST."""
    parser = make_parser_for_tokens(tokens)
    return parser.parse_program()

def parse_source(source: str, filename: str = "<string>") -> Program:
    """Parse LUASCRIPT source code into the parser-owned AST."""
    parser = EnhancedParser()
    return parser.parse(source, filename)

def ensure_eof_token(tokens: List[Token]) -> List[Token]:
    """Return tokens with a trailing EOF token for helper-level parser APIs."""
    if tokens and tokens[-1].type == TokenType.EOF:
        return tokens

    line = tokens[-1].line if tokens else 1
    column = tokens[-1].column + len(str(tokens[-1].value)) if tokens else 1
    return list(tokens) + [Token(TokenType.EOF, "", line, column)]

def make_parser_for_tokens(tokens: List[Token], start: int = 0) -> EnhancedParser:
    """Create a parser positioned at a token offset."""
    parser = EnhancedParser()
    parser.tokens = ensure_eof_token(tokens)
    parser.current = start
    return parser

def parse_statement_tokens(tokens: List[Token], start: int = 0) -> tuple[Optional[ASTNode], int]:
    """Parse one statement from token data using the parser-owned implementation."""
    parser = make_parser_for_tokens(tokens, start)
    return parser.parse_statement(), parser.current

def parse_expression_tokens(tokens: List[Token], start: int = 0) -> tuple[ASTNode, int]:
    """Parse one expression from token data using the parser-owned implementation."""
    parser = make_parser_for_tokens(tokens, start)
    return parser.parse_expression(), parser.current

def parse_template_tokens(tokens: List[Token], start: int = 0) -> tuple[TemplateLiteral, int]:
    """Parse one template literal from token data using the parser-owned implementation."""
    parser = make_parser_for_tokens(tokens, start)
    first_token = None
    if parser.check_any(TokenType.TEMPLATE_STRING, TokenType.TEMPLATE_START):
        first_token = parser.advance()
    return parser.parse_template_literal(first_token), parser.current

def parse_array_tokens(tokens: List[Token], start: int = 0) -> tuple[ArrayExpression, int]:
    """Parse one array literal from token data using the parser-owned implementation."""
    parser = make_parser_for_tokens(tokens, start)
    parser.consume(TokenType.LEFT_BRACKET, "Expected '[' before array expression")
    return parser.parse_array_expression(), parser.current

def parse_artifact(source: str, filename: str = "<string>") -> ParseArtifact:
    """Parse LUASCRIPT source and return AST plus parser-owned compile metadata."""
    tokens = tokenize_source(source, filename)
    program = parse_tokens(tokens)
    feature_slices = collect_feature_slices(program)
    validate_feature_verification(program.verify_policy or {}, feature_slices)
    validate_profile_verification(program.verify_policy or {}, program.meta_policy or {})
    default_meta_policy = {
        "targets": {},
        "profiles": [],
        "declaredTargets": {},
        "implicitProfiles": [],
    }
    return ParseArtifact(
        program=program,
        tokens=tokens,
        meta_policy=program.meta_policy or default_meta_policy,
        verify_policy=program.verify_policy or {},
        feature_slices=feature_slices,
    )

def validate_feature_verification(verify_policy: Dict[str, Any], feature_slices: Set[str]):
    """Validate compile-time feature-slice assertions from verify blocks."""
    for expected in verify_policy.get("feature", []):
        if expected not in feature_slices:
            raise ParseError(f"Missing verified feature slice: {expected}")

    for unexpected in verify_policy.get("no_feature", []):
        if unexpected in feature_slices:
            raise ParseError(f"Forbidden verified feature slice present: {unexpected}")

def validate_profile_assertion(
    meta_policy: Dict[str, Any],
    profile_name: str,
    key: str,
    collection: str,
    should_exist: bool,
):
    profiles = set((meta_policy or {}).get(collection, []))
    matches = profile_name in profiles
    if should_exist and not matches:
        raise ParseError(f"Missing LUASCRIPT {key} assertion: {profile_name}")
    if not should_exist and matches:
        raise ParseError(f"Forbidden LUASCRIPT {key} assertion present: {profile_name}")

def validate_profile_verification(verify_policy: Dict[str, Any], meta_policy: Dict[str, Any]):
    """Validate compile-time profile assertions from verify blocks."""
    for expected in verify_policy.get("profile", []):
        validate_profile_assertion(meta_policy, expected, "profile", "profiles", True)

    for unexpected in verify_policy.get("no_profile", []):
        validate_profile_assertion(meta_policy, unexpected, "profile", "profiles", False)

    for expected in verify_policy.get("implicit_profile", []):
        validate_profile_assertion(meta_policy, expected, "implicit profile", "implicitProfiles", True)

    for unexpected in verify_policy.get("no_implicit_profile", []):
        validate_profile_assertion(meta_policy, unexpected, "implicit profile", "implicitProfiles", False)

def collect_feature_slices(node: ASTNode) -> Set[str]:
    """Collect named syntax slices represented in a parsed AST."""
    slices: Set[str] = set()
    seen: Set[int] = set()

    def visit(value: Any):
        if value is None:
            return
        if isinstance(value, (str, int, float, bool)):
            return
        if isinstance(value, list):
            for item in value:
                visit(item)
            return
        if isinstance(value, dict):
            for item in value.values():
                visit(item)
            return
        if not isinstance(value, ASTNode):
            return

        node_id = id(value)
        if node_id in seen:
            return
        seen.add(node_id)

        feature_by_type = {
            MetaBlock: "meta-blocks",
            RepairBlock: "repair-blocks",
            VerifyBlock: "verify-blocks",
            MathBinderExpression: "math-binders",
            MathDerivativeExpression: "derivative-binders",
            MathLimitExpression: "limit-binders",
            PipelineExpression: "pipelines",
            CompositionExpression: "composition",
            CompositionFunctionDeclaration: "composition",
            OperatorSectionExpression: "operator-sections",
            RangeExpression: "ranges",
            LetInExpression: "let-in",
            ArrayPattern: "destructuring-patterns",
            ObjectPattern: "destructuring-patterns",
            AssignmentPattern: "destructuring-patterns",
            ClassDeclaration: "classes",
            ForOfStatement: "for-of",
            TryStatement: "try-catch",
            TemplateLiteral: "template-literals",
            NewExpression: "new-expression",
            SpreadElement: "spread-rest",
            RestElement: "spread-rest",
        }
        for node_type, feature in feature_by_type.items():
            if isinstance(value, node_type):
                slices.add(feature)
                if isinstance(value, MetaBlock) and getattr(value, "profiles", None):
                    slices.add("meta-profiles")
                break

        for child in vars(value).values():
            visit(child)

    visit(node)
    return slices

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
