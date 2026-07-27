/**
 * KOTLIN PHASE C PARSER
 * Builds AST from Kotlin Phase C tokens
 * - Extension functions → AST nodes with receiver type
 * - Coroutines (suspend) → AST with async markers
 * - Reified generics → Type-aware AST nodes
 * - DSL builders → Lambda with receiver nodes
 * - Data/sealed classes → Special class nodes
 * 
 * Lines: 460
 */

const AbstractPhaseC_Parser = require("../framework/abstract_parser");

class KotlinPhaseC_Parser extends AbstractPhaseC_Parser {
  constructor(config = {}) {
    super({
      language: "Kotlin",
      ...config
    });

    this.parseMetrics = {
      extensionFunctionsParsed: 0,
      suspendFunctionsParsed: 0,
      reifiedGenericsParsed: 0,
      dslBuildersParsed: 0,
      dataClassesParsed: 0,
      sealedClassesParsed: 0,
      smartCastsParsed: 0
    };
  }

  /**
   * MAIN PARSE ENTRY POINT
   */
  parse(tokenResult) {
    const startTime = performance.now();
    this.tokens = tokenResult.tokens || tokenResult;
    this.position = 0;
    this.ast = {
      type: "Program",
      language: "Kotlin",
      body: [],
      phaseC: true
    };

    const maxIterations = this.tokens.length * 2;
    let iterations = 0;

    while (this.position < this.tokens.length && iterations < maxIterations) {
      iterations++;
      
      const node = this.parseStatement();
      if (node) {
        this.ast.body.push(node);
      } else {
        this.position++;
      }
    }

    const elapsed = performance.now() - startTime;
    return {
      ast: this.ast,
      metrics: this.parseMetrics,
      elapsed,
      iterations
    };
  }

  /**
   * PARSE STATEMENT
   */
  parseStatement() {
    const token = this.current();
    if (!token) return null;

    // Extension function
    if (token.type === "EXTENSION_FUNCTION") {
      return this.parseExtensionFunction();
    }

    // Suspend function
    if (token.type === "SUSPEND_KEYWORD") {
      return this.parseSuspendFunction();
    }

    // Inline function (possibly with reified)
    if (token.type === "INLINE_FUNCTION") {
      return this.parseInlineFunction();
    }

    // Data class
    if (token.type === "DATA_CLASS") {
      return this.parseDataClass();
    }

    // Sealed class
    if (token.type === "SEALED_CLASS") {
      return this.parseSealedClass();
    }

    // DSL builder
    if (token.type === "DSL_BUILDER") {
      return this.parseDSLBuilder();
    }

    // Coroutine builder
    if (token.type === "COROUTINE_BUILDER") {
      return this.parseCoroutineBuilder();
    }

    // Smart cast check (is/as)
    if (token.type === "TYPE_CHECK" || token.type === "TYPE_CAST") {
      return this.parseSmartCast();
    }

    // When expression
    if (token.value === "when") {
      return this.parseWhenExpression();
    }

    return null;
  }

  /**
   * PARSE EXTENSION FUNCTION
   * AST: {
   *   kind: 'extension_function',
   *   receiverType: 'String',
   *   name: 'reverse',
   *   parameters: [...],
   *   returnType: 'String',
   *   body: {...}
   * }
   */
  parseExtensionFunction() {
    const token = this.current();
    this.position++;

    const node = {
      kind: "extension_function",
      receiverType: token.receiverType,
      name: token.functionName,
      generics: token.generics || null,
      parameters: [],
      returnType: null,
      body: null,
      line: token.line,
      column: token.column
    };

    // Parse parameters
    if (this.match("(")) {
      node.parameters = this.parseParameterList();
    }

    // Parse return type
    if (this.match(":")) {
      this.position++; // Skip ':'
      const typeToken = this.current();
      if (typeToken) {
        node.returnType = typeToken.value;
        this.position++;
      }
    }

    // Parse body
    if (this.match("{") || this.match("=")) {
      node.body = this.parseBlock();
    }

    this.parseMetrics.extensionFunctionsParsed++;
    return node;
  }

  /**
   * PARSE SUSPEND FUNCTION
   * AST: {
   *   kind: 'suspend_function',
   *   name: 'fetchData',
   *   isSuspend: true,
   *   parameters: [...],
   *   returnType: 'Data',
   *   body: {...}
   * }
   */
  parseSuspendFunction() {
    this.position++; // Skip 'suspend' token

    const node = {
      kind: "suspend_function",
      isSuspend: true,
      name: null,
      parameters: [],
      returnType: null,
      body: null
    };

    // Expect 'fun' keyword
    if (this.match("fun") || this.matchType("IDENTIFIER")) {
      this.position++; // Skip 'fun'
      
      // Get function name
      const nameToken = this.current();
      if (nameToken && nameToken.type === "IDENTIFIER") {
        node.name = nameToken.value;
        this.position++;
      }
    }

    // Parse parameters
    if (this.match("(")) {
      node.parameters = this.parseParameterList();
    }

    // Parse return type
    if (this.match(":")) {
      this.position++;
      const typeToken = this.current();
      if (typeToken) {
        node.returnType = typeToken.value;
        this.position++;
      }
    }

    // Parse body
    if (this.match("{") || this.match("=")) {
      node.body = this.parseBlock();
    }

    this.parseMetrics.suspendFunctionsParsed++;
    return node;
  }

  /**
   * PARSE INLINE FUNCTION (with reified)
   * AST: {
   *   kind: 'inline_function',
   *   name: 'checkType',
   *   isInline: true,
   *   generics: [{ name: 'T', isReified: true }],
   *   body: {...}
   * }
   */
  parseInlineFunction() {
    const token = this.current();
    this.position++;

    const node = {
      kind: "inline_function",
      isInline: true,
      hasReified: token.hasReified || false,
      name: null,
      generics: [],
      parameters: [],
      returnType: null,
      body: null
    };

    // Skip 'reified' if present
    if (this.matchValue("reified")) {
      this.position++;
    }

    // Skip 'fun'
    if (this.matchValue("fun")) {
      this.position++;
    }

    // Parse generics
    if (this.match("<")) {
      node.generics = this.parseGenericParameters(token.hasReified);
    }

    // Get function name
    const nameToken = this.current();
    if (nameToken && nameToken.type === "IDENTIFIER") {
      node.name = nameToken.value;
      this.position++;
    }

    // Parse parameters
    if (this.match("(")) {
      node.parameters = this.parseParameterList();
    }

    // Parse return type
    if (this.match(":")) {
      this.position++;
      const typeToken = this.current();
      if (typeToken) {
        node.returnType = typeToken.value;
        this.position++;
      }
    }

    // Parse body
    if (this.match("{") || this.match("=")) {
      node.body = this.parseBlock();
    }

    if (token.hasReified) {
      this.parseMetrics.reifiedGenericsParsed++;
    }

    return node;
  }

  /**
   * PARSE DATA CLASS
   * AST: {
   *   kind: 'data_class',
   *   name: 'User',
   *   properties: [{ name: 'id', type: 'Int', isVal: true }, ...],
   *   methods: [...]
   * }
   */
  parseDataClass() {
    this.position++; // Skip 'data class'

    const node = {
      kind: "data_class",
      name: null,
      generics: [],
      properties: [],
      methods: []
    };

    // Skip 'class' keyword if separate
    if (this.matchValue("class")) {
      this.position++;
    }

    // Get class name
    const nameToken = this.current();
    if (nameToken && nameToken.type === "IDENTIFIER") {
      node.name = nameToken.value;
      this.position++;
    }

    // Parse generics
    if (this.match("<")) {
      node.generics = this.parseGenericParameters();
    }

    // Parse primary constructor properties
    if (this.match("(")) {
      node.properties = this.parseDataClassProperties();
    }

    // Parse body
    if (this.match("{")) {
      node.methods = this.parseClassBody();
    }

    this.parseMetrics.dataClassesParsed++;
    return node;
  }

  /**
   * PARSE SEALED CLASS
   * AST: {
   *   kind: 'sealed_class',
   *   name: 'Result',
   *   subclasses: [{ name: 'Success', ... }, { name: 'Error', ... }]
   * }
   */
  parseSealedClass() {
    this.position++; // Skip 'sealed'

    const node = {
      kind: "sealed_class",
      name: null,
      generics: [],
      subclasses: [],
      isAbstract: true
    };

    // Skip 'class'/'interface' keyword
    if (this.matchValue("class") || this.matchValue("interface")) {
      this.position++;
    }

    // Get class name
    const nameToken = this.current();
    if (nameToken && nameToken.type === "IDENTIFIER") {
      node.name = nameToken.value;
      this.position++;
    }

    // Parse generics
    if (this.match("<")) {
      node.generics = this.parseGenericParameters();
    }

    // Parse body (subclasses)
    if (this.match("{")) {
      node.subclasses = this.parseSealedSubclasses();
    }

    this.parseMetrics.sealedClassesParsed++;
    return node;
  }

  /**
   * PARSE DSL BUILDER
   * AST: {
   *   kind: 'dsl_invocation',
   *   builderName: 'html',
   *   lambdaWithReceiver: true,
   *   body: {...}
   * }
   */
  parseDSLBuilder() {
    const token = this.current();
    this.position++;

    const node = {
      kind: "dsl_invocation",
      builderName: token.builderType,
      lambdaWithReceiver: true,
      receiver: null,
      body: null
    };

    // Check if there's a lambda following
    if (this.match("{")) {
      node.body = this.parseLambdaWithReceiver();
    }

    this.parseMetrics.dslBuildersParsed++;
    return node;
  }

  /**
   * PARSE COROUTINE BUILDER
   * AST: {
   *   kind: 'coroutine_builder',
   *   builderType: 'launch' | 'async' | 'flow',
   *   scope: 'GlobalScope' | 'CoroutineScope',
   *   body: {...}
   * }
   */
  parseCoroutineBuilder() {
    const token = this.current();
    this.position++;

    const node = {
      kind: "coroutine_builder",
      builderType: token.builderType,
      scope: null,
      context: null,
      body: null
    };

    // Parse scope/context parameters
    if (this.match("(")) {
      node.context = this.parseCoroutineContext();
    }

    // Parse lambda body
    if (this.match("{")) {
      node.body = this.parseBlock();
    }

    return node;
  }

  /**
   * PARSE SMART CAST
   * AST: {
   *   kind: 'smart_cast',
   *   operator: 'is' | 'as' | 'as?',
   *   variable: 'x',
   *   targetType: 'String',
   *   isSafe: false
   * }
   */
  parseSmartCast() {
    const token = this.current();
    this.position++;

    const node = {
      kind: "smart_cast",
      operator: token.value,
      variable: null,
      targetType: null,
      isSafe: token.type === "SAFE_CAST"
    };

    // Get variable (before operator)
    const prevToken = this.tokens[this.position - 2];
    if (prevToken && prevToken.type === "IDENTIFIER") {
      node.variable = prevToken.value;
    }

    // Get target type (after operator)
    const typeToken = this.current();
    if (typeToken && typeToken.type === "IDENTIFIER") {
      node.targetType = typeToken.value;
      this.position++;
    }

    this.parseMetrics.smartCastsParsed++;
    return node;
  }

  /**
   * PARSE WHEN EXPRESSION
   * AST: {
   *   kind: 'when_expression',
   *   subject: 'x',
   *   branches: [
   *     { condition: 'is String', body: {...} },
   *     { condition: 'else', body: {...} }
   *   ]
   * }
   */
  parseWhenExpression() {
    this.position++; // Skip 'when'

    const node = {
      kind: "when_expression",
      subject: null,
      branches: []
    };

    // Parse subject
    if (this.match("(")) {
      this.position++; // Skip '('
      const subjectToken = this.current();
      if (subjectToken) {
        node.subject = subjectToken.value;
        this.position++;
      }
      if (this.match(")")) this.position++;
    }

    // Parse branches
    if (this.match("{")) {
      this.position++; // Skip '{'
      
      while (!this.match("}") && this.position < this.tokens.length) {
        const branch = this.parseWhenBranch();
        if (branch) node.branches.push(branch);
      }
      
      if (this.match("}")) this.position++;
    }

    return node;
  }

  /**
   * HELPER: Parse when branch
   */
  parseWhenBranch() {
    const conditionToken = this.current();
    if (!conditionToken) return null;

    const branch = {
      condition: conditionToken.value,
      body: null
    };

    this.position++;

    // Skip '->'
    if (this.match("->") || this.matchValue("->")) {
      this.position++;
    }

    // Parse body
    branch.body = this.parseExpression();

    // Skip optional comma
    if (this.match(",")) this.position++;

    return branch;
  }

  /**
   * HELPER: Parse parameter list
   */
  parseParameterList() {
    const params = [];
    this.position++; // Skip '('

    while (!this.match(")") && this.position < this.tokens.length) {
      const param = this.parseParameter();
      if (param) params.push(param);
      
      if (this.match(",")) this.position++;
    }

    if (this.match(")")) this.position++;
    return params;
  }

  /**
   * HELPER: Parse single parameter
   */
  parseParameter() {
    const nameToken = this.current();
    if (!nameToken) return null;

    const param = {
      name: nameToken.value,
      type: null,
      defaultValue: null
    };

    this.position++;

    if (this.match(":")) {
      this.position++;
      const typeToken = this.current();
      if (typeToken) {
        param.type = typeToken.value;
        this.position++;
      }
    }

    if (this.match("=")) {
      this.position++;
      param.defaultValue = this.parseExpression();
    }

    return param;
  }

  /**
   * HELPER: Parse generic parameters
   */
  parseGenericParameters(hasReified = false) {
    const generics = [];
    this.position++; // Skip '<'

    while (!this.match(">") && this.position < this.tokens.length) {
      const typeToken = this.current();
      if (typeToken && typeToken.type === "IDENTIFIER") {
        generics.push({
          name: typeToken.value,
          isReified: hasReified,
          constraint: null
        });
        this.position++;
      }

      if (this.match(",")) this.position++;
    }

    if (this.match(">")) this.position++;
    return generics;
  }

  /**
   * HELPER: Parse data class properties
   */
  parseDataClassProperties() {
    const properties = [];
    this.position++; // Skip '('

    while (!this.match(")") && this.position < this.tokens.length) {
      const prop = this.parseDataClassProperty();
      if (prop) properties.push(prop);
      
      if (this.match(",")) this.position++;
    }

    if (this.match(")")) this.position++;
    return properties;
  }

  /**
   * HELPER: Parse data class property
   */
  parseDataClassProperty() {
    const modToken = this.current();
    let isVal = false, isVar = false;

    if (modToken && (modToken.value === "val" || modToken.value === "var")) {
      isVal = modToken.value === "val";
      isVar = modToken.value === "var";
      this.position++;
    }

    const nameToken = this.current();
    if (!nameToken) return null;

    const prop = {
      name: nameToken.value,
      type: null,
      isVal,
      isVar,
      defaultValue: null
    };

    this.position++;

    if (this.match(":")) {
      this.position++;
      const typeToken = this.current();
      if (typeToken) {
        prop.type = typeToken.value;
        this.position++;
      }
    }

    if (this.match("=")) {
      this.position++;
      prop.defaultValue = this.parseExpression();
    }

    return prop;
  }

  /**
   * HELPER: Parse class body
   */
  parseClassBody() {
    const methods = [];
    this.position++; // Skip '{'

    while (!this.match("}") && this.position < this.tokens.length) {
      const stmt = this.parseStatement();
      if (stmt) methods.push(stmt);
    }

    if (this.match("}")) this.position++;
    return methods;
  }

  /**
   * HELPER: Parse sealed subclasses
   */
  parseSealedSubclasses() {
    const subclasses = [];
    this.position++; // Skip '{'

    while (!this.match("}") && this.position < this.tokens.length) {
      const token = this.current();
      
      if (token && (token.value === "data" || token.value === "class" || token.value === "object")) {
        subclasses.push({
          name: this.tokens[this.position + 1]?.value || "Unknown",
          kind: token.value
        });
        this.position += 2;
      } else {
        this.position++;
      }
    }

    if (this.match("}")) this.position++;
    return subclasses;
  }

  /**
   * HELPER: Parse lambda with receiver
   */
  parseLambdaWithReceiver() {
    const body = [];
    this.position++; // Skip '{'

    while (!this.match("}") && this.position < this.tokens.length) {
      const expr = this.parseExpression();
      if (expr) body.push(expr);
    }

    if (this.match("}")) this.position++;
    return { type: "LambdaBody", expressions: body };
  }

  /**
   * HELPER: Parse coroutine context
   */
  parseCoroutineContext() {
    const context = {};
    this.position++; // Skip '('

    while (!this.match(")") && this.position < this.tokens.length) {
      const token = this.current();
      if (token) {
        context[token.value] = true;
        this.position++;
      }
      if (this.match(",")) this.position++;
    }

    if (this.match(")")) this.position++;
    return context;
  }

  /**
   * HELPER: Parse block
   */
  parseBlock() {
    const statements = [];
    
    if (this.match("=")) {
      // Single expression body
      this.position++;
      const expr = this.parseExpression();
      return { type: "ExpressionBody", expression: expr };
    }

    if (this.match("{")) {
      this.position++;
      
      while (!this.match("}") && this.position < this.tokens.length) {
        const stmt = this.parseExpression();
        if (stmt) statements.push(stmt);
      }
      
      if (this.match("}")) this.position++;
    }

    return { type: "BlockStatement", statements };
  }

  /**
   * HELPER: Parse expression
   */
  parseExpression() {
    const token = this.current();
    if (!token) return null;

    this.position++;
    return {
      type: "Expression",
      value: token.value
    };
  }

  /**
   * HELPER: Get current token
   */
  current() {
    return this.tokens[this.position];
  }

  /**
   * HELPER: Match token value
   */
  match(value) {
    const token = this.current();
    return token && token.value === value;
  }

  /**
   * HELPER: Match token value exactly
   */
  matchValue(value) {
    const token = this.current();
    return token && token.value === value;
  }

  /**
   * HELPER: Match token type
   */
  matchType(type) {
    const token = this.current();
    return token && token.type === type;
  }
}

module.exports = KotlinPhaseC_Parser;
