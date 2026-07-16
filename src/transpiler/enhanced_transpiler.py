#!/usr/bin/env python3
"""
LUASCRIPT Enhanced Transpiler
Fixes critical issues identified in comprehensive audit:
- Array methods properly connected to runtime library (_LS.map, _LS.filter, _LS.reduce)
- Template string ${} interpolation generates proper string.format code
- Mathematical Unicode operators converted to Lua equivalents
- Mathematical function syntax f(x) = expr support

Author: Steve Jobs + Donald Knuth Leadership Team  
Priority: CRITICAL - Connects beautiful syntax to working code generation
"""

from typing import List, Dict, Set, Optional, Any, Union
from enum import Enum
from dataclasses import dataclass
import sys
import os

# Import token types from enhanced lexer
sys.path.append(os.path.join(os.path.dirname(__file__), '../lexer'))
from enhanced_lexer import Token, TokenType, tokenize_source

# The parser owns AST node classes. The transpiler consumes parser-owned nodes
# directly so syntax slices cannot drift through local shadow classes.
sys.path.append(os.path.join(os.path.dirname(__file__), '../parser'))
from enhanced_parser import *  # noqa: F401,F403
from enhanced_parser import parse_tokens as parser_parse_tokens
from enhanced_parser import parse_statement_tokens as parser_parse_statement_tokens
from enhanced_parser import parse_expression_tokens as parser_parse_expression_tokens
from enhanced_parser import parse_template_tokens as parser_parse_template_tokens
from enhanced_parser import parse_array_tokens as parser_parse_array_tokens

class TranspilerError(Exception):
    def __init__(self, message: str, node: Optional[ASTNode] = None):
        self.message = message
        self.node = node
        super().__init__(f"Transpiler Error: {message}")

NAMED_UNSUPPORTED_AST_DIAGNOSTICS = {
    "ThrowStatement": "Unsupported JavaScript exception flow: throw statements are not canonicalized for cross-target emission yet",
    "TaggedTemplateExpression": "Unsupported JavaScript template literal form: tagged template literals are not canonicalized for cross-target emission yet",
}

class EnhancedTranspiler:
    """
    LUASCRIPT Enhanced Transpiler - Fixes Critical Issues
    
    Addresses audit findings:
    1. Array methods properly connected to runtime library
    2. Template string interpolation generates working code  
    3. Mathematical Unicode operators converted correctly
    4. Mathematical function notation support
    """
    
    # Mathematical Unicode to Lua operator mapping
    MATHEMATICAL_OPERATORS = {
        TokenType.MULTIPLY_UNICODE: '*',    # × → *
        TokenType.DIVIDE_UNICODE: '/',      # ÷ → /
        TokenType.MINUS_UNICODE: '-',       # − → -
        TokenType.PLUS_MINUS: '±',          # ± (special handling)
        TokenType.DOT_PRODUCT: 'dot_product',
        TokenType.CROSS_PRODUCT: 'cross_product',
        TokenType.TENSOR_PRODUCT: 'tensor_product',
        TokenType.SQRT: 'sqrt',             # √ → math.sqrt
        TokenType.LESS_EQUAL_UNICODE: '<=', # ≤ → <=
        TokenType.GREATER_EQUAL_UNICODE: '>=', # ≥ → >=
        TokenType.NOT_EQUAL_UNICODE: '~=',  # ≠ → ~= (Lua's not equal)
        TokenType.ELEMENT_OF: 'element_of', # ∈ (custom function)
        TokenType.UNION: 'union',           # ∪ (custom function)
        TokenType.INTERSECTION: 'intersection', # ∩ (custom function)
    }
    
    # Common mathematical superscripts to exponents
    SUPERSCRIPT_MAP = {
        '²': '^2',
        '³': '^3', 
        '⁴': '^4',
        '⁵': '^5',
    }
    
    # Mathematical constants to Lua expressions
    MATHEMATICAL_CONSTANTS = {
        TokenType.MATH_PI: 'math.pi',
        TokenType.MATH_E: 'math.exp(1)',
        TokenType.MATH_PHI: '((1 + math.sqrt(5)) / 2)',  # Golden ratio
        TokenType.MATH_INFINITY: 'math.huge',
    }

    MATHEMATICAL_IDENTIFIER_CONSTANTS = {
        'π': 'math.pi',
        'ℯ': 'math.exp(1)',
        'φ': '((1 + math.sqrt(5)) / 2)',
        '∞': 'math.huge',
    }

    UNICODE_IDENTIFIER_NAMES = {
        'α': 'alpha',
        'β': 'beta',
        'γ': 'gamma',
        'δ': 'delta',
        'Δ': 'Delta',
        'ε': 'epsilon',
        'θ': 'theta',
        'λ': 'lambda',
        'μ': 'mu',
        'π': 'pi',
        'ρ': 'rho',
        'σ': 'sigma',
        'Σ': 'Sigma',
        'φ': 'phi',
        'ω': 'omega',
        'Ω': 'Omega',
    }

    SUBSCRIPT_DIGITS = {
        '₀': '0',
        '₁': '1',
        '₂': '2',
        '₃': '3',
        '₄': '4',
        '₅': '5',
        '₆': '6',
        '₇': '7',
        '₈': '8',
        '₉': '9',
    }

    SUPERSCRIPT_DIGITS = {
        '⁰': '0',
        '¹': '1',
        '²': '2',
        '³': '3',
        '⁴': '4',
        '⁵': '5',
        '⁶': '6',
        '⁷': '7',
        '⁸': '8',
        '⁹': '9',
    }
    
    # JavaScript array methods that need runtime library connection
    ARRAY_METHODS = {
        'map': '_LS.map',
        'filter': '_LS.filter', 
        'reduce': '_LS.reduce',
        'forEach': '_LS.forEach',
        'find': '_LS.find',
        'some': '_LS.some',
        'every': '_LS.every',
        'indexOf': '_LS.indexOf',
        'includes': '_LS.includes',
        'slice': '_LS.slice',
        'concat': '_LS.concat',
    }

    GLOBAL_RUNTIME_FUNCTIONS = {
        'length': '_LS.length',
        'len': '_LS.length',
        'map': '_LS.map',
        'filter': '_LS.filter',
        'map_indexed': '_LS.map_indexed',
        'reduce': '_LS.reduce',
        'keys': '_LS.keys',
        'dict': '_LS.dict',
        'iterate_until': '_LS.iterate_until',
        'random_normal': '_LS.random_normal',
        'fft': '_LS.fft',
        'inverse_fft': '_LS.inverse_fft',
        'sum': '_LS.math.summation',
        'summation': '_LS.math.summation',
        'product': '_LS.math.product',
        'integral': '_LS.math.integral',
        'derivative': '_LS.math.derivative',
        'vector': '_LS.math.vector',
        'vec': '_LS.math.vector',
        'dot': '_LS.math.dot',
        'cross': '_LS.math.cross',
        'tensor_product': '_LS.math.tensor_product',
        'outer': '_LS.math.tensor_product',
        'norm': '_LS.math.norm',
        'unit': '_LS.math.unit',
        'gradient': '_LS.math.gradient',
        'grad': '_LS.math.gradient',
        'nabla': '_LS.math.gradient',
        'divergence': '_LS.math.divergence',
        'div': '_LS.math.divergence',
        'curl': '_LS.math.curl',
        'quantity': '_LS.math.quantity',
        'unit_quantity': '_LS.math.quantity',
        'unit_value': '_LS.math.unit_value',
        'unit_symbol': '_LS.math.unit_symbol',
        'unit_dimensions': '_LS.math.unit_dimensions',
        'unit_compatible': '_LS.math.unit_compatible',
        'unit_add': '_LS.math.unit_add',
        'unit_sub': '_LS.math.unit_sub',
        'unit_mul': '_LS.math.unit_mul',
        'unit_div': '_LS.math.unit_div',
        'unit_pow': '_LS.math.unit_pow',
        'unit_convert': '_LS.math.unit_convert',
        'meters': '_LS.math.meters',
        'seconds': '_LS.math.seconds',
        'kilograms': '_LS.math.kilograms',
        'amps': '_LS.math.amps',
        'volts': '_LS.math.volts',
        'ohms': '_LS.math.ohms',
        'watts': '_LS.math.watts',
        'joules': '_LS.math.joules',
        'coulombs': '_LS.math.coulombs',
        'farads': '_LS.math.farads',
        'henries': '_LS.math.henries',
        'teslas': '_LS.math.teslas',
        'newtons': '_LS.math.newtons',
        'phasor': '_LS.math.phasor',
        'polar': '_LS.math.phasor',
        'phase': '_LS.math.phase',
        'reactance_L': '_LS.math.reactance_L',
        'reactance_C': '_LS.math.reactance_C',
        'impedance_R': '_LS.math.impedance_R',
        'impedance_L': '_LS.math.impedance_L',
        'impedance_C': '_LS.math.impedance_C',
        'series_impedance': '_LS.math.series_impedance',
        'parallel_impedance': '_LS.math.parallel_impedance',
        'rms': '_LS.math.rms',
        'peak': '_LS.math.peak',
        'rc_time_constant': '_LS.math.rc_time_constant',
        'rl_time_constant': '_LS.math.rl_time_constant',
        'rc_cutoff_frequency': '_LS.math.rc_cutoff_frequency',
        'rl_cutoff_frequency': '_LS.math.rl_cutoff_frequency',
        'rlc_resonant_frequency': '_LS.math.rlc_resonant_frequency',
        'rlc_quality_series': '_LS.math.rlc_quality_series',
        'rlc_bandwidth_series': '_LS.math.rlc_bandwidth_series',
        'frequency_response': '_LS.math.frequency_response',
        'response_value': '_LS.math.response_value',
        'response_magnitude': '_LS.math.response_magnitude',
        'response_db': '_LS.math.response_db',
        'response_phase': '_LS.math.response_phase',
        'response_frequency': '_LS.math.response_frequency',
        'response_omega': '_LS.math.response_omega',
        'frequency_sweep': '_LS.math.frequency_sweep',
        'frequency_response_sweep': '_LS.math.frequency_response_sweep',
        'response_magnitudes': '_LS.math.response_magnitudes',
        'response_db_values': '_LS.math.response_db_values',
        'response_phases': '_LS.math.response_phases',
        'response_peak': '_LS.math.response_peak',
        'response_trough': '_LS.math.response_trough',
        'response_nearest': '_LS.math.response_nearest',
        'response_is_monotonic_db': '_LS.math.response_is_monotonic_db',
        'response_crossing_frequency': '_LS.math.response_crossing_frequency',
        'matrix': '_LS.math.matrix',
        'transpose': '_LS.math.transpose',
        'matmul': '_LS.math.matmul',
        'matrix_multiply': '_LS.math.matmul',
        'matrix_vector': '_LS.math.matrix_vector',
        'determinant2': '_LS.math.determinant2',
        'solve2': '_LS.math.solve2',
        'identity': '_LS.math.identity',
        'trace': '_LS.math.trace',
        'lorentz_force': '_LS.math.lorentz_force',
        'sym': '_LS.math.sym',
        'symbol': '_LS.math.symbol',
        'symbolic': '_LS.math.symbolic',
        'symbolic_format': '_LS.math.symbolic_format',
        'symbolic_simplify': '_LS.math.symbolic_simplify',
        'symbolic_evaluate': '_LS.math.symbolic_evaluate',
        'equation': '_LS.math.equation',
        'solve_linear': '_LS.math.solve_linear',
        'symbolic_solve_linear': '_LS.math.symbolic_solve_linear',
        'solve_linear_system': '_LS.math.solve_linear_system',
        'solution_get': '_LS.math.solution_get',
        'solution_format': '_LS.math.solution_format',
        'symbolic_dimensions': '_LS.math.symbolic_dimensions',
        'symbolic_dimension_format': '_LS.math.symbolic_dimension_format',
        'symbolic_assert_dimensions': '_LS.math.symbolic_assert_dimensions',
        'physics_dimensions': '_LS.math.physics_dimensions',
        'symbolic_substitute': '_LS.math.symbolic_substitute',
        'symbolic_derivative': '_LS.math.symbolic_derivative',
        'symbolic_func': '_LS.math.symbolic_func',
        'symbolic_sin': '_LS.math.symbolic_sin',
        'symbolic_cos': '_LS.math.symbolic_cos',
        'symbolic_exp': '_LS.math.symbolic_exp',
        'symbolic_log': '_LS.math.symbolic_log',
        'symbolic_impedance_R': '_LS.math.symbolic_impedance_R',
        'symbolic_impedance_L': '_LS.math.symbolic_impedance_L',
        'symbolic_impedance_C': '_LS.math.symbolic_impedance_C',
        'symbolic_voltage_divider': '_LS.math.symbolic_voltage_divider',
        'rc_lowpass_transfer': '_LS.math.rc_lowpass_transfer',
        'rc_highpass_transfer': '_LS.math.rc_highpass_transfer',
        'rl_lowpass_transfer': '_LS.math.rl_lowpass_transfer',
        'rl_highpass_transfer': '_LS.math.rl_highpass_transfer',
        'rlc_series_impedance': '_LS.math.rlc_series_impedance',
        'symbolic_dot': '_LS.math.symbolic_dot',
        'symbolic_cross': '_LS.math.symbolic_cross',
        'symbolic_gradient': '_LS.math.symbolic_gradient',
        'symbolic_divergence': '_LS.math.symbolic_divergence',
        'symbolic_curl': '_LS.math.symbolic_curl',
        'physics_formula': '_LS.math.physics_formula',
        'formula_name': '_LS.math.formula_name',
        'formula_equation': '_LS.math.formula_equation',
        'formula_lhs': '_LS.math.formula_lhs',
        'formula_rhs': '_LS.math.formula_rhs',
        'formula_render': '_LS.math.formula_render',
        'real': '_LS.real',
        'real_part': '_LS.real',
        'imag': '_LS.imag',
        'imag_part': '_LS.imag',
        'magnitude': '_LS.magnitude',
    }

    GLOBAL_MATH_FUNCTIONS = {
        'abs': 'math.abs',
        'atan': 'math.atan',
        'ceil': 'math.ceil',
        'cos': 'math.cos',
        'floor': 'math.floor',
        'ln': 'math.log',
        'log': 'math.log',
        'max': 'math.max',
        'min': 'math.min',
        'sin': 'math.sin',
        'sqrt': 'math.sqrt',
        'tan': 'math.tan',
    }
    
    def __init__(self):
        self.indent_level = 0
        self.scope_stack: List[Set[str]] = [set()]
        self.declared_vars: Set[str] = set()
        self.imported_runtime = False
        self.continue_label_counter = 0
        self.continue_label_stack: List[str] = []
        self.meta_policy: Dict[str, Any] = {"targets": {}}
        self.verify_policy: Dict[str, Any] = {}
        self.bound_identifier_stack: List[Set[str]] = []
        
    def transpile(self, source: str, filename: str = "<string>") -> str:
        """Main transpilation entry point"""
        try:
            artifact = parse_artifact(source, filename)
            ast = artifact.program
            self.meta_policy = artifact.meta_policy
            self.verify_policy = artifact.verify_policy
            self.validate_capability_policy()
            
            # Generate Lua code
            lua_code = self.generate(ast)
            
            # Always import runtime library for full JavaScript compatibility (console, etc.)
            runtime_import = 'local _LS = require("runtime/core/enhanced_runtime")\n\n'
            lua_code = runtime_import + lua_code
                
            return lua_code
            
        except Exception as e:
            raise TranspilerError(f"Transpilation failed: {e}")

    def lua_policy(self) -> Dict[str, Any]:
        return self.meta_policy.get("targets", {}).get("lua", {})

    def lua_requires(self, capability: str) -> bool:
        return capability in self.lua_policy().get("requires", [])

    def lua_forbids(self, capability: str) -> bool:
        return capability in self.lua_policy().get("forbid", [])

    def validate_capability_policy(self):
        """Validate target policy relationships before Lua emission."""
        for target_name, target_policy in self.meta_policy.get("targets", {}).items():
            requires = set(target_policy.get("requires", []))
            forbid = set(target_policy.get("forbid", []))
            conflict = requires.intersection(forbid)
            if conflict:
                capability = sorted(conflict)[0]
                raise TranspilerError(f"Conflicting capability policy: {capability} is both required and forbidden")

            if (
                target_name == "lua"
                and target_policy.get("resolve", {}).get("continue") == "label_goto"
                and "lua.goto" not in requires
            ):
                raise TranspilerError("resolve continue using label_goto requires lua.goto")
            if (
                target_name == "lua"
                and target_policy.get("resolve", {}).get("continue") == "label_goto"
                and "lua.goto" in forbid
            ):
                raise TranspilerError("Forbidden capability used by meta policy: lua.goto")

    def sanitize_identifier_name(self, name: str) -> str:
        """Normalize source identifiers into valid Lua identifiers."""
        if name == "this":
            return "self"

        parts = []
        for char in str(name):
            if char.isascii() and (char.isalnum() or char == "_"):
                parts.append(char)
            elif char == "$":
                parts.append("_")
            elif char in self.SUBSCRIPT_DIGITS:
                parts.append(f"_{self.SUBSCRIPT_DIGITS[char]}")
            elif char in self.SUPERSCRIPT_DIGITS:
                parts.append(f"_pow_{self.SUPERSCRIPT_DIGITS[char]}")
            elif char in self.UNICODE_IDENTIFIER_NAMES:
                parts.append(self.UNICODE_IDENTIFIER_NAMES[char])
            else:
                parts.append(f"u{ord(char):04x}")

        sanitized = "".join(parts) or "_"
        if sanitized[0].isdigit():
            sanitized = f"_{sanitized}"
        return sanitized

    def generate_identifier_name(self, node: Identifier) -> str:
        if node.name == "this":
            return "self"
        if any(node.name in scope for scope in reversed(self.bound_identifier_stack)):
            return self.generate_binding_identifier_name(node)
        if getattr(node, "subscript", None) is None and node.name == "i":
            self.imported_runtime = True
            return "_LS.I"
        if getattr(node, "subscript", None) is None and node.name in self.GLOBAL_MATH_FUNCTIONS:
            return self.GLOBAL_MATH_FUNCTIONS[node.name]
        if getattr(node, "subscript", None) is None and node.name in self.MATHEMATICAL_IDENTIFIER_CONSTANTS:
            return self.MATHEMATICAL_IDENTIFIER_CONSTANTS[node.name]

        power = ""
        base = str(node.name)
        while base and base[-1] in self.SUPERSCRIPT_DIGITS:
            power = self.SUPERSCRIPT_DIGITS[base[-1]] + power
            base = base[:-1]
        if power and base:
            base_code = self.MATHEMATICAL_IDENTIFIER_CONSTANTS.get(base, self.sanitize_identifier_name(base))
            return f"({base_code} ^ {power})"

        name = self.sanitize_identifier_name(node.name)
        subscript = getattr(node, "subscript", None)
        if subscript is not None:
            name = f"{name}_{subscript}"
        return name

    def generate_binding_identifier_name(self, node: Identifier) -> str:
        """Generate a valid Lua variable name for declaration and assignment targets."""
        if node.name == "this":
            return "self"
        name = self.sanitize_identifier_name(node.name)
        subscript = getattr(node, "subscript", None)
        if subscript is not None:
            name = f"{name}_{subscript}"
        return name

    def generate_parameter_name(self, parameter: Any) -> str:
        return self.sanitize_identifier_name(parameter.name)

    def is_bound_identifier_name(self, name: str) -> bool:
        """Return true when a source identifier is locally declared in scope."""
        return any(name in scope for scope in reversed(self.bound_identifier_stack))

    def generate_default_parameter_initializers(self, parameters: List[Any]) -> List[str]:
        lines = []
        for parameter in parameters:
            default_value = getattr(parameter, "default_value", None)
            if default_value is None:
                continue
            name = self.generate_parameter_name(parameter)
            default_code = self.generate(default_value)
            lines.append(f"if {name} == nil then {name} = {default_code} end")
        return lines

    def contains_continue_statement(self, node) -> bool:
        """Return true when an AST subtree contains a continue statement."""
        if node is None:
            return False
        if node.__class__.__name__ == "ContinueStatement":
            return True
        if isinstance(node, list):
            return any(self.contains_continue_statement(item) for item in node)
        if hasattr(node, "__dict__"):
            return any(self.contains_continue_statement(value) for value in vars(node).values())
        return False
    
    def parse_tokens(self, tokens: List[Token]) -> Program:
        """Compatibility shim that delegates to the parser-owned token parser."""
        return parser_parse_tokens(tokens)
    
    def parse_statement(self, tokens: List[Token], start: int) -> tuple[Optional[ASTNode], int]:
        """Compatibility shim for parser-owned single-statement parsing."""
        return parser_parse_statement_tokens(tokens, start)
    
    def parse_mathematical_function(self, tokens: List[Token], start: int) -> tuple[FunctionDeclaration, int]:
        """Compatibility shim for parser-owned mathematical function parsing."""
        node, current = parser_parse_statement_tokens(tokens, start)
        if not isinstance(node, FunctionDeclaration) or not getattr(node, "is_mathematical", False):
            raise TranspilerError("Expected mathematical function syntax")
        return node, current

    def parse_expression_tokens(self, tokens: List[Token]) -> ASTNode:
        """Compatibility shim for parser-owned expression-token parsing."""
        significant = [token for token in tokens if token.type not in (TokenType.NEWLINE, TokenType.EOF)]
        if not significant:
            return Literal(None)
        expression, _ = parser_parse_expression_tokens(significant)
        return expression
    
    def parse_template_expression(self, tokens: List[Token], start: int) -> tuple[TemplateLiteral, int]:
        """Compatibility shim for parser-owned template literal parsing."""
        return parser_parse_template_tokens(tokens, start)
    
    def parse_array_expression(self, tokens: List[Token], start: int) -> tuple[Optional[ASTNode], int]:
        """Compatibility shim for parser-owned array literal parsing."""
        return parser_parse_array_tokens(tokens, start)
    
    def generate(self, node: ASTNode) -> str:
        """Generate Lua code from AST node"""
        if isinstance(node, Program):
            return self.visit_Program(node)
        elif isinstance(node, (MetaBlock, RepairBlock, VerifyBlock)):
            return ""
        elif isinstance(node, VariableDeclaration):
            return self.visit_VariableDeclaration(node)
        elif isinstance(node, FunctionDeclaration):
            return self.visit_FunctionDeclaration(node)
        elif isinstance(node, ClassDeclaration):
            return self.visit_ClassDeclaration(node)
        elif isinstance(node, IfStatement):
            return self.visit_IfStatement(node)
        elif isinstance(node, ForStatement):
            return self.visit_ForStatement(node)
        elif isinstance(node, ForOfStatement):
            return self.visit_ForOfStatement(node)
        elif isinstance(node, WhileStatement):
            return self.visit_WhileStatement(node)
        elif isinstance(node, TryStatement):
            return self.visit_TryStatement(node)
        elif isinstance(node, BlockStatement):
            return self.visit_BlockStatement(node)
        elif isinstance(node, ReturnStatement):
            return self.visit_ReturnStatement(node)
        elif isinstance(node, BreakStatement):
            return self.visit_BreakStatement(node)
        elif isinstance(node, ContinueStatement):
            return self.visit_ContinueStatement(node)
        elif isinstance(node, ExpressionStatement):
            return self.visit_ExpressionStatement(node)
        elif isinstance(node, CallExpression):
            return self.visit_CallExpression(node)
        elif isinstance(node, NewExpression):
            return self.visit_NewExpression(node)
        elif isinstance(node, MemberExpression):
            return self.visit_MemberExpression(node)
        elif isinstance(node, TemplateLiteral):
            return self.visit_TemplateLiteral(node)
        elif isinstance(node, BinaryExpression):
            return self.visit_BinaryExpression(node)
        elif isinstance(node, CompositionExpression):
            return self.visit_CompositionExpression(node)
        elif isinstance(node, OperatorSectionExpression):
            return self.visit_OperatorSectionExpression(node)
        elif isinstance(node, Identifier):
            return self.visit_Identifier(node)
        elif isinstance(node, Literal):
            return self.visit_Literal(node)
        elif isinstance(node, ArrayExpression):
            return self.visit_ArrayExpression(node)
        elif isinstance(node, ObjectExpression):
            return self.visit_ObjectExpression(node)
        elif isinstance(node, ArrowFunctionExpression):
            return self.visit_ArrowFunctionExpression(node)
        elif isinstance(node, AssignmentExpression):
            return self.visit_AssignmentExpression(node)
        elif isinstance(node, UnaryExpression):
            return self.visit_UnaryExpression(node)
        elif isinstance(node, UpdateExpression):
            return self.visit_UpdateExpression(node)
        elif isinstance(node, ConditionalExpression):
            return self.visit_ConditionalExpression(node)
        elif isinstance(node, PipelineExpression):
            return self.visit_PipelineExpression(node)
        elif isinstance(node, RangeExpression):
            return self.visit_RangeExpression(node)
        elif isinstance(node, LimitDirection):
            return self.visit_LimitDirection(node)
        elif isinstance(node, MathBinderExpression):
            return self.visit_MathBinderExpression(node)
        elif isinstance(node, MathDerivativeExpression):
            return self.visit_MathDerivativeExpression(node)
        elif isinstance(node, MathLimitExpression):
            return self.visit_MathLimitExpression(node)
        elif isinstance(node, LetInExpression):
            return self.visit_LetInExpression(node)
        elif isinstance(node, SequenceExpression):
            return self.visit_SequenceExpression(node)
        elif isinstance(node, CompositionFunctionDeclaration):
            return self.visit_CompositionFunctionDeclaration(node)
        else:
            node_type = type(node).__name__
            message = NAMED_UNSUPPORTED_AST_DIAGNOSTICS.get(
                node_type,
                f"Unsupported JavaScript AST node type: {node_type}"
            )
            raise TranspilerError(message)
    
    def visit_Program(self, node: Program) -> str:
        """Generate program code"""
        lines = []
        lines.append("-- Generated by LUASCRIPT Enhanced Transpiler")
        lines.append("-- Mathematical programming with Unicode operator support")
        lines.append("")

        self.bound_identifier_stack.append(self.collect_declared_names(node.statements))
        try:
            for stmt in node.statements:
                if stmt:
                    code = self.generate(stmt)
                    if code.strip():
                        lines.append(code)
        finally:
            self.bound_identifier_stack.pop()

        return "\n".join(lines)

    def collect_declared_names(self, statements) -> Set[str]:
        """Collect names declared in a statement list for local binding-aware emission."""
        names: Set[str] = set()
        for stmt in statements or []:
            if isinstance(stmt, VariableDeclaration):
                for declarator in stmt.declarations:
                    if isinstance(declarator.id, Identifier):
                        names.add(declarator.id.name)
            elif isinstance(stmt, FunctionDeclaration):
                names.add(stmt.name)
        return names
    
    def visit_FunctionDeclaration(self, node: FunctionDeclaration) -> str:
        """Generate function declarations with mathematical syntax support"""
        if node.is_mathematical:
            return self.visit_MathematicalFunction(node)
        
        # Standard function declaration
        params = [self.generate_parameter_name(p) for p in node.parameters]
        param_str = ", ".join(params)
        
        function_name = self.sanitize_identifier_name(node.name)
        lines = [f"function {function_name}({param_str})"]

        for initializer in self.generate_default_parameter_initializers(node.parameters):
            lines.append(self.indent_code(initializer))
        
        self.bound_identifier_stack.append({p.name for p in node.parameters})
        try:
            body_code = self.generate(node.body)
            if body_code.strip():
                lines.append(self.indent_code(body_code))
        finally:
            self.bound_identifier_stack.pop()
        
        lines.append("end")
        return "\n".join(lines)
    
    def visit_MathematicalFunction(self, node: FunctionDeclaration) -> str:
        """FIXED: Generate mathematical functions f(x) = expression"""
        params = [self.generate_parameter_name(p) for p in node.parameters]
        param_str = ", ".join(params)
        function_name = self.sanitize_identifier_name(node.name)
        
        self.bound_identifier_stack.append({p.name for p in node.parameters})
        try:
            # Convert mathematical expression tokens to Lua
            if hasattr(node, '_expression_tokens'):
                expr_code = self.convert_mathematical_expression(node._expression_tokens)
                body_code = f"return {expr_code}"
            else:
                body_code = self.generate(node.body)
                if not body_code.strip():
                    body_code = "return nil"

            initializer_code = "\n".join(self.generate_default_parameter_initializers(node.parameters))
            body_lines = []
            if initializer_code.strip():
                body_lines.append(initializer_code)
            body_lines.append(body_code)
        finally:
            self.bound_identifier_stack.pop()

        return f"function {function_name}({param_str})\n{self.indent_code(chr(10).join(body_lines))}\nend"

    def visit_CompositionFunctionDeclaration(self, node) -> str:
        """Generate executable helpers for mathematical composition declarations."""
        self.imported_runtime = True
        if node.operator == "∘":
            return "local function compose(f, g)\n  return _LS.compose(f, g)\nend"
        if node.operator == "⊙":
            return "local function binary_compose(f, g)\n  return _LS.binary_compose(f, g)\nend"
        raise TranspilerError(f"Unsupported composition operator: {node.operator}", node)
    
    def convert_mathematical_expression(self, tokens: List[Token]) -> str:
        """Convert mathematical tokens to Lua expression"""
        result = []
        i = 0
        
        while i < len(tokens):
            token = tokens[i]
            
            # Mathematical constants
            if token.type in self.MATHEMATICAL_CONSTANTS:
                result.append(self.MATHEMATICAL_CONSTANTS[token.type])
                
            # Mathematical operators  
            elif token.type in self.MATHEMATICAL_OPERATORS:
                lua_op = self.MATHEMATICAL_OPERATORS[token.type]
                if lua_op in ('sqrt', 'element_of', 'union', 'intersection'):
                    # Function call format
                    result.append(f"math.{lua_op}")
                else:
                    result.append(lua_op)
                    
            # Handle superscripts (², ³, etc.)
            elif token.value in self.SUPERSCRIPT_MAP:
                result.append(self.SUPERSCRIPT_MAP[token.value])
                
            # Regular tokens
            elif token.type == TokenType.IDENTIFIER:
                # Check if identifier contains superscripts
                identifier = token.value
                for superscript, exponent in self.SUPERSCRIPT_MAP.items():
                    identifier = identifier.replace(superscript, exponent)
                result.append(self.sanitize_identifier_name(identifier))
            elif token.type == TokenType.NUMBER:
                result.append(token.value)
            elif token.type == TokenType.LEFT_PAREN:
                result.append("(")
            elif token.type == TokenType.RIGHT_PAREN:
                result.append(")")
            elif token.type == TokenType.MULTIPLY:
                result.append("*")
            elif token.type == TokenType.PLUS:
                result.append("+")
            elif token.type == TokenType.MINUS:
                result.append("-")
            elif token.type == TokenType.DIVIDE:
                result.append("/")
            elif token.type == TokenType.POWER:
                result.append("^")
                
            i += 1
            
        return " ".join(result)
    
    def visit_CallExpression(self, node: CallExpression) -> str:
        """FIXED: Properly handle array method calls and Math object"""
        # Check if this is a member expression call (obj.method() or obj:method())
        if isinstance(node.callee, MemberExpression):
            obj_code = self.generate(node.callee.object)
            
            if isinstance(node.callee.property, Identifier):
                method_name = node.callee.property.name
                
                # FIXED: Special handling for Math object -> use dot syntax
                if isinstance(node.callee.object, Identifier) and node.callee.object.name == 'Math':
                    args = [self.generate(arg) for arg in node.arguments]
                    args_str = ", ".join(args)
                    return f"math.{method_name}({args_str})"
                
                # CRITICAL FIX: Special handling for console.log -> convert to print()
                if isinstance(node.callee.object, Identifier) and node.callee.object.name == 'console' and method_name == 'log':
                    args = [self.generate(arg) for arg in node.arguments]
                    args_str = ", ".join(args)
                    return f"print({args_str})"

                if method_name == 'repeat':
                    args = [self.generate(arg) for arg in node.arguments]
                    if len(args) != 1:
                        raise TranspilerError("String repeat expects exactly one argument", node)
                    return f"string.rep({obj_code}, {args[0]})"
                
                # CRITICAL FIX: Connect array methods to runtime library
                if method_name in self.ARRAY_METHODS:
                    self.imported_runtime = True
                    runtime_fn = self.ARRAY_METHODS[method_name]
                    
                    # Generate arguments
                    args = [obj_code]  # Array is first argument
                    for arg in node.arguments:
                        args.append(self.generate(arg))
                    
                    args_str = ", ".join(args)
                    return f"{runtime_fn}({args_str})"
                
                # Other method calls use colon syntax
                args = [self.generate(arg) for arg in node.arguments]
                args_str = ", ".join(args)
                return f"{obj_code}:{method_name}({args_str})"
        
        # Regular function call
        if (
            isinstance(node.callee, Identifier)
            and node.callee.name in {"lim", "limit"}
            and len(node.arguments) == 2
            and isinstance(node.arguments[0], LimitDirection)
        ):
            self.imported_runtime = True
            variable_name = self.generate_identifier_name(node.arguments[0].variable)
            target = self.generate(node.arguments[0].target)
            expression = self.generate(node.arguments[1])
            return f"_LS.limit(function({variable_name}) return {expression} end, \"{variable_name}\", {target})"

        callee = self.generate(node.callee)
        args = [self.generate(arg) for arg in node.arguments]
        args_str = ", ".join(args)
        if isinstance(node.callee, Identifier):
            callee_is_bound = self.is_bound_identifier_name(node.callee.name)
            if node.callee.name in self.GLOBAL_RUNTIME_FUNCTIONS and not callee_is_bound:
                self.imported_runtime = True
                runtime_fn = self.GLOBAL_RUNTIME_FUNCTIONS[node.callee.name]
                return f"{runtime_fn}({args_str})"
            if node.callee.name in self.GLOBAL_MATH_FUNCTIONS and not callee_is_bound:
                runtime_fn = self.GLOBAL_MATH_FUNCTIONS[node.callee.name]
                return f"{runtime_fn}({args_str})"
        if (
            isinstance(node.callee, Identifier)
            and node.callee.name == 'many'
            and self.has_lua_adapter('multiple_returns', 'packed_array')
        ):
            return f"_LS.many({args_str})"
        return f"{callee}({args_str})"
    
    def visit_TemplateLiteral(self, node: TemplateLiteral) -> str:
        """Generate proper template string interpolation using string.format"""
        if not node.expressions:
            # Simple template string without expressions
            if node.quasis:
                return f'"{node.quasis[0].value}"'
            else:
                return '""'
        
        # Template string with ${} expressions - use string.format
        format_str = ""
        format_args = []
        
        # Interleave quasis (text parts) and expressions
        for i in range(len(node.expressions)):
            # Add string part before expression
            if i < len(node.quasis):
                format_str += node.quasis[i].value
            
            # Add a string.format slot for the expression.
            format_str += "%s"
            expr_code = self.generate(node.expressions[i])
            format_args.append(expr_code)
        
        # Add final string part after last expression
        if len(node.quasis) > len(node.expressions):
            format_str += node.quasis[-1].value
        
        args_str = ", ".join(format_args)
        return f'string.format("{format_str}", {args_str})'
    
    def visit_ArrayExpression(self, node: ArrayExpression) -> str:
        """Generate arrays with runtime library metatable"""
        self.imported_runtime = True
        if len(node.elements) == 1 and isinstance(node.elements[0], RangeExpression):
            return self.visit_RangeExpression(node.elements[0])

        if any(isinstance(elem, RangeExpression) for elem in node.elements):
            result = "_LS.array({})"
            for index, elem in enumerate(node.elements):
                if elem is None:
                    continue
                if isinstance(elem, RangeExpression):
                    range_code = self.visit_RangeExpression(elem)
                    previous = node.elements[index - 1] if index > 0 else None
                    if (
                        getattr(elem, "step", None) is None
                        and isinstance(previous, Literal)
                        and isinstance(previous.value, (int, float))
                        and isinstance(elem.start, Literal)
                        and isinstance(elem.start.value, (int, float))
                    ):
                        inferred_step = elem.start.value - previous.value
                        range_code = f"_LS.range({self.generate(elem.start)}, {self.generate(elem.end)}, {inferred_step})"
                    result = f"_LS.concat({result}, {range_code})"
                else:
                    result = f"_LS.concat({result}, _LS.array({{{self.generate(elem)}}}))"
            return result

        elements = [self.generate(elem) if elem is not None else "nil" for elem in node.elements]
        elements_str = ", ".join(elements)
        
        # CRITICAL: Create arrays with proper metatable for methods
        return f"_LS.array({{{elements_str}}})"

    def visit_RangeExpression(self, node) -> str:
        """Generate an inclusive numeric range as an enhanced array."""
        self.imported_runtime = True
        start = self.generate(node.start)
        end = self.generate(node.end)
        if getattr(node, "step", None) is not None:
            step = self.generate(node.step)
            return f"_LS.range({start}, {end}, {step})"
        return f"_LS.range({start}, {end})"

    def visit_LimitDirection(self, node) -> str:
        """Generate compile/runtime metadata for a mathematical limit direction."""
        self.imported_runtime = True
        variable_name = self.generate_identifier_name(node.variable)
        target = self.generate(node.target)
        return f"_LS.limit_direction(\"{variable_name}\", {target})"

    def visit_MathBinderExpression(self, node) -> str:
        """Generate native mathematical binders as runtime range helpers."""
        self.imported_runtime = True
        runtime_functions = {
            "summation": "_LS.math.summation",
            "product": "_LS.math.product",
            "integral": "_LS.math.integral",
        }
        if node.operator not in runtime_functions:
            raise TranspilerError(f"Unsupported mathematical binder: {node.operator}", node)

        lower = self.generate(node.lower)
        upper = self.generate(node.upper)
        step_or_resolution = (
            self.generate(node.step_or_resolution)
            if getattr(node, "step_or_resolution", None) is not None
            else None
        )
        variable_name = self.generate_binding_identifier_name(node.variable)

        self.bound_identifier_stack.append({node.variable.name})
        try:
            body = self.generate(node.body)
        finally:
            self.bound_identifier_stack.pop()

        args = [f"function({variable_name}) return {body} end", lower, upper]
        if step_or_resolution is not None:
            args.append(step_or_resolution)
        return f"{runtime_functions[node.operator]}({', '.join(args)})"

    def visit_MathDerivativeExpression(self, node) -> str:
        """Generate native derivative binders as runtime derivative callbacks."""
        self.imported_runtime = True
        point = self.generate(node.point)
        step = self.generate(node.step) if getattr(node, "step", None) is not None else None
        variable_name = self.generate_binding_identifier_name(node.variable)

        self.bound_identifier_stack.append({node.variable.name})
        try:
            body = self.generate(node.body)
        finally:
            self.bound_identifier_stack.pop()

        args = [f"function({variable_name}) return {body} end", point]
        if step is not None:
            args.append(step)
        return f"_LS.math.derivative({', '.join(args)})"

    def visit_MathLimitExpression(self, node) -> str:
        """Generate native limit binders as runtime limit callbacks."""
        self.imported_runtime = True
        variable_name = self.generate_binding_identifier_name(node.direction.variable)
        target = self.generate(node.direction.target)

        self.bound_identifier_stack.append({node.direction.variable.name})
        try:
            body = self.generate(node.body)
        finally:
            self.bound_identifier_stack.pop()

        return f"_LS.limit(function({variable_name}) return {body} end, \"{variable_name}\", {target})"

    def visit_LetInExpression(self, node) -> str:
        """Generate let-in expressions as immediately invoked functions."""
        lines = ["(function()"]
        binding_names = {
            binding.id.name
            for binding in node.bindings
            if isinstance(binding.id, Identifier)
        }
        self.bound_identifier_stack.append(binding_names)
        try:
            for binding in node.bindings:
                name = (
                    self.generate_binding_identifier_name(binding.id)
                    if isinstance(binding.id, Identifier)
                    else self.generate(binding.id)
                )
                init = self.generate(binding.init) if binding.init is not None else "nil"
                lines.append(f"  local {name} = {init}")
            if isinstance(node.body, BlockStatement):
                lines.append(self.indent_code(self.generate(node.body)))
            elif isinstance(node.body, SequenceExpression):
                expressions = node.body.expressions
                for expr in expressions[:-1]:
                    lines.append(self.indent_code(self.generate(expr)))
                if expressions:
                    lines.append(f"  return {self.generate(expressions[-1])}")
                else:
                    lines.append("  return nil")
            else:
                lines.append(f"  return {self.generate(node.body)}")
        finally:
            self.bound_identifier_stack.pop()
        lines.append("end)()")
        return "\n".join(lines)

    def visit_SequenceExpression(self, node) -> str:
        """Generate a standalone expression sequence as an immediately invoked function."""
        lines = ["(function()"]
        for expr in node.expressions[:-1]:
            lines.append(self.indent_code(self.generate(expr)))
        if node.expressions:
            lines.append(f"  return {self.generate(node.expressions[-1])}")
        else:
            lines.append("  return nil")
        lines.append("end)()")
        return "\n".join(lines)

    def visit_PipelineExpression(self, node) -> str:
        """Generate a pipeline by threading the left value into the right stage."""
        self.imported_runtime = True
        left = self.generate(node.left)
        right = node.right

        if isinstance(right, CallExpression):
            if isinstance(right.callee, MemberExpression) and self.is_console_log_member(right.callee):
                args = [left] + [self.generate(arg) for arg in right.arguments]
                return f"print({', '.join(args)})"

            if isinstance(right.callee, Identifier):
                stage_name = right.callee.name
                args = [self.generate(arg) for arg in right.arguments]
                stage_is_bound = self.is_bound_identifier_name(stage_name)
                if stage_name in self.GLOBAL_RUNTIME_FUNCTIONS and not stage_is_bound:
                    runtime_fn = self.GLOBAL_RUNTIME_FUNCTIONS[stage_name]
                    return f"{runtime_fn}({', '.join([left] + args)})"
                if stage_name in self.GLOBAL_MATH_FUNCTIONS and not stage_is_bound:
                    runtime_fn = self.GLOBAL_MATH_FUNCTIONS[stage_name]
                    return f"{runtime_fn}({', '.join([left] + args)})"
                return f"{self.sanitize_identifier_name(stage_name)}({', '.join([left] + args)})"

            generated_stage = self.generate(right)
            return f"({generated_stage})({left})"

        if isinstance(right, MemberExpression) and self.is_console_log_member(right):
            return f"print({left})"

        if isinstance(right, Identifier):
            stage_is_bound = self.is_bound_identifier_name(right.name)
            if right.name in self.GLOBAL_RUNTIME_FUNCTIONS and not stage_is_bound:
                runtime_fn = self.GLOBAL_RUNTIME_FUNCTIONS[right.name]
                return f"{runtime_fn}({left})"
            if right.name in self.GLOBAL_MATH_FUNCTIONS and not stage_is_bound:
                runtime_fn = self.GLOBAL_MATH_FUNCTIONS[right.name]
                return f"{runtime_fn}({left})"
            return f"{self.generate(right)}({left})"

        if isinstance(right, ArrowFunctionExpression):
            return f"({self.generate(right)})({left})"

        generated_stage = self.generate(right)
        return f"({generated_stage})({left})"

    def is_console_log_member(self, node) -> bool:
        return (
            isinstance(node.object, Identifier)
            and node.object.name == 'console'
            and isinstance(node.property, Identifier)
            and node.property.name == 'log'
        )
    
    def visit_BinaryExpression(self, node: BinaryExpression) -> str:
        """Generate binary expressions with mathematical operator support"""
        left = self.generate(node.left)
        right = self.generate(node.right)
        
        # Handle mathematical Unicode operators
        if node.operator == '×':
            return f"({left} * {right})"
        elif node.operator in ('·', '⋅'):
            self.imported_runtime = True
            return f"_LS.math.dot({left}, {right})"
        elif node.operator == '⨯':
            self.imported_runtime = True
            return f"_LS.math.cross({left}, {right})"
        elif node.operator == '⊗':
            self.imported_runtime = True
            return f"_LS.math.tensor_product({left}, {right})"
        elif node.operator == '÷':
            return f"({left} / {right})"
        elif node.operator == '−':
            return f"({left} - {right})"
        elif node.operator == '≤':
            return f"({left} <= {right})"
        elif node.operator == '≥':
            return f"({left} >= {right})"
        elif node.operator == '≠':
            return f"({left} ~= {right})"
        elif node.operator in ('%', 'mod'):
            return f"({left} % {right})"
        elif node.operator == '√':
            return f"math.sqrt({right})"
        elif node.operator == '^':
            return f"({left} ^ {right})"
        elif node.operator == '∪':
            self.imported_runtime = True
            return f"_LS.math.union({left}, {right})"
        elif node.operator == '∩':
            self.imported_runtime = True
            return f"_LS.math.intersection({left}, {right})"
        elif node.operator == '∈':
            self.imported_runtime = True
            return f"_LS.math.element_of({left}, {right})"
        elif node.operator == '∉':
            self.imported_runtime = True
            return f"(not _LS.math.element_of({left}, {right}))"
        elif node.operator == '⊂':
            self.imported_runtime = True
            return f"_LS.math.subset_of({left}, {right})"
        elif node.operator == '⊃':
            self.imported_runtime = True
            return f"_LS.math.subset_of({right}, {left})"
        elif node.operator == '+':
            if self.has_lua_adapter('string_coercion', 'explicit_tostring'):
                return f"_LS.add({left}, {right})"
            # FIXED: Handle string concatenation vs numeric addition
            if self.is_string_concatenation(node.left, node.right):
                self.imported_runtime = True
                return f"_LS.add({left}, {right})"
            else:
                return f"({left} + {right})"
        elif node.operator == '||':
            if self.has_lua_adapter('truthiness', 'js_truthy'):
                return f"_LS.logical_or({left}, function() return {right} end)"
            # FIXED: JavaScript logical OR to Lua 'or'
            return f"({left} or {right})"
        elif node.operator == '&&':
            if self.has_lua_adapter('truthiness', 'js_truthy'):
                return f"_LS.logical_and({left}, function() return {right} end)"
            # FIXED: JavaScript logical AND to Lua 'and'
            return f"({left} and {right})"
        elif node.operator == '===':
            # FIXED: JavaScript strict equality to Lua equality
            return f"({left} == {right})"
        elif node.operator == '!==':
            # FIXED: JavaScript strict inequality to Lua inequality
            return f"({left} ~= {right})"
        elif node.operator == '==':
            # JavaScript loose equality to Lua equality
            return f"({left} == {right})"
        elif node.operator == '!=':
            # JavaScript loose inequality to Lua inequality
            return f"({left} ~= {right})"
        else:
            # Standard operators
            return f"({left} {node.operator} {right})"

    def visit_CompositionExpression(self, node) -> str:
        """Generate function composition expressions."""
        left = self.generate(node.left)
        right = self.generate(node.right)
        self.imported_runtime = True
        if node.operator == "∘":
            return f"_LS.compose({left}, {right})"
        if node.operator == "⊙":
            return f"_LS.binary_compose({left}, {right})"
        raise TranspilerError(f"Unsupported composition operator: {node.operator}", node)

    def visit_OperatorSectionExpression(self, node) -> str:
        """Generate an anonymous binary function from a mathematical operator section."""
        operator_map = {
            '+': '+',
            '-': '-',
            '−': '-',
            '*': '*',
            '×': '*',
            '/': '/',
            '÷': '/',
            '%': '%',
            'mod': '%',
            '^': '^',
            '·': '·',
            '⋅': '·',
            '⨯': '⨯',
            '⊗': '⊗',
        }
        lua_operator = operator_map.get(node.operator)
        if lua_operator is None:
            raise TranspilerError(f"Unsupported operator section: {node.operator}", node)
        if lua_operator == '·':
            self.imported_runtime = True
            return "(function(a, b) return _LS.math.dot(a, b) end)"
        if lua_operator == '⨯':
            self.imported_runtime = True
            return "(function(a, b) return _LS.math.cross(a, b) end)"
        if lua_operator == '⊗':
            self.imported_runtime = True
            return "(function(a, b) return _LS.math.tensor_product(a, b) end)"
        return f"(function(a, b) return (a {lua_operator} b) end)"
    
    def is_string_concatenation(self, left_node: ASTNode, right_node: ASTNode) -> bool:
        """Determine if + operator should be string concatenation (..) or numeric addition (+)"""
        # If either operand is a string literal, it's string concatenation
        if isinstance(left_node, Literal) and isinstance(left_node.value, str):
            return True
        if isinstance(right_node, Literal) and isinstance(right_node.value, str):
            return True
            
        # If either operand is a template literal, it's string concatenation
        if isinstance(left_node, TemplateLiteral) or isinstance(right_node, TemplateLiteral):
            return True
            
        # If either operand is a call to a string method, likely string concatenation
        if isinstance(left_node, CallExpression) and isinstance(left_node.callee, MemberExpression):
            if hasattr(left_node.callee.property, 'name') and left_node.callee.property.name in ['toString', 'substring', 'charAt', 'slice']:
                return True
        if isinstance(right_node, CallExpression) and isinstance(right_node.callee, MemberExpression):
            if hasattr(right_node.callee.property, 'name') and right_node.callee.property.name in ['toString', 'substring', 'charAt', 'slice']:
                return True
                
        # For nested binary expressions with +, check recursively
        if isinstance(left_node, BinaryExpression) and left_node.operator == '+':
            if self.is_string_concatenation(left_node.left, left_node.right):
                return True
        if isinstance(right_node, BinaryExpression) and right_node.operator == '+':
            if self.is_string_concatenation(right_node.left, right_node.right):
                return True
        
        # Default to numeric addition if we can't determine it's string concatenation
        return False

    def has_lua_adapter(self, feature: str, strategy: str) -> bool:
        """Check whether a Lua target semantic adapter is active."""
        lua_policy = self.meta_policy.get("targets", {}).get("lua", {})
        return (
            lua_policy.get("adapters", {}).get(feature) == strategy
            or lua_policy.get("repairs", {}).get(feature) == strategy
        )

    def to_lua_condition(self, expression: str) -> str:
        """Apply JS truthiness when requested by the Lua target policy."""
        if self.has_lua_adapter('truthiness', 'js_truthy'):
            return f"_LS.truthy({expression})"
        return expression
    
    # New visitor methods for JavaScript-like syntax
    def visit_VariableDeclaration(self, node) -> str:
        """Generate variable declarations"""
        lines = []
        
        for declarator in node.declarations:
            name = self.generate_binding_identifier_name(declarator.id)
            
            if node.kind == 'var':
                # Global variable
                if declarator.init:
                    init_code = self.generate(declarator.init)
                    lines.append(f"{name} = {init_code}")
                else:
                    lines.append(f"{name} = nil")
            else:
                # Local variable (let/const)
                if declarator.init:
                    init_code = self.generate(declarator.init)
                    lines.append(f"local {name} = {init_code}")
                else:
                    lines.append(f"local {name}")
        
        return "\n".join(lines)
    
    def visit_IfStatement(self, node) -> str:
        """Generate if statements"""
        test_code = self.to_lua_condition(self.generate(node.test))
        consequent_code = self.generate(node.consequent)
        
        lines = [f"if {test_code} then"]
        lines.append(self.indent_code(consequent_code))
        
        if node.alternate:
            alternate_code = self.generate(node.alternate)
            if isinstance(node.alternate, IfStatement):
                # else if
                lines.append(f"else{alternate_code[2:]}")  # Remove 'if' from nested if
            else:
                # else
                lines.append("else")
                lines.append(self.indent_code(alternate_code))
        
        lines.append("end")
        return "\n".join(lines)
    
    def visit_ForStatement(self, node) -> str:
        """Generate for loops"""
        # Traditional for loop: for (init; test; update) body
        lines = []
        body_has_continue = self.contains_continue_statement(node.body)
        continue_label = self.create_continue_label() if body_has_continue else None

        loop_scope = self.collect_declared_names([node.init]) if node.init else set()
        self.bound_identifier_stack.append(loop_scope)
        try:
            if node.init:
                init_code = self.generate(node.init)
                lines.append(init_code)

            lines.append("while true do")

            if node.test:
                test_code = self.to_lua_condition(self.generate(node.test))
                lines.append(f"  if not ({test_code}) then break end")

            if continue_label:
                self.continue_label_stack.append(continue_label)
            body_code = self.generate(node.body)
            if continue_label:
                self.continue_label_stack.pop()
            lines.append(self.indent_code(body_code))
            if continue_label:
                lines.append(f"  ::{continue_label}::")

            if node.update:
                update_code = self.generate(node.update)
                lines.append(f"  {update_code}")

            lines.append("end")
        finally:
            self.bound_identifier_stack.pop()
        return "\n".join(lines)
    
    def visit_ForOfStatement(self, node) -> str:
        """Generate for-of loops"""
        # for (item of array) body
        body_has_continue = self.contains_continue_statement(node.body)
        continue_label = self.create_continue_label() if body_has_continue else None
        if hasattr(node.left, 'declarations'):
            # Variable declaration: for (let item of array)
            var_identifier = node.left.declarations[0].id
            var_name = self.generate_binding_identifier_name(var_identifier)
            source_var_name = var_identifier.name
        else:
            # Identifier: for (item of array)
            var_name = self.generate_binding_identifier_name(node.left)
            source_var_name = node.left.name
        
        iterable_code = self.generate(node.right)
        self.bound_identifier_stack.append({source_var_name})
        if continue_label:
            self.continue_label_stack.append(continue_label)
        try:
            body_code = self.generate(node.body)
        finally:
            if continue_label:
                self.continue_label_stack.pop()
            self.bound_identifier_stack.pop()
        
        lines = [f"for _, {var_name} in ipairs({iterable_code}) do"]
        lines.append(self.indent_code(body_code))
        if continue_label:
            lines.append(f"  ::{continue_label}::")
        lines.append("end")
        
        return "\n".join(lines)
    
    def visit_WhileStatement(self, node) -> str:
        """Generate while loops"""
        body_has_continue = self.contains_continue_statement(node.body)
        continue_label = self.create_continue_label() if body_has_continue else None
        test_code = self.to_lua_condition(self.generate(node.test))
        if continue_label:
            self.continue_label_stack.append(continue_label)
        body_code = self.generate(node.body)
        if continue_label:
            self.continue_label_stack.pop()
        
        lines = [f"while {test_code} do"]
        lines.append(self.indent_code(body_code))
        if continue_label:
            lines.append(f"  ::{continue_label}::")
        lines.append("end")
        
        return "\n".join(lines)
    
    def visit_TryStatement(self, node) -> str:
        """Generate try-catch-finally (using pcall)"""
        block_code = self.generate(node.block)
        
        lines = ["local success, error = pcall(function()"]
        lines.append(self.indent_code(block_code))
        lines.append("end)")
        
        if node.handler:
            lines.append("if not success then")
            if node.handler.param:
                param_name = node.handler.param.name
                lines.append(f"  local {param_name} = error")
            
            handler_code = self.generate(node.handler.body)
            lines.append(self.indent_code(handler_code))
            lines.append("end")
        
        if node.finalizer:
            finalizer_code = self.generate(node.finalizer)
            lines.append("-- Finally block")
            lines.append(finalizer_code)
        
        return "\n".join(lines)
    
    def visit_ClassDeclaration(self, node) -> str:
        """Generate class declarations using metatables"""
        class_name = node.name
        
        lines = [f"local {class_name} = {{}}"]
        lines.append(f"{class_name}.__index = {class_name}")
        
        # Constructor
        constructor = None
        methods = []
        
        for method in node.body:
            if method.kind == 'constructor':
                constructor = method
            else:
                methods.append(method)
        
        # Generate constructor
        if constructor:
            params = [p.name for p in constructor.value.parameters]
            param_str = ", ".join(params)
            
            lines.append(f"function {class_name}.new({param_str})")
            lines.append(f"  local self = setmetatable({{}}, {class_name})")
            
            # Constructor body
            body_code = self.generate(constructor.value.body)
            lines.append(self.indent_code(body_code))
            
            lines.append("  return self")
            lines.append("end")
        
        # Generate methods
        for method in methods:
            method_name = method.key.name
            params = [p.name for p in method.value.parameters]
            param_str = ", ".join(['self'] + params)
            
            lines.append(f"function {class_name}:{method_name}({', '.join(params)})")
            
            body_code = self.generate(method.value.body)
            lines.append(self.indent_code(body_code))
            
            lines.append("end")
        
        return "\n".join(lines)
    
    def visit_NewExpression(self, node) -> str:
        """Generate new expressions"""
        callee_code = self.generate(node.callee)
        args = [self.generate(arg) for arg in node.arguments]
        args_str = ", ".join(args)
        
        return f"{callee_code}.new({args_str})"
    
    def visit_BlockStatement(self, node) -> str:
        """Generate block statements"""
        lines = []
        self.bound_identifier_stack.append(self.collect_declared_names(node.statements))
        try:
            for stmt in node.statements:
                if stmt:
                    code = self.generate(stmt)
                    if code.strip():
                        lines.append(code)
        finally:
            self.bound_identifier_stack.pop()
        return "\n".join(lines)
    
    def visit_ReturnStatement(self, node) -> str:
        """Generate return statements"""
        if node.argument:
            arg_code = self.generate(node.argument)
            return f"return {arg_code}"
        else:
            return "return"
    
    def visit_BreakStatement(self, node) -> str:
        """Generate break statements"""
        return "break"
    
    def visit_ContinueStatement(self, node) -> str:
        """Generate continue statements using a loop-local label."""
        if not self.continue_label_stack:
            raise TranspilerError("ContinueStatement requires an enclosing loop", node)
        if self.lua_forbids("lua.goto"):
            if self.lua_policy().get("resolve", {}).get("continue") == "label_goto":
                raise TranspilerError("Forbidden capability used by meta policy: lua.goto", node)
            raise TranspilerError("No policy-compatible lowering for continue on lua target", node)
        return f"goto {self.continue_label_stack[-1]}"

    def create_continue_label(self) -> str:
        self.continue_label_counter += 1
        return f"__continue_{self.continue_label_counter}"
    
    def visit_ObjectExpression(self, node) -> str:
        """Generate object literals"""
        if not node.properties:
            return "{}"
        
        lines = ["{"]
        for prop in node.properties:
            key_code = self.generate(prop.key)
            value_code = self.generate(prop.value)
            
            if prop.computed:
                lines.append(f"  [{key_code}] = {value_code},")
            elif isinstance(prop.key, Identifier):
                lines.append(f"  {prop.key.name} = {value_code},")
            else:
                lines.append(f"  [{key_code}] = {value_code},")
        
        lines.append("}")
        return "\n".join(lines)
    
    def visit_ArrowFunctionExpression(self, node) -> str:
        """Generate arrow functions"""
        params = [self.generate_parameter_name(p) for p in node.parameters]
        param_str = ", ".join(params)

        self.bound_identifier_stack.append({p.name for p in node.parameters})
        try:
            if isinstance(node.body, BlockStatement):
                # Block body
                body_code = self.generate(node.body)
                return f"function({param_str})\n{self.indent_code(body_code)}\nend"
            elif isinstance(node.body, AssignmentExpression):
                body_code = self.generate(node.body)
                value_code = self.generate(node.body.left)
                return f"function({param_str})\n{self.indent_code(body_code)}\n  return {value_code}\nend"
            else:
                # Expression body
                body_code = self.generate(node.body)
                return f"function({param_str}) return {body_code} end"
        finally:
            self.bound_identifier_stack.pop()
    
    def visit_AssignmentExpression(self, node) -> str:
        """Generate assignment expressions"""
        if (
            isinstance(node.left, MemberExpression)
            and node.left.computed
            and self.has_lua_adapter('indexing', 'zero_based')
        ):
            obj_code = self.generate(node.left.object)
            prop_code = self.generate(node.left.property)
            right_code = self.generate(node.right)
            current_code = f"_LS.index({obj_code}, {prop_code})"

            if node.operator in ('=', ':='):
                return f"_LS.set_index({obj_code}, {prop_code}, {right_code})"
            elif node.operator == '+=':
                return f"_LS.set_index({obj_code}, {prop_code}, {current_code} + {right_code})"
            elif node.operator == '-=':
                return f"_LS.set_index({obj_code}, {prop_code}, {current_code} - {right_code})"
            elif node.operator == '*=':
                return f"_LS.set_index({obj_code}, {prop_code}, {current_code} * {right_code})"
            elif node.operator == '/=':
                return f"_LS.set_index({obj_code}, {prop_code}, {current_code} / {right_code})"

        left_code = (
            self.generate_binding_identifier_name(node.left)
            if isinstance(node.left, Identifier)
            else self.generate(node.left)
        )
        right_code = self.generate(node.right)
        
        if node.operator in ('=', ':='):
            return f"{left_code} = {right_code}"
        elif node.operator == '+=':
            return f"{left_code} = {left_code} + {right_code}"
        elif node.operator == '-=':
            return f"{left_code} = {left_code} - {right_code}"
        elif node.operator == '*=':
            return f"{left_code} = {left_code} * {right_code}"
        elif node.operator == '/=':
            return f"{left_code} = {left_code} / {right_code}"
        else:
            return f"{left_code} {node.operator} {right_code}"
    
    def visit_UnaryExpression(self, node) -> str:
        """Generate unary expressions"""
        arg_code = self.generate(node.argument)
        
        if node.operator == '!':
            if self.has_lua_adapter('truthiness', 'js_truthy'):
                return f"not _LS.truthy({arg_code})"
            return f"not {arg_code}"
        elif node.operator in ('-', '−'):
            return f"-{arg_code}"
        elif node.operator == '+':
            return f"+{arg_code}"
        elif node.operator == '√':
            return f"math.sqrt({arg_code})"
        else:
            return f"{node.operator}{arg_code}"
    
    def visit_UpdateExpression(self, node) -> str:
        """Generate update expressions (++, --)"""
        arg_code = self.generate(node.argument)
        
        if node.operator == '++':
            if node.prefix:
                return f"({arg_code} = {arg_code} + 1)"
            else:
                return f"(function() local temp = {arg_code}; {arg_code} = {arg_code} + 1; return temp end)()"
        elif node.operator == '--':
            if node.prefix:
                return f"({arg_code} = {arg_code} - 1)"
            else:
                return f"(function() local temp = {arg_code}; {arg_code} = {arg_code} - 1; return temp end)()"
        
        return f"{node.operator}{arg_code}"
    
    def visit_ConditionalExpression(self, node) -> str:
        """Generate ternary conditional expressions"""
        test_code = self.to_lua_condition(self.generate(node.test))
        consequent_code = self.generate(node.consequent)
        alternate_code = self.generate(node.alternate)
        
        return f"({test_code} and {consequent_code} or {alternate_code})"
    
    def indent_code(self, code: str, spaces: int = 2) -> str:
        """Indent code by specified number of spaces"""
        if not code.strip():
            return code
        
        lines = code.split('\n')
        indented_lines = [' ' * spaces + line if line.strip() else line for line in lines]
        return '\n'.join(indented_lines)
    
    def visit_MemberExpression(self, node: MemberExpression) -> str:
        """Generate member expressions"""
        obj = self.generate(node.object)
        
        # FIXED: Convert JavaScript Math object to Lua math
        if isinstance(node.object, Identifier) and node.object.name == 'Math':
            obj = 'math'
        
        if node.computed:
            prop = self.generate(node.property)
            if self.has_lua_adapter('indexing', 'zero_based'):
                return f"_LS.index({obj}, {prop})"
            return f"{obj}[{prop}]"
        else:
            if isinstance(node.property, Identifier):
                if (
                    node.property.name == 'length'
                    and self.has_lua_adapter('length', 'array_length_property')
                ):
                    return f"_LS.length({obj})"
                return f"{obj}.{self.sanitize_identifier_name(node.property.name)}"
            else:
                prop = self.generate(node.property)
                return f"{obj}[{prop}]"
    
    def visit_ExpressionStatement(self, node: ExpressionStatement) -> str:
        """Generate expression statements"""
        return self.generate(node.expression)
    
    def visit_Identifier(self, node: Identifier) -> str:
        """Generate identifiers"""
        return self.generate_identifier_name(node)
        
    def visit_Literal(self, node: Literal) -> str:
        """Generate literals"""
        if isinstance(node.value, str):
            return f'"{node.value}"'
        elif node.value is None:
            return "nil"
        elif isinstance(node.value, bool):
            return "true" if node.value else "false"
        else:
            return str(node.value)

def transpile_source(source: str, filename: str = "<string>") -> str:
    """Enhanced transpilation with mathematical Unicode and array method support"""
    transpiler = EnhancedTranspiler()
    return transpiler.transpile(source, filename)

if __name__ == "__main__":
    # Test the enhanced transpiler
    test_source = '''
    // Mathematical function with Unicode operators
    gaussian(μ, σ²) = (1/√(2×π×σ²)) × ℯ^(-((x-μ)²)/(2×σ²))
    
    // Template string interpolation (FIXED!)
    let greeting = `Hello, ${name}! Value is ${value.toFixed(2)}`
    
    // Array methods properly connected to runtime (FIXED!)
    let numbers = [1, 2, 3, 4, 5]
    let doubled = numbers.map(x => x × 2)
    let filtered = doubled.filter(x => x > 4)
    let sum = filtered.reduce((a, b) => a + b, 0)
    '''
    
    try:
        lua_code = transpile_source(test_source)
        print("✅ Enhanced Transpiler Test Successful!")
        print("🚀 Generated Lua Code:")
        print("-" * 50)
        print(lua_code)
        print("-" * 50)
        print("🔧 Key Fixes Implemented:")
        print("  ✅ Mathematical Unicode operators (×, √, π, ℯ)")
        print("  ✅ Template string interpolation ${}")
        print("  ✅ Array methods connected to runtime (_LS.map)")
        print("  ✅ Mathematical function syntax f(x) = expr")
        
    except Exception as e:
        print(f"❌ Transpiler test failed: {e}")
        import traceback
        traceback.print_exc()
