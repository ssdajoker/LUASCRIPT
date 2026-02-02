"use strict";

/**
 * Universal Lowerer Enhancement
 * Provides language-agnostic IR lowering infrastructure
 * 
 * Purpose: Shared lowering passes for macro expansion, template
 * instantiation, operator overload resolution, and control flow normalization
 */

const LanguageTraits = require('../language/language_traits');
const TypeSystemBridge = require('./type_system_bridge');

class UniversalLowerer {
  constructor(options = {}) {
    this.options = options;
    this.languageTraits = new LanguageTraits();
    this.typeSystem = new TypeSystemBridge();
    this.initializeLoweringPasses();
  }

  /**
   * Initialize lowering pass registry
   */
  initializeLoweringPasses() {
    this.passes = {
      macroExpansion: { priority: 100, enabled: true },
      templateInstantiation: { priority: 90, enabled: true },
      operatorOverloadResolution: { priority: 80, enabled: true },
      typeCoercionInsertion: { priority: 70, enabled: true },
      controlFlowNormalization: { priority: 60, enabled: true },
      decoratorExpansion: { priority: 50, enabled: true },
      comprehensionLowering: { priority: 40, enabled: true },
      asyncAwaitTransformation: { priority: 30, enabled: true },
    };
  }

  /**
   * Lower AST to canonical IR using universal pipeline
   * @param {object} ast - AST node
   * @param {string} language - Source language
   * @param {object} context - Lowering context
   * @returns {object} Lowered IR node
   */
  lower(ast, language, context = {}) {
    context.language = language;
    context.traits = this.languageTraits.getCapabilities(language);

    let current = ast;

    // Run passes in priority order
    const sortedPasses = Object.entries(this.passes)
      .filter(([, pass]) => pass.enabled)
      .sort(([, a], [, b]) => b.priority - a.priority);

    for (const [passName, pass] of sortedPasses) {
      current = this.runPass(passName, current, language, context);
    }

    return current;
  }

  /**
   * Run a single lowering pass
   */
  runPass(passName, node, language, context) {
    switch (passName) {
      case 'macroExpansion':
        return this.expandMacros(node, language, context);
      case 'templateInstantiation':
        return this.instantiateTemplates(node, language, context);
      case 'operatorOverloadResolution':
        return this.resolveOperatorOverloads(node, language, context);
      case 'typeCoercionInsertion':
        return this.insertTypeCoercions(node, language, context);
      case 'controlFlowNormalization':
        return this.normalizeControlFlow(node, language, context);
      case 'decoratorExpansion':
        return this.expandDecorators(node, language, context);
      case 'comprehensionLowering':
        return this.lowerComprehensions(node, language, context);
      case 'asyncAwaitTransformation':
        return this.transformAsyncAwait(node, language, context);
      default:
        return node;
    }
  }

  /**
   * Expand macro definitions and calls
   * C/C++ preprocessor macros → IR function calls
   */
  expandMacros(node, language, context) {
    if (!node) return node;

    // Only C/C++ support macros
    if (language !== 'C' && language !== 'C++') {
      return node;
    }

    if (Array.isArray(node)) {
      return node.map(n => this.expandMacros(n, language, context));
    }

    if (typeof node !== 'object') return node;

    const result = { ...node };

    if (node.type === 'MacroDefinition') {
      result.expanded = {
        type: 'FunctionDefinition',
        name: `__macro_${node.name}`,
        parameters: node.parameters || [],
        body: node.body,
        isMacro: true,
      };
    }

    if (node.type === 'MacroCall') {
      result.expanded = {
        type: 'FunctionCall',
        name: `__macro_${node.name}`,
        arguments: node.arguments || [],
      };
    }

    // Recursively expand children
    for (const [key, value] of Object.entries(result)) {
      if (key === 'expanded') continue;
      result[key] = this.expandMacros(value, language, context);
    }

    return result;
  }

  /**
   * Instantiate generic/template types
   * C++ templates, C# generics, Python type annotations
   */
  instantiateTemplates(node, language, context) {
    if (!node) return node;

    // Check if language supports generics
    const supports = this.languageTraits.hasCapability(language, 'generics');
    if (!supports && !['C++', 'C#', 'OCaml'].includes(language)) {
      return node;
    }

    if (Array.isArray(node)) {
      return node.map(n => this.instantiateTemplates(n, language, context));
    }

    if (typeof node !== 'object') return node;

    const result = { ...node };

    if (node.type === 'TemplateDefinition' || node.type === 'GenericDefinition') {
      // Store template definition in context
      if (!context.templates) context.templates = {};
      context.templates[node.name] = node;

      result.type = 'TemplateDefinition';
      result.stored = true;
    }

    if (node.type === 'TemplateInstantiation') {
      // Look up template definition
      const template = context.templates?.[node.name];
      if (template) {
        result.instantiated = true;
        result.templateDefinition = template;
        result.typeArguments = node.typeArguments;
      }
    }

    // Recursively instantiate children
    for (const [key, value] of Object.entries(result)) {
      if (key === 'templateDefinition') continue;
      result[key] = this.instantiateTemplates(value, language, context);
    }

    return result;
  }

  /**
   * Resolve operator overloads to actual functions
   * C++ operator overloading → named function calls
   */
  resolveOperatorOverloads(node, language, context) {
    if (!node) return node;

    // C++ and C# support operator overloading
    if (!['C++', 'C#'].includes(language)) {
      return node;
    }

    if (Array.isArray(node)) {
      return node.map(n => this.resolveOperatorOverloads(n, language, context));
    }

    if (typeof node !== 'object') return node;

    const result = { ...node };

    if (node.type === 'BinaryOp' && node.overload) {
      result.type = 'FunctionCall';
      result.name = `__op_${node.operator}`;
      result.arguments = [node.left, node.right];
      result.originalOperator = node.operator;
    }

    if (node.type === 'UnaryOp' && node.overload) {
      result.type = 'FunctionCall';
      result.name = `__op_${node.operator}_unary`;
      result.arguments = [node.operand];
      result.originalOperator = node.operator;
    }

    // Recursively resolve children
    for (const [key, value] of Object.entries(result)) {
      result[key] = this.resolveOperatorOverloads(value, language, context);
    }

    return result;
  }

  /**
   * Insert implicit type coercions
   * Widen int to double, etc.
   */
  insertTypeCoercions(node, language, context) {
    if (!node) return node;

    if (Array.isArray(node)) {
      return node.map(n => this.insertTypeCoercions(n, language, context));
    }

    if (typeof node !== 'object') return node;

    const result = { ...node };

    // For binary operations, check operand types
    if (node.type === 'BinaryOp' && node.left && node.right) {
      const leftType = node.left.type;
      const rightType = node.right.type;

      // Check if coercion needed
      if (leftType && rightType && leftType !== rightType) {
        const canConvert = this.typeSystem.canConvert(leftType, rightType);
        if (canConvert) {
          result.left = {
            type: 'TypeCoercion',
            from: leftType,
            to: rightType,
            value: node.left,
          };
        }
      }
    }

    // Recursively insert coercions
    for (const [key, value] of Object.entries(result)) {
      result[key] = this.insertTypeCoercions(value, language, context);
    }

    return result;
  }

  /**
   * Normalize control flow structures
   * Complex conditionals → basic blocks
   */
  normalizeControlFlow(node, language, context) {
    if (!node) return node;

    if (Array.isArray(node)) {
      return node.map(n => this.normalizeControlFlow(n, language, context));
    }

    if (typeof node !== 'object') return node;

    const result = { ...node };

    // Flatten nested ternary operators
    if (node.type === 'ConditionalExpression' && node.condition?.type === 'ConditionalExpression') {
      result.normalized = true;
      result.flattenedConditions = [];

      // Extract conditions in order
      let current = node;
      while (current.type === 'ConditionalExpression') {
        result.flattenedConditions.push({
          condition: current.condition,
          consequent: current.consequent,
        });
        current = current.alternate;
      }
      result.finalAlternate = current;
    }

    // Break complex loops into simpler forms
    if (node.type === 'ForStatement') {
      result.normalized = true;
      result.initialization = node.init;
      result.condition = node.test;
      result.increment = node.update;
      result.body = node.body;
    }

    // Recursively normalize children
    for (const [key, value] of Object.entries(result)) {
      result[key] = this.normalizeControlFlow(value, language, context);
    }

    return result;
  }

  /**
   * Expand decorators to their underlying implementation
   * Python @property, @staticmethod → attribute access patterns
   */
  expandDecorators(node, language, context) {
    if (!node) return node;

    // Only Python/JavaScript/TypeScript support decorators
    if (!['Python', 'JavaScript', 'TypeScript', 'C#'].includes(language)) {
      return node;
    }

    if (Array.isArray(node)) {
      return node.map(n => this.expandDecorators(n, language, context));
    }

    if (typeof node !== 'object') return node;

    const result = { ...node };

    if (node.type === 'Decorator') {
      result.expanded = true;
      result.name = node.name;

      // Handle standard decorators
      if (node.name === 'property') {
        result.pattern = 'getter_setter_pair';
      } else if (node.name === 'staticmethod') {
        result.pattern = 'static_binding';
      } else if (node.name === 'classmethod') {
        result.pattern = 'class_binding';
      }
    }

    // Recursively expand children
    for (const [key, value] of Object.entries(result)) {
      result[key] = this.expandDecorators(value, language, context);
    }

    return result;
  }

  /**
   * Lower comprehensions to explicit loops
   * Python [x*2 for x in items] → for loop
   */
  lowerComprehensions(node, language, context) {
    if (!node) return node;

    // Only languages with comprehension support
    if (!this.languageTraits.hasCapability(language, 'comprehensions')) {
      return node;
    }

    if (Array.isArray(node)) {
      return node.map(n => this.lowerComprehensions(n, language, context));
    }

    if (typeof node !== 'object') return node;

    const result = { ...node };

    if (node.type === 'ListComprehension') {
      result.lowered = true;
      result.pattern = 'for_loop';
      result.forLoop = {
        type: 'ForStatement',
        variable: node.variable,
        iterable: node.iterable,
        body: {
          type: 'ExpressionStatement',
          expression: {
            type: 'FunctionCall',
            name: 'append',
            object: { type: 'Identifier', name: '__result' },
            arguments: [node.expression],
          },
        },
      };
      result.initialization = {
        type: 'VariableDeclaration',
        name: '__result',
        init: { type: 'ArrayLiteral', elements: [] },
      };
    }

    if (node.type === 'DictComprehension' || node.type === 'SetComprehension') {
      result.lowered = true;
      result.pattern = 'for_loop';
      // Similar transformation for dict/set
    }

    // Recursively lower children
    for (const [key, value] of Object.entries(result)) {
      result[key] = this.lowerComprehensions(value, language, context);
    }

    return result;
  }

  /**
   * Transform async/await syntax to state machine
   * async function → state machine with promise callbacks
   */
  transformAsyncAwait(node, language, context) {
    if (!node) return node;

    // Only languages with async support
    if (!this.languageTraits.hasCapability(language, 'async')) {
      return node;
    }

    if (Array.isArray(node)) {
      return node.map(n => this.transformAsyncAwait(n, language, context));
    }

    if (typeof node !== 'object') return node;

    const result = { ...node };

    if (node.type === 'AsyncFunctionDeclaration') {
      result.transformed = true;
      result.pattern = 'promise_based';
      result.originalAsync = true;
      
      // Create state machine representation
      result.stateMachine = {
        type: 'StateMachine',
        states: this.extractStatesFromAsync(node.body),
        initialState: 0,
      };
    }

    if (node.type === 'AwaitExpression') {
      result.transformed = true;
      result.pattern = 'then_chain';
      result.promiseValue = node.argument;
      result.continuationLabel = `__await_${Math.random()}`;
    }

    // Recursively transform children
    for (const [key, value] of Object.entries(result)) {
      result[key] = this.transformAsyncAwait(value, language, context);
    }

    return result;
  }

  /**
   * Extract state machine states from async function body
   */
  extractStatesFromAsync(body) {
    // Simplified: convert await points to state transitions
    if (!body) return [];

    const states = [];
    let stateIndex = 0;

    // Traverse body and extract await points
    const extractAwaitPoints = (node) => {
      if (!node) return;

      if (node.type === 'AwaitExpression') {
        states.push({
          index: stateIndex++,
          type: 'await',
          value: node.argument,
        });
      }

      if (Array.isArray(node)) {
        node.forEach(extractAwaitPoints);
      } else if (typeof node === 'object') {
        Object.values(node).forEach(extractAwaitPoints);
      }
    };

    extractAwaitPoints(body);

    if (states.length === 0) {
      states.push({ index: 0, type: 'sync', value: body });
    }

    return states;
  }

  /**
   * Enable or disable a specific pass
   */
  setPassEnabled(passName, enabled) {
    if (this.passes[passName]) {
      this.passes[passName].enabled = enabled;
    }
  }

  /**
   * Get all enabled passes in priority order
   */
  getEnabledPasses() {
    return Object.entries(this.passes)
      .filter(([, pass]) => pass.enabled)
      .sort(([, a], [, b]) => b.priority - a.priority)
      .map(([name]) => name);
  }
}

module.exports = UniversalLowerer;
