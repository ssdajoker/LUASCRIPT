"use strict";

/**
 * Python to IR Compiler
 *
 * Parses a documented Python V1 slice through CPython's ast module and lowers
 * it into the same object-style canonical IR consumed by the current emitters.
 */

const { spawnSync } = require("child_process");
const { IRBuilder } = require("../ir/builder");
const { Types } = require("../ir/types");

const AST_TO_JSON_SCRIPT = `
import ast
import json
import sys

source = sys.stdin.read()

def encode(value):
    if isinstance(value, ast.AST):
        result = {"_type": value.__class__.__name__}
        for field in value._fields:
            result[field] = encode(getattr(value, field))
        for attr in ("lineno", "col_offset", "end_lineno", "end_col_offset"):
            if hasattr(value, attr):
                result[attr] = getattr(value, attr)
        return result
    if isinstance(value, list):
        return [encode(item) for item in value]
    return value

try:
    tree = ast.parse(source, filename="<luascript-python-input>", mode="exec")
    print(json.dumps(encode(tree), separators=(",", ":")))
except SyntaxError as error:
    print(f"{error.msg} at line {error.lineno}", file=sys.stderr)
    sys.exit(2)
`;

class PythonToIRCompiler {
  constructor(options = {}) {
    this.options = {
      pythonCommands: options.pythonCommands || ["python", "python3"],
      ...options
    };
    this.builder = null;
    this.scopes = [];
    this.kindScopes = [];
    this.tempVarCounter = 0;
  }

  compile(pythonCode) {
    return this.compileArtifact(pythonCode).program;
  }

  compileArtifact(pythonCode) {
    try {
      this.builder = new IRBuilder({
        metadata: { sourceLanguage: "python" },
        source: { language: "python" }
      });
      this.scopes = [];
      this.kindScopes = [];
      this.tempVarCounter = 0;

      const ast = this.parsePythonAst(pythonCode);
      this.pushScope();
      const program = this.convertNode(ast);
      this.popScope();

      this.builder.pushToBody(program);
      const artifact = this.builder.build();
      artifact.program = program;
      artifact.root = program;
      artifact.sourceAst = ast;
      return artifact;
    } catch (error) {
      throw new Error(`Python compilation error: ${error.message}`);
    }
  }

  parsePythonAst(source) {
    const failures = [];
    for (const command of this.options.pythonCommands) {
      const result = spawnSync(command, ["-c", AST_TO_JSON_SCRIPT], {
        input: source,
        encoding: "utf8",
        maxBuffer: 20 * 1024 * 1024,
        stdio: ["pipe", "pipe", "pipe"]
      });

      if (result.error && result.error.code === "ENOENT") {
        failures.push(`${command}: not found`);
        continue;
      }

      if (result.error) {
        failures.push(`${command}: ${result.error.message}`);
        continue;
      }

      if (result.status !== 0) {
        const message = (result.stderr || result.stdout || "unknown parser failure").trim();
        if (this.isUnavailablePythonLauncher(message)) {
          failures.push(`${command}: ${message}`);
          continue;
        }
        throw new Error(`Python parser error: ${message}`);
      }

      return JSON.parse(result.stdout);
    }

    throw new Error(`Python parser unavailable: ${failures.join("; ")}`);
  }

  isUnavailablePythonLauncher(message) {
    return /Python was not found; run without arguments to install from the Microsoft Store/i.test(message);
  }

  convertNode(node) {
    if (!node) return null;
    const methodName = `convert${node._type}`;
    if (typeof this[methodName] === "function") {
      return this[methodName](node);
    }
    this.unsupported(node, `AST node type ${node._type}`);
  }

  // ========== PROGRAM & DECLARATIONS ==========

  convertModule(node) {
    const body = this.convertStatementList(node.body);
    return this.builder.program(body, this.getLoc(node));
  }

  convertFunctionDef(node) {
    if ((node.decorator_list || []).length > 0) {
      this.unsupported(node, "decorators");
    }
    if (node.returns) {
      this.unsupported(node, "return annotations");
    }

    const parameters = this.convertArguments(node.args);
    const body = this.withScope(parameters.map(param => param.name), () => {
      return this.builder.block(this.convertStatementList(node.body));
    });

    this.declare(node.name, "function");
    return this.builder.functionDecl(node.name, parameters, body, null, {
      ...this.getLoc(node),
      metadata: { sourceLanguage: "python" }
    });
  }

  convertAsyncFunctionDef(node) {
    this.unsupported(node, "async functions");
  }

  convertArguments(node) {
    if ((node.posonlyargs || []).length > 0) {
      this.unsupported(node, "positional-only parameters");
    }
    if (node.vararg || node.kwarg) {
      this.unsupported(node, "varargs or kwargs");
    }
    if ((node.kwonlyargs || []).length > 0) {
      this.unsupported(node, "keyword-only parameters");
    }

    const args = node.args || [];
    const defaults = node.defaults || [];
    const firstDefault = args.length - defaults.length;

    return args.map((arg, index) => {
      const defaultValue = index >= firstDefault
        ? this.convertNode(defaults[index - firstDefault])
        : null;
      return this.builder.parameter(arg.arg, null, defaultValue, this.getLoc(arg));
    });
  }

  // ========== STATEMENTS ==========

  convertAssign(node) {
    if (node.targets.length !== 1) {
      this.unsupported(node, "multiple assignment targets");
    }

    const target = node.targets[0];
    if (this.isSequenceTarget(target)) {
      return this.convertSequenceAssignment(target.elts, node.value, node);
    }

    const value = this.convertNode(node.value);
    const valueKind = this.inferKind(node.value);

    if (target._type === "Name" && !this.isDeclared(target.id)) {
      this.declare(target.id, valueKind);
      return this.builder.varDecl(target.id, value, null, {
        kind: "let",
        ...this.getLoc(node),
        metadata: { sourceLanguage: "python" }
      });
    }

    if (target._type === "Name") {
      this.setKnownKind(target.id, valueKind);
    }

    return this.builder.expressionStmt(
      this.builder.assignment(this.convertAssignmentTarget(target), value, "=", this.getLoc(node)),
      this.getLoc(node)
    );
  }

  convertAnnAssign(node) {
    if (node.annotation) {
      this.unsupported(node, "type annotations");
    }
    return this.convertAssign({
      ...node,
      _type: "Assign",
      targets: [node.target],
      value: node.value || { _type: "Constant", value: null }
    });
  }

  convertAugAssign(node) {
    const operator = this.convertOperator(node.op);
    const target = this.convertAssignmentTarget(node.target);
    const value = this.builder.binaryOp(operator, target, this.convertNode(node.value), this.getLoc(node));
    return this.builder.expressionStmt(
      this.builder.assignment(target, value, "=", this.getLoc(node)),
      this.getLoc(node)
    );
  }

  convertExpr(node) {
    return this.builder.expressionStmt(this.convertNode(node.value), this.getLoc(node));
  }

  convertReturn(node) {
    return this.builder.returnStmt(
      node.value ? this.convertNode(node.value) : null,
      this.getLoc(node)
    );
  }

  convertIf(node) {
    const predeclared = this.createPredeclaredBranchVariables(
      [...(node.body || []), ...(node.orelse || [])],
      node
    );
    const consequent = this.builder.block(this.convertStatementList(node.body));
    let alternate = null;

    if ((node.orelse || []).length === 1 && node.orelse[0]._type === "If") {
      alternate = this.convertNode(node.orelse[0]);
    } else if ((node.orelse || []).length > 0) {
      alternate = this.builder.block(this.convertStatementList(node.orelse));
    }

    const ifStatement = this.builder.ifStmt(
      this.convertNode(node.test),
      consequent,
      alternate,
      this.getLoc(node)
    );

    if (predeclared.length > 0) {
      return this.statementExpansion([...predeclared, ifStatement], node);
    }

    return ifStatement;
  }

  convertWhile(node) {
    if ((node.orelse || []).length > 0) {
      this.unsupported(node, "while/else");
    }
    return this.builder.whileStmt(
      this.convertNode(node.test),
      this.builder.block(this.convertStatementList(node.body)),
      this.getLoc(node)
    );
  }

  convertFor(node) {
    if ((node.orelse || []).length > 0) {
      this.unsupported(node, "for/else");
    }
    if (!node.target || node.target._type !== "Name") {
      this.unsupported(node, "non-name for targets");
    }

    if (!this.isRangeCall(node.iter)) {
      return this.convertForEach(node);
    }

    const range = this.convertRangeArgs(node.iter.args || [], node);
    const varName = node.target.id;
    const init = this.builder.varDecl(varName, range.start, null, {
      kind: "let",
      metadata: { sourceLanguage: "python", pythonRangeInit: true }
    });
    this.declare(varName, "number");

    const condition = this.builder.binaryOp(
      range.negativeStep ? ">" : "<",
      this.builder.identifier(varName),
      range.stop,
      this.getLoc(node)
    );
    const update = this.builder.assignment(
      this.builder.identifier(varName),
      this.builder.binaryOp("+", this.builder.identifier(varName), range.step),
      "=",
      this.getLoc(node)
    );

    return this.builder.forStmt(
      init,
      condition,
      update,
      this.builder.block(this.convertStatementList(node.body)),
      {
        ...this.getLoc(node),
        metadata: { sourceLanguage: "python", pythonRangeFor: true }
      }
    );
  }

  convertForEach(node) {
    const itemName = node.target.id;
    const iterableTemp = this.createTempVar("__py_iter");
    const indexTemp = this.createTempVar("__py_index");

    const iterableDecl = this.builder.varDecl(iterableTemp, this.convertNode(node.iter), null, {
      kind: "let",
      metadata: { sourceLanguage: "python", pythonForEachIterable: true }
    });
    const indexDecl = this.builder.varDecl(indexTemp, this.builder.literal(0, Types.number()), null, {
      kind: "let",
      metadata: { sourceLanguage: "python", pythonForEachIndex: true }
    });

    this.declare(itemName);
    const itemDecl = this.builder.varDecl(
      itemName,
      this.createPythonIndexCall(
        this.builder.identifier(iterableTemp),
        this.builder.identifier(indexTemp)
      ),
      null,
      {
        kind: "let",
        metadata: { sourceLanguage: "python", pythonForEachItem: true }
      }
    );

    const increment = this.builder.expressionStmt(
      this.builder.assignment(
        this.builder.identifier(indexTemp),
        this.builder.binaryOp("+", this.builder.identifier(indexTemp), this.builder.literal(1, Types.number())),
        "=",
        this.getLoc(node)
      ),
      this.getLoc(node)
    );

    const body = this.builder.block([
      itemDecl,
      ...this.convertStatementList(node.body),
      increment
    ]);

    const loop = this.builder.whileStmt(
      this.builder.binaryOp(
        "<",
        this.builder.identifier(indexTemp),
        this.createPythonLenCall(this.builder.identifier(iterableTemp)),
        this.getLoc(node)
      ),
      body,
      {
        ...this.getLoc(node),
        metadata: { sourceLanguage: "python", pythonForEach: true }
      }
    );

    return this.statementExpansion([iterableDecl, indexDecl, loop], node);
  }

  convertBreak(node) {
    return this.builder.breakStmt(this.getLoc(node));
  }

  convertContinue(node) {
    this.unsupported(node, "continue statements");
  }

  convertImport(node) {
    this.unsupported(node, "imports");
  }

  convertImportFrom(node) {
    this.unsupported(node, "imports");
  }

  convertClassDef(node) {
    this.unsupported(node, "classes");
  }

  convertTry(node) {
    this.unsupported(node, "try/except");
  }

  convertRaise(node) {
    this.unsupported(node, "raise");
  }

  convertWith(node) {
    this.unsupported(node, "with statements");
  }

  convertAssert(node) {
    this.unsupported(node, "assert");
  }

  convertGlobal(node) {
    this.unsupported(node, "global declarations");
  }

  convertNonlocal(node) {
    this.unsupported(node, "nonlocal declarations");
  }

  convertDelete(node) {
    this.unsupported(node, "delete");
  }

  convertYield(node) {
    this.unsupported(node, "generators");
  }

  convertYieldFrom(node) {
    this.unsupported(node, "generators");
  }

  convertAwait(node) {
    this.unsupported(node, "async await");
  }

  // ========== EXPRESSIONS ==========

  convertName(node) {
    return this.builder.identifier(node.id, this.getLoc(node));
  }

  convertConstant(node) {
    if (node.value === null) {
      return this.builder.literal(null, Types.null(), this.getLoc(node));
    }
    if (typeof node.value === "number") {
      return this.builder.literal(node.value, Types.number(), this.getLoc(node));
    }
    if (typeof node.value === "string") {
      return this.builder.literal(node.value, Types.string(), this.getLoc(node));
    }
    if (typeof node.value === "boolean") {
      return this.builder.literal(node.value, Types.boolean(), this.getLoc(node));
    }
    this.unsupported(node, `constant value ${JSON.stringify(node.value)}`);
  }

  convertBinOp(node) {
    return this.builder.binaryOp(
      this.convertOperator(node.op),
      this.convertNode(node.left),
      this.convertNode(node.right),
      this.getLoc(node)
    );
  }

  convertBoolOp(node) {
    const operator = this.convertBoolOperator(node.op);
    if (!node.values || node.values.length === 0) {
      this.unsupported(node, "empty boolean expression");
    }
    return node.values.slice(1).reduce((left, right) => {
      return this.builder.binaryOp(operator, left, this.convertNode(right), this.getLoc(node));
    }, this.convertNode(node.values[0]));
  }

  convertUnaryOp(node) {
    return this.builder.unaryOp(
      this.convertUnaryOperator(node.op),
      this.convertNode(node.operand),
      true,
      this.getLoc(node)
    );
  }

  convertCompare(node) {
    const ops = node.ops || [];
    const comparators = node.comparators || [];
    if (ops.length !== comparators.length || ops.length === 0) {
      this.unsupported(node, "malformed comparison");
    }

    if (ops.length === 1 && (ops[0]._type === "In" || ops[0]._type === "NotIn")) {
      const membership = this.createPythonMembershipCall(
        this.convertNode(node.left),
        this.convertNode(comparators[0]),
        this.inferMembershipKind(comparators[0]),
        this.getLoc(node)
      );
      if (ops[0]._type === "NotIn") {
        return this.builder.unaryOp("!", membership, true, this.getLoc(node));
      }
      return membership;
    }

    if (ops.length !== 1) {
      const operands = [node.left, ...comparators];
      if (!operands.every(operand => this.isSimpleComparable(operand))) {
        this.unsupported(node, "complex chained comparisons");
      }
      if (ops.some(op => op._type === "In" || op._type === "NotIn")) {
        this.unsupported(node, "membership in chained comparisons");
      }

      let left = this.convertNode(node.left);
      let combined = null;
      for (let index = 0; index < ops.length; index++) {
        const right = this.convertNode(comparators[index]);
        const comparison = this.builder.binaryOp(
          this.convertCompareOperator(ops[index]),
          left,
          right,
          this.getLoc(node)
        );
        combined = combined
          ? this.builder.binaryOp("&&", combined, comparison, this.getLoc(node))
          : comparison;
        left = right;
      }
      return combined;
    }

    return this.builder.binaryOp(
      this.convertCompareOperator(node.ops[0]),
      this.convertNode(node.left),
      this.convertNode(node.comparators[0]),
      this.getLoc(node)
    );
  }

  convertCall(node) {
    if ((node.keywords || []).length > 0) {
      this.unsupported(node, "keyword call arguments");
    }
    const calleeName = this.getName(node.func);
    if (calleeName === "range") {
      this.unsupported(node, "range() outside for loops");
    }
    if (calleeName === "len") {
      if ((node.args || []).length !== 1) {
        this.unsupported(node, "len() arity outside 1");
      }
      return this.createPythonLenCall(this.convertNode(node.args[0]), this.getLoc(node));
    }
    if (node.func && node.func._type === "Attribute" && node.func.attr === "append") {
      if ((node.args || []).length !== 1) {
        this.unsupported(node, "list.append() arity outside 1");
      }
      return this.createPythonBuiltinCall(
        "__py_append",
        [this.convertNode(node.func.value), this.convertNode(node.args[0])],
        "append",
        this.getLoc(node)
      );
    }
    if (node.func && node.func._type === "Attribute" && node.func.attr === "pop") {
      if ((node.args || []).length > 1) {
        this.unsupported(node, "list.pop() arity outside 0..1");
      }
      return this.createPythonBuiltinCall(
        "__py_pop",
        [this.convertNode(node.func.value), ...(node.args || []).map(arg => this.convertNode(arg))],
        "pop",
        this.getLoc(node)
      );
    }
    if (node.func && node.func._type === "Attribute" && ["upper", "lower"].includes(node.func.attr)) {
      if ((node.args || []).length !== 0) {
        this.unsupported(node, `string.${node.func.attr} arguments`);
      }
      return this.builder.call(
        this.builder.identifier(`__py_string_${node.func.attr}`),
        [this.convertNode(node.func.value)],
        {
          ...this.getLoc(node),
          metadata: { sourceLanguage: "python", pythonBuiltin: `string_${node.func.attr}` }
        }
      );
    }
    return this.builder.call(
      this.convertNode(node.func),
      (node.args || []).map(arg => this.convertNode(arg)),
      this.getLoc(node)
    );
  }

  convertAttribute(node) {
    return this.builder.member(
      this.convertNode(node.value),
      this.builder.identifier(node.attr),
      false,
      this.getLoc(node)
    );
  }

  convertSubscript(node) {
    if (!node.slice) {
      this.unsupported(node, "missing subscript index");
    }
    if (node.slice._type === "Slice") {
      return this.createPythonSliceCall(
        this.convertNode(node.value),
        node.slice,
        this.getLoc(node)
      );
    }
    return this.createPythonIndexCall(
      this.convertNode(node.value),
      this.convertNode(node.slice),
      this.getLoc(node)
    );
  }

  convertList(node) {
    return this.builder.arrayLiteral(
      (node.elts || []).map(element => this.convertNode(element)),
      {
        ...this.getLoc(node),
        metadata: { sourceLanguage: "python", zeroBasedArray: true }
      }
    );
  }

  convertTuple(node) {
    return this.convertList({ ...node, _type: "List" });
  }

  convertDict(node) {
    if ((node.keys || []).some(key => !key)) {
      this.unsupported(node, "dictionary unpacking");
    }
    const properties = node.keys.map((key, index) => {
      return this.builder.property(this.convertNode(key), this.convertNode(node.values[index]));
    });
    return this.builder.objectLiteral(properties, {
      ...this.getLoc(node),
      metadata: { sourceLanguage: "python", pythonDict: true }
    });
  }

  convertListComp(node) {
    this.unsupported(node, "list comprehensions");
  }

  convertDictComp(node) {
    this.unsupported(node, "dict comprehensions");
  }

  convertSetComp(node) {
    this.unsupported(node, "set comprehensions");
  }

  convertSet(node) {
    this.unsupported(node, "set literals");
  }

  convertGeneratorExp(node) {
    this.unsupported(node, "generator expressions");
  }

  convertLambda(node) {
    this.unsupported(node, "lambda expressions");
  }

  convertIfExp(node) {
    return this.builder.conditional(
      this.convertNode(node.test),
      this.convertNode(node.body),
      this.convertNode(node.orelse),
      this.getLoc(node)
    );
  }

  // ========== HELPERS ==========

  convertStatementList(statements) {
    const result = [];
    for (const statement of statements || []) {
      const converted = this.convertNode(statement);
      if (!converted) {
        continue;
      }
      if (converted.kind === "BlockStatement" && converted.metadata && converted.metadata.pythonStatementExpansion) {
        result.push(...converted.statements);
      } else {
        result.push(converted);
      }
    }
    return result;
  }

  createPredeclaredBranchVariables(statements, sourceNode) {
    const names = this.collectAssignedNames(statements);
    const declarations = [];
    for (const name of names) {
      if (!this.isDeclared(name)) {
        this.declare(name);
        declarations.push(this.builder.varDecl(name, this.builder.literal(null, Types.null()), null, {
          kind: "let",
          ...this.getLoc(sourceNode),
          metadata: { sourceLanguage: "python", pythonBranchPredeclare: true }
        }));
      }
    }
    return declarations;
  }

  collectAssignedNames(statements) {
    const names = new Set();
    const visitTarget = (target) => {
      if (!target) return;
      if (target._type === "Name") {
        names.add(target.id);
      } else if (this.isSequenceTarget(target)) {
        for (const element of target.elts || []) {
          visitTarget(element);
        }
      }
    };

    const visitStatement = (statement) => {
      if (!statement) return;
      if (statement._type === "Assign") {
        for (const target of statement.targets || []) {
          visitTarget(target);
        }
      } else if (statement._type === "AnnAssign") {
        visitTarget(statement.target);
      } else if (statement._type === "If") {
        for (const child of [...(statement.body || []), ...(statement.orelse || [])]) {
          visitStatement(child);
        }
      }
    };

    for (const statement of statements || []) {
      visitStatement(statement);
    }
    return names;
  }

  convertSequenceAssignment(targets, valueNode, sourceNode) {
    if (!targets || targets.length === 0) {
      this.unsupported(sourceNode, "empty tuple assignment");
    }
    if (targets.some(target => target._type !== "Name")) {
      this.unsupported(sourceNode, "non-name tuple assignment targets");
    }

    const tempName = this.createTempVar("__py_unpack");
    const tempDecl = this.builder.varDecl(tempName, this.convertNode(valueNode), null, {
      kind: "let",
      metadata: { sourceLanguage: "python", pythonTupleAssignmentTemp: true }
    });

    const statements = [tempDecl];
    for (let index = 0; index < targets.length; index++) {
      const name = targets[index].id;
      const value = this.builder.member(
        this.builder.identifier(tempName),
        this.builder.literal(index, Types.number()),
        true,
        { metadata: { sourceLanguage: "python", zeroBasedIndex: true } }
      );

      if (!this.isDeclared(name)) {
        this.declare(name);
        statements.push(this.builder.varDecl(name, value, null, {
          kind: "let",
          metadata: { sourceLanguage: "python", pythonTupleAssignmentTarget: true }
        }));
      } else {
        statements.push(this.builder.expressionStmt(
          this.builder.assignment(this.builder.identifier(name), value, "=", this.getLoc(sourceNode)),
          this.getLoc(sourceNode)
        ));
      }
    }

    return this.statementExpansion(statements, sourceNode);
  }

  statementExpansion(statements, node) {
    return this.builder.block(statements, {
      ...this.getLoc(node),
      metadata: { sourceLanguage: "python", pythonStatementExpansion: true }
    });
  }

  isSequenceTarget(node) {
    return Boolean(node && (node._type === "Tuple" || node._type === "List"));
  }

  createPythonLenCall(argument, loc = {}) {
    return this.createPythonBuiltinCall("__py_len", [argument], "len", loc);
  }

  createPythonIndexCall(value, index, loc = {}) {
    return this.createPythonBuiltinCall("__py_index", [value, index], "index", loc);
  }

  createPythonSliceCall(value, slice, loc = {}) {
    if (slice.step) {
      this.unsupported(slice, "slice steps");
    }
    const lower = slice.lower
      ? this.convertNode(slice.lower)
      : this.builder.literal(null, Types.null(), loc);
    const upper = slice.upper
      ? this.convertNode(slice.upper)
      : this.builder.literal(null, Types.null(), loc);
    return this.createPythonBuiltinCall("__py_slice", [value, lower, upper], "slice", loc);
  }

  createPythonMembershipCall(item, collection, kind, loc = {}) {
    const helper = kind === "key" ? "__py_in_key" : "__py_in_value";
    return this.createPythonBuiltinCall(helper, [item, collection], kind === "key" ? "in_key" : "in_value", loc);
  }

  createPythonBuiltinCall(name, args, builtin, loc = {}) {
    return this.builder.call(
      this.builder.identifier(name),
      args,
      {
        ...loc,
        metadata: { sourceLanguage: "python", pythonBuiltin: builtin }
      }
    );
  }

  convertAssignmentTarget(node) {
    if (!node) {
      this.unsupported(node, "missing assignment target");
    }
    if (node._type === "Name") {
      return this.convertNode(node);
    }
    if (node._type === "Attribute") {
      return this.convertNode(node);
    }
    if (node._type === "Subscript") {
      if (!node.slice || node.slice._type === "Slice") {
        if (node.slice && node.slice.step) {
          this.unsupported(node.slice, "slice steps");
        }
        this.unsupported(node, "slice assignment");
      }
      const zeroBasedIndex = !this.isStringConstant(node.slice);
      return this.builder.member(
        this.convertNode(node.value),
        this.convertNode(node.slice),
        true,
        {
          ...this.getLoc(node),
          metadata: { sourceLanguage: "python", zeroBasedIndex }
        }
      );
    }
    this.unsupported(node, `assignment target ${node._type}`);
  }

  isRangeCall(node) {
    return node && node._type === "Call" && this.getName(node.func) === "range";
  }

  convertRangeArgs(args, node) {
    if (args.length < 1 || args.length > 3) {
      this.unsupported(node, "range() arity outside 1..3");
    }

    const start = args.length === 1
      ? this.builder.literal(0, Types.number())
      : this.convertNode(args[0]);
    const stop = args.length === 1
      ? this.convertNode(args[0])
      : this.convertNode(args[1]);
    const step = args.length === 3
      ? this.convertNode(args[2])
      : this.builder.literal(1, Types.number());

    return {
      start,
      stop,
      step,
      negativeStep: this.isNegativeNumber(args[2])
    };
  }

  isNegativeNumber(node) {
    return Boolean(
      node &&
      node._type === "UnaryOp" &&
      node.op &&
      node.op._type === "USub" &&
      node.operand &&
      node.operand._type === "Constant" &&
      typeof node.operand.value === "number"
    );
  }

  createTempVar(prefix) {
    const name = `${prefix}_${this.tempVarCounter++}`;
    this.declare(name);
    return name;
  }

  isStringConstant(node) {
    return Boolean(node && node._type === "Constant" && typeof node.value === "string");
  }

  getName(node) {
    if (!node) return null;
    if (node._type === "Name") return node.id;
    if (node._type === "Attribute") {
      const base = this.getName(node.value);
      return base ? `${base}.${node.attr}` : node.attr;
    }
    return null;
  }

  convertOperator(node) {
    const map = {
      Add: "+",
      Sub: "-",
      Mult: "*",
      Div: "/",
      Mod: "%"
    };
    const op = map[node && node._type];
    if (!op) {
      this.unsupported(node, `operator ${node && node._type}`);
    }
    return op;
  }

  convertBoolOperator(node) {
    if (node && node._type === "And") return "&&";
    if (node && node._type === "Or") return "||";
    this.unsupported(node, `boolean operator ${node && node._type}`);
  }

  convertUnaryOperator(node) {
    if (node && node._type === "Not") return "!";
    if (node && node._type === "USub") return "-";
    if (node && node._type === "UAdd") return "+";
    this.unsupported(node, `unary operator ${node && node._type}`);
  }

  convertCompareOperator(node) {
    const map = {
      Eq: "==",
      NotEq: "!=",
      Lt: "<",
      LtE: "<=",
      Gt: ">",
      GtE: ">="
    };
    const op = map[node && node._type];
    if (!op) {
      this.unsupported(node, `comparison operator ${node && node._type}`);
    }
    return op;
  }

  isSimpleComparable(node) {
    return Boolean(node && [
      "Name",
      "Constant",
      "Subscript",
      "Attribute"
    ].includes(node._type));
  }

  inferMembershipKind(node) {
    const kind = this.inferKind(node);
    return kind === "dict" ? "key" : "value";
  }

  inferKind(node) {
    if (!node) return null;
    if (node._type === "List" || node._type === "Tuple") return "list";
    if (node._type === "Dict") return "dict";
    if (node._type === "Constant") {
      if (typeof node.value === "string") return "string";
      if (typeof node.value === "number") return "number";
      if (typeof node.value === "boolean") return "boolean";
      return null;
    }
    if (node._type === "Name") {
      return this.getKnownKind(node.id);
    }
    return null;
  }

  pushScope(names = []) {
    this.scopes.push(new Set(names));
    this.kindScopes.push(new Map(names.map(name => [name, null])));
  }

  popScope() {
    this.scopes.pop();
    this.kindScopes.pop();
  }

  withScope(names, callback) {
    this.pushScope(names);
    try {
      return callback();
    } finally {
      this.popScope();
    }
  }

  currentScope() {
    return this.scopes[this.scopes.length - 1];
  }

  currentKindScope() {
    return this.kindScopes[this.kindScopes.length - 1];
  }

  declare(name, kind = null) {
    const scope = this.currentScope();
    if (scope) {
      scope.add(name);
    }
    const kindScope = this.currentKindScope();
    if (kindScope) {
      kindScope.set(name, kind);
    }
  }

  isDeclared(name) {
    const scope = this.currentScope();
    return Boolean(scope && scope.has(name));
  }

  setKnownKind(name, kind) {
    for (let index = this.kindScopes.length - 1; index >= 0; index--) {
      if (this.kindScopes[index].has(name)) {
        this.kindScopes[index].set(name, kind);
        return;
      }
    }
  }

  getKnownKind(name) {
    for (let index = this.kindScopes.length - 1; index >= 0; index--) {
      if (this.kindScopes[index].has(name)) {
        return this.kindScopes[index].get(name);
      }
    }
    return null;
  }

  unsupported(node, feature) {
    const loc = node && node.lineno ? ` at line ${node.lineno}` : "";
    throw new Error(`Unsupported Python input feature: ${feature}${loc}`);
  }

  getLoc(node) {
    if (node && node.lineno) {
      return {
        loc: {
          start: { line: node.lineno, column: node.col_offset || 0 },
          end: { line: node.end_lineno || node.lineno, column: node.end_col_offset || 0 }
        }
      };
    }
    return {};
  }
}

module.exports = {
  PythonToIRCompiler
};
