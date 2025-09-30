#!/usr/bin/env python3
"""
LUASCRIPT Enhanced Error Handler
Provides clear, actionable error messages for developers
Part of Week 2 completion - improving developer experience

Author: Linus Torvalds (GitHub Integration Lead)
"""

from typing import Optional, List, Tuple
from dataclasses import dataclass
import traceback

@dataclass
class ErrorContext:
    """Context information for better error reporting"""
    filename: str
    line: int
    column: int
    source_line: str
    error_type: str
    message: str
    suggestions: List[str]

class LuaScriptError(Exception):
    """Base exception for LUASCRIPT errors"""
    def __init__(self, message: str, context: Optional[ErrorContext] = None):
        super().__init__(message)
        self.context = context

class ParseError(LuaScriptError):
    """Parsing errors with enhanced context"""
    pass

class TranspileError(LuaScriptError):
    """Transpilation errors with suggestions"""
    pass

class RuntimeError(LuaScriptError):
    """Runtime execution errors"""
    pass

def format_error(error: LuaScriptError) -> str:
    """Format error with context and suggestions"""
    if not error.context:
        return str(error)
    
    ctx = error.context
    lines = []
    
    # Header
    lines.append(f"❌ {ctx.error_type} in {ctx.filename}:{ctx.line}:{ctx.column}")
    lines.append("")
    
    # Source context
    lines.append(f"  {ctx.line:4d} | {ctx.source_line}")
    lines.append(f"       | {' ' * ctx.column}^")
    lines.append("")
    
    # Error message
    lines.append(f"Error: {ctx.message}")
    
    # Suggestions
    if ctx.suggestions:
        lines.append("")
        lines.append("💡 Suggestions:")
        for suggestion in ctx.suggestions:
            lines.append(f"  • {suggestion}")
    
    return "\n".join(lines)

def suggest_fixes(error_message: str, context: str) -> List[str]:
    """Generate helpful suggestions based on error context"""
    suggestions = []
    
    if "Unexpected token" in error_message:
        suggestions.extend([
            "Check for missing semicolons or brackets",
            "Verify that all parentheses and braces are properly matched",
            "Make sure you're using valid JavaScript-like syntax"
        ])
    
    if "undefined" in error_message.lower():
        suggestions.extend([
            "Check if the variable is declared before use",
            "Verify the variable name spelling",
            "Make sure the variable is in scope"
        ])
    
    if "template" in context.lower():
        suggestions.extend([
            "Use ${expression} syntax for template literals",
            "Make sure template strings use backticks (`), not quotes"
        ])
    
    if "class" in context.lower():
        suggestions.extend([
            "Check class method syntax: methodName() { ... }",
            "Verify constructor syntax: constructor(params) { ... }",
            "Make sure class methods are properly indented"
        ])
    
    return suggestions

def create_error_context(filename: str, line: int, column: int, 
                        source_lines: List[str], error_type: str, 
                        message: str) -> ErrorContext:
    """Create error context with suggestions"""
    source_line = source_lines[line - 1] if line <= len(source_lines) else ""
    suggestions = suggest_fixes(message, source_line)
    
    return ErrorContext(
        filename=filename,
        line=line,
        column=column,
        source_line=source_line,
        error_type=error_type,
        message=message,
        suggestions=suggestions
    )
