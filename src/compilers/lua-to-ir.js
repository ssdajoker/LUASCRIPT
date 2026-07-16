/**
 * Lua to IR Compiler
 *
 * Converts a supported Lua input slice to LUASCRIPT canonical IR.
 */

const luaparse = require("luaparse");
const { IRBuilder } = require("../ir/builder");
const { Types } = require("../ir/types");

class LuaToIRCompiler {
  constructor(options = {}) {
    this.options = {
      comments: options.comments !== false,
      scope: options.scope !== false,
      locations: true,
      ranges: false,
      encodingMode: "pseudo-latin1",
      ...options
    };
    this.builder = null;
    this.tempVarCounter = 0;
  }

  /**
   * Compile Lua code to the root Program node.
   *
   * This keeps the original compiler API stable for existing round-trip tests.
   * Use compileArtifact() when the caller needs the full canonical IR artifact.
   */
  compile(luaCode) {
    return this.compileArtifact(luaCode).program;
  }

  /**
   * Compile Lua code to a canonical IR artifact plus the object-style root node
   * used by the existing generators.
   */
  compileArtifact(luaCode) {
    try {
      this.builder = new IRBuilder({
        metadata: { sourceLanguage: "lua" },
        source: { language: "lua" }
      });

      const ast = luaparse.parse(luaCode, this.options);
      const program = this.convertNode(ast);
      this.builder.pushToBody(program);

      const artifact = this.builder.build();
      artifact.program = program;
      artifact.root = program;
      artifact.sourceAst = ast;
      return artifact;
    } catch (error) {
      throw new Error(`Lua compilation error: ${error.message}`);
    }
  }

  convertNode(node) {
    if (!node) return null;

    const methodName = `convert${node.type}`;
    if (typeof this[methodName] === "function") {
      return this[methodName](node);
    }

    this.unsupported(node, `AST node type ${node.type}`);
  }

  // ========== PROGRAM & DECLARATIONS ==========

  convertChunk(node) {
    const body = this.convertBlockStatements(node.body);
    return this.builder.program(body, this.getLoc(node));
  }

  convertFunctionDeclaration(node) {
    if (node.parameters.some(param => param.type === "VarargLiteral")) {
      this.unsupported(node, "varargs");
    }

    const name = node.identifier ? this.convertIdentifierName(node.identifier) : null;
    const parameters = node.parameters.map(param => this.convertParameter(param));
    const body = this.convertBlock(node.body);

    return this.builder.functionDecl(name, parameters, body, null, {
      ...this.getLoc(node),
      metadata: { luaLocal: Boolean(node.isLocal) }
    });
  }

  convertLocalStatement(node) {
    if (node.init.length <= 1 && node.variables.length === 1) {
      const init = node.init && node.init[0] ? this.convertNode(node.init[0]) : null;
      return this.builder.varDecl(node.variables[0].name, init, null, {
        kind: "let",
        ...this.getLoc(node.variables[0]),
        metadata: { luaLocal: true }
      });
    }

    return this.convertMultiLocalStatement(node);
  }

  convertParameter(node) {
    if (node.type === "Identifier") {
      return this.builder.parameter(node.name, null, null, this.getLoc(node));
    }

    if (node.type === "VarargLiteral") {
      this.unsupported(node, "varargs");
    }

    this.unsupported(node, `parameter type ${node.type}`);
  }

  convertIdentifierName(node) {
    if (node.type === "Identifier") {
      return node.name;
    }

    if (node.type === "MemberExpression") {
      if (node.indexer === ":") {
        this.unsupported(node, "method declarations using ':'");
      }
      const obj = this.convertIdentifierName(node.base);
      const prop = this.convertIdentifierName(node.identifier);
      return `${obj}.${prop}`;
    }

    return node.name || "anonymous";
  }

  convertBlock(body) {
    return this.builder.block(this.convertBlockStatements(body));
  }

  // ========== STATEMENTS ==========

  convertReturnStatement(node) {
    if (node.arguments.length === 0) {
      return this.builder.returnStmt(null, this.getLoc(node));
    }

    if (node.arguments.length > 1) {
      this.unsupported(node, "multiple return values");
    }

    return this.builder.returnStmt(this.convertNode(node.arguments[0]), this.getLoc(node));
  }

  convertIfStatement(node) {
    let result = null;

    for (let i = node.clauses.length - 1; i >= 0; i--) {
      const clause = node.clauses[i];

      if (clause.type === "ElseClause") {
        result = this.convertBlock(clause.body);
      } else if (clause.type === "ElseifClause" || clause.type === "IfClause") {
        result = this.builder.ifStmt(
          this.convertNode(clause.condition),
          this.convertBlock(clause.body),
          result,
          this.getLoc(clause)
        );
      } else {
        this.unsupported(clause, `if clause type ${clause.type}`);
      }
    }

    return result;
  }

  convertWhileStatement(node) {
    return this.builder.whileStmt(
      this.convertNode(node.condition),
      this.convertBlock(node.body),
      this.getLoc(node)
    );
  }

  convertRepeatStatement(node) {
    this.unsupported(node, "repeat-until");
  }

  convertForNumericStatement(node) {
    const varName = node.variable.name;
    const start = this.convertNode(node.start);
    const end = this.convertNode(node.end);
    const step = node.step ? this.convertNode(node.step) : this.builder.literal(1, Types.number());
    const negativeStep = this.isNegativeNumericStep(node.step);

    const init = this.builder.varDecl(varName, start, null, {
      kind: "let",
      metadata: { luaNumericForInit: true }
    });
    const condition = this.builder.binaryOp(
      negativeStep ? ">=" : "<=",
      this.builder.identifier(varName),
      end
    );
    const update = this.builder.assignment(
      this.builder.identifier(varName),
      this.builder.add(this.builder.identifier(varName), step)
    );

    return this.builder.forStmt(init, condition, update, this.convertBlock(node.body), {
      ...this.getLoc(node),
      metadata: { luaNumericFor: true }
    });
  }

  convertForGenericStatement(node) {
    if (!node.iterators || node.iterators.length !== 1) {
      this.unsupported(node, "generic for with multiple iterators");
    }

    const iteratorCall = node.iterators[0];
    if (!iteratorCall || iteratorCall.type !== "CallExpression") {
      this.unsupported(node, "generic for without iterator call");
    }

    const calleeName = this.getLuaCalleeName(iteratorCall.base);
    if (calleeName !== "ipairs") {
      this.unsupported(node, "generic for");
    }

    if (node.variables.length !== 2) {
      this.unsupported(node, "ipairs loops without index/value variables");
    }
    if (iteratorCall.arguments.length !== 1) {
      this.unsupported(node, "ipairs() arity outside 1");
    }

    const iterableTemp = this.createTempVar("__lua_iter");
    const indexTemp = this.createTempVar("__lua_index");
    const iterableDecl = this.builder.varDecl(iterableTemp, this.convertNode(iteratorCall.arguments[0]), null, {
      kind: "let",
      metadata: { sourceLanguage: "lua", luaGenericForIterable: true }
    });
    const indexDecl = this.builder.varDecl(indexTemp, this.builder.literal(0, Types.number()), null, {
      kind: "let",
      metadata: { sourceLanguage: "lua", luaGenericForIndex: true, zeroBasedIndex: true }
    });

    const indexName = node.variables[0].name;
    const valueName = node.variables[1].name;
    const loopIndex = this.builder.identifier(indexTemp);
    const visibleIndex = this.builder.binaryOp("+", loopIndex, this.builder.literal(1, Types.number()));
    const visibleValue = this.builder.member(
      this.builder.identifier(iterableTemp),
      loopIndex,
      true,
      { metadata: { sourceLanguage: "lua", zeroBasedIndex: true } }
    );

    const loopPrologue = [
      this.builder.varDecl(indexName, visibleIndex, null, {
        kind: "let",
        metadata: { sourceLanguage: "lua", luaGenericForVisibleIndex: true }
      }),
      this.builder.varDecl(valueName, visibleValue, null, {
        kind: "let",
        metadata: { sourceLanguage: "lua", luaGenericForVisibleValue: true }
      })
    ];

    const bodyStatements = this.convertBlockStatements(node.body);
    const update = this.builder.expressionStmt(
      this.builder.assignment(
        this.builder.identifier(indexTemp),
        this.builder.binaryOp("+", this.builder.identifier(indexTemp), this.builder.literal(1, Types.number())),
        "=",
        this.getLoc(node)
      ),
      this.getLoc(node)
    );

    const condition = this.builder.binaryOp(
      "<",
      this.builder.identifier(indexTemp),
      this.createLuaBuiltinCall("__lua_len", [this.builder.identifier(iterableTemp)], "len", this.getLoc(node)),
      this.getLoc(node)
    );

    const loop = this.builder.whileStmt(
      condition,
      this.builder.block([...loopPrologue, ...bodyStatements, update], {
        metadata: { sourceLanguage: "lua", luaGenericForBody: true }
      }),
      this.getLoc(node)
    );

    return this.statementExpansion([iterableDecl, indexDecl, loop], node, { luaGenericFor: true });
  }

  convertBreakStatement(node) {
    return this.builder.breakStmt(this.getLoc(node));
  }

  convertGotoStatement(node) {
    this.unsupported(node, "goto");
  }

  convertLabelStatement(node) {
    this.unsupported(node, "labels");
  }

  convertDoStatement(node) {
    return this.convertBlock(node.body);
  }

  convertAssignmentStatement(node) {
    if (node.variables.length === 1 && node.init.length <= 1) {
      const left = this.convertNode(node.variables[0]);
      const right = node.init[0] ? this.convertNode(node.init[0]) : this.builder.literal(null, Types.null());
      return this.builder.expressionStmt(
        this.builder.assignment(left, right, "=", this.getLoc(node)),
        this.getLoc(node)
      );
    }

    return this.convertMultiAssignmentStatement(node);
  }

  convertCallStatement(node) {
    return this.builder.expressionStmt(this.convertNode(node.expression), this.getLoc(node));
  }

  // ========== EXPRESSIONS ==========

  convertBinaryExpression(node) {
    const operatorMap = {
      and: "&&",
      or: "||",
      "..": "concat",
      "~=": "!="
    };

    return this.builder.binaryOp(
      operatorMap[node.operator] || node.operator,
      this.convertNode(node.left),
      this.convertNode(node.right),
      this.getLoc(node)
    );
  }

  convertLogicalExpression(node) {
    return this.convertBinaryExpression(node);
  }

  convertUnaryExpression(node) {
    if (node.operator === "#") {
      return this.createLuaBuiltinCall("__lua_len", [this.convertNode(node.argument)], "len", this.getLoc(node));
    }

    const operatorMap = { not: "!" };
    return this.builder.unaryOp(
      operatorMap[node.operator] || node.operator,
      this.convertNode(node.argument),
      true,
      this.getLoc(node)
    );
  }

  convertCallExpression(node) {
    const calleeName = this.getLuaCalleeName(node.base);
    if (calleeName === "require") {
      this.unsupported(node, "require");
    }
    if (calleeName === "setmetatable" || calleeName === "getmetatable") {
      this.unsupported(node, "metatables");
    }
    if (calleeName && calleeName.startsWith("coroutine.")) {
      this.unsupported(node, "coroutines");
    }

    return this.builder.call(
      this.convertNode(node.base),
      node.arguments.map(arg => this.convertNode(arg)),
      this.getLoc(node)
    );
  }

  convertTableCallExpression(node) {
    this.unsupported(node, "table-call syntax");
  }

  convertStringCallExpression(node) {
    this.unsupported(node, "string-call syntax");
  }

  convertMemberExpression(node) {
    if (node.indexer === ":") {
      this.unsupported(node, "method calls using ':'");
    }

    return this.builder.member(
      this.convertNode(node.base),
      this.convertNode(node.identifier),
      node.indexer === "[",
      this.getLoc(node)
    );
  }

  convertIndexExpression(node) {
    return this.builder.member(
      this.convertNode(node.base),
      this.convertNode(node.index),
      true,
      {
        ...this.getLoc(node),
        metadata: { luaIndexBase: 1 }
      }
    );
  }

  convertTableConstructorExpression(node) {
    if (node.fields.some(field => field.type === "TableKey")) {
      this.unsupported(node, "complex table keys");
    }

    const hasArrayFields = node.fields.some(field => field.type === "TableValue");
    const hasObjectFields = node.fields.some(field => field.type === "TableKeyString");

    if (hasArrayFields && hasObjectFields) {
      this.unsupported(node, "mixed array/object table constructors");
    }

    if (hasObjectFields) {
      return this.builder.objectLiteral(
        node.fields.map(field => this.builder.property(
          this.builder.identifier(field.key.name),
          this.convertNode(field.value)
        )),
        this.getLoc(node)
      );
    }

    return this.builder.arrayLiteral(
      node.fields.map(field => this.convertNode(field.value)),
      {
        ...this.getLoc(node),
        metadata: { luaArray: true }
      }
    );
  }

  convertIdentifier(node) {
    return this.builder.identifier(node.name, this.getLoc(node));
  }

  convertNumericLiteral(node) {
    return this.builder.literal(node.value, Types.number(), this.getLoc(node));
  }

  convertStringLiteral(node) {
    return this.builder.literal(node.value, Types.string(), this.getLoc(node));
  }

  convertBooleanLiteral(node) {
    return this.builder.literal(node.value, Types.boolean(), this.getLoc(node));
  }

  convertNilLiteral(node) {
    return this.builder.literal(null, Types.null(), this.getLoc(node));
  }

  convertVarargLiteral(node) {
    this.unsupported(node, "varargs");
  }

  convertBlockStatements(body) {
    const result = [];
    for (const statement of body || []) {
      const converted = this.convertNode(statement);
      if (converted && converted.kind === "BlockStatement" && converted.metadata && converted.metadata.luaStatementExpansion) {
        result.push(...converted.statements);
      } else {
        result.push(converted);
      }
    }
    return result;
  }

  convertMultiLocalStatement(node) {
    const statements = [];
    const temps = this.convertInitializersToTemps(node.init || [], node);
    statements.push(...temps.declarations);

    for (let index = 0; index < node.variables.length; index++) {
      const variable = node.variables[index];
      const init = temps.values[index] || this.builder.literal(null, Types.null());
      statements.push(this.builder.varDecl(variable.name, init, null, {
        kind: "let",
        ...this.getLoc(variable),
        metadata: { sourceLanguage: "lua", luaLocal: true, luaMultiLocal: true }
      }));
    }

    return this.statementExpansion(statements, node, { luaLocalGroup: true });
  }

  convertMultiAssignmentStatement(node) {
    const statements = [];
    const temps = this.convertInitializersToTemps(node.init || [], node);
    statements.push(...temps.declarations);

    for (let index = 0; index < node.variables.length; index++) {
      const target = this.convertNode(node.variables[index]);
      const value = temps.values[index] || this.builder.literal(null, Types.null());
      statements.push(this.builder.expressionStmt(
        this.builder.assignment(target, value, "=", this.getLoc(node)),
        this.getLoc(node)
      ));
    }

    return this.statementExpansion(statements, node, { luaMultiAssignment: true });
  }

  convertInitializersToTemps(initializers, node) {
    const declarations = [];
    const values = [];

    for (const initializer of initializers) {
      const tempName = this.createTempVar("__lua_assign");
      declarations.push(this.builder.varDecl(tempName, this.convertNode(initializer), null, {
        kind: "let",
        metadata: { sourceLanguage: "lua", luaAssignmentTemp: true }
      }));
      values.push(this.builder.identifier(tempName));
    }

    return { declarations, values, node };
  }

  statementExpansion(statements, node, metadata = {}) {
    return this.builder.block(statements, {
      ...this.getLoc(node),
      metadata: { sourceLanguage: "lua", luaStatementExpansion: true, ...metadata }
    });
  }

  createLuaBuiltinCall(name, args, builtin, loc = {}) {
    return this.builder.call(
      this.builder.identifier(name),
      args,
      {
        ...loc,
        metadata: { sourceLanguage: "lua", luaBuiltin: builtin }
      }
    );
  }

  createTempVar(prefix) {
    return `${prefix}_${this.tempVarCounter++}`;
  }

  // ========== HELPERS ==========

  getLuaCalleeName(node) {
    if (!node) return null;
    if (node.type === "Identifier") return node.name;
    if (node.type === "MemberExpression") {
      const base = this.getLuaCalleeName(node.base);
      const prop = node.identifier && node.identifier.name;
      return base && prop ? `${base}.${prop}` : null;
    }
    return null;
  }

  isNegativeNumericStep(node) {
    return Boolean(
      node &&
      node.type === "UnaryExpression" &&
      node.operator === "-" &&
      node.argument &&
      node.argument.type === "NumericLiteral" &&
      node.argument.value > 0
    );
  }

  unsupported(node, feature) {
    const loc = node && node.loc && node.loc.start ? ` at line ${node.loc.start.line}` : "";
    throw new Error(`Unsupported Lua input feature: ${feature}${loc}`);
  }

  getLoc(node) {
    if (node && node.loc) {
      return {
        loc: {
          start: { line: node.loc.start.line, column: node.loc.start.column },
          end: { line: node.loc.end.line, column: node.loc.end.column }
        }
      };
    }
    return {};
  }
}

module.exports = {
  LuaToIRCompiler
};
