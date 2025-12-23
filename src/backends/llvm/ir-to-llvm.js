
/**
 * LUASCRIPT IR to LLVM IR Compiler
 * 
 * Compiles canonical IR to LLVM Intermediate Representation
 * Implements SSA (Static Single Assignment) form
 */

const { NodeCategory } = require("../../ir/nodes");
const { TypeCategory } = require("../../ir/types");

const integerArithmeticOps = {
  "+": "add",
  "-": "sub",
  "*": "mul",
  "/": "sdiv",
  "%": "srem"
};

const floatArithmeticOps = {
  "+": "fadd",
  "-": "fsub",
  "*": "fmul",
  "/": "fdiv",
  "%": "frem"
};

const integerComparisonPredicates = {
  "==": "eq",
  "!=": "ne",
  "<": "slt",
  "<=": "sle",
  ">": "sgt",
  ">=": "sge"
};

const floatComparisonPredicates = {
  "==": "oeq",
  "!=": "one",
  "<": "olt",
  "<=": "ole",
  ">": "ogt",
  ">=": "oge"
};

const bitwiseOps = {
  "&": "and",
  "|": "or",
  "^": "xor",
  "<<": "shl",
  ">>": "ashr"
};

/**
 * LLVM Type System
 */
class LLVMType {
  static i1 = "i1";
  static i8 = "i8";
  static i32 = "i32";
  static i64 = "i64";
  static float = "float";
  static double = "double";
  static void = "void";
  static ptr = "ptr"; // Opaque pointer (LLVM 15+)
    
  static function(returnType, paramTypes) {
    return `${returnType} (${paramTypes.join(", ")})`;
  }
    
  static pointer() {
    return "ptr"; // Modern LLVM uses opaque pointers
  }
    
  static array(elementType, size) {
    return `[${size} x ${elementType}]`;
  }
    
  static struct(fields, packed = false) {
    const prefix = packed ? "<{" : "{";
    const suffix = packed ? "}>" : "}";
    return prefix + fields.join(", ") + suffix;
  }
}

/**
 * LLVM IR Builder
 */
class LLVMIRBuilder {
  constructor() {
    this.instructions = [];
    this.valueCounter = 0;
    this.labelCounter = 0;
    this.currentBlock = null;
  }

  /**
     * Generate new SSA value name
     */
  newValue(prefix = "v") {
    return `%${prefix}${this.valueCounter++}`;
  }

  /**
     * Generate new label
     */
  newLabel(prefix = "bb") {
    return `${prefix}${this.labelCounter++}`;
  }

  /**
     * Add instruction
     */
  emit(instruction) {
    this.instructions.push("  " + instruction);
  }

  /**
     * Add label
     */
  emitLabel(label) {
    this.currentBlock = label;
    this.instructions.push(`${label}:`);
  }

  /**
     * Get all instructions
     */
  getInstructions() {
    return this.instructions.join("\n");
  }

  /**
     * Clear instructions
     */
  clear() {
    this.instructions = [];
    this.valueCounter = 0;
    this.labelCounter = 0;
    this.currentBlock = null;
  }
}

/**
 * IR to LLVM IR Compiler
 */
class IRToLLVMCompiler {
  constructor(options = {}) {
    this.options = {
      optimize: options.optimize !== false,
      debug: options.debug || false,
      targetTriple: options.targetTriple || "x86_64-unknown-linux-gnu",
      ...options
    };
        
    this.builder = new LLVMIRBuilder();
    this.module = [];
    this.functionDecls = [];
    this.globalVars = [];
    this.stringConstants = [];
    this.symbolTable = new Map();
    this.currentFunction = null;
    this.loopStack = []; // For break/continue
  }

  /**
     * Compile IR program to LLVM IR
     */
  compile(program) {
    if (program.kind !== NodeCategory.PROGRAM) {
      throw new Error("Expected Program node at root");
    }

    // Reset state
    this.reset();

    // Module header
    this.emitModuleHeader();

    // Declare external functions
    this.declareExternalFunctions();

    // First pass: collect declarations
    this.collectDeclarations(program);

    // Second pass: compile function bodies
    this.compileFunctions();

    // Emit string constants
    this.emitStringConstants();

    // Assemble module
    return this.assembleModule();
  }

  /**
     * Reset compiler state
     */
  reset() {
    this.builder.clear();
    this.module = [];
    this.functionDecls = [];
    this.globalVars = [];
    this.stringConstants = [];
    this.symbolTable.clear();
    this.currentFunction = null;
    this.loopStack = [];
  }

  /**
     * Emit module header
     */
  emitModuleHeader() {
    this.module.push("; ModuleID = 'luascript'");
    this.module.push(`target triple = "${this.options.targetTriple}"`);
    this.module.push("");
  }

  /**
     * Declare external functions
     */
  declareExternalFunctions() {
    // Declare common runtime functions
    this.module.push("; External function declarations");
    this.module.push("declare i32 @printf(ptr, ...)");
    this.module.push("declare ptr @malloc(i64)");
    this.module.push("declare void @free(ptr)");
    this.module.push("declare ptr @memcpy(ptr, ptr, i64)");
    this.module.push("");
  }

  /**
     * Collect all declarations
     */
  collectDeclarations(program) {
    for (const stmt of program.body) {
      if (stmt.kind === NodeCategory.FUNCTION_DECL) {
        this.registerFunction(stmt);
      } else if (stmt.kind === NodeCategory.VAR_DECL) {
        this.registerGlobal(stmt);
      }
    }
  }

  /**
     * Register a function
     */
  registerFunction(funcDecl) {
    const returnType = this.irTypeToLLVMType(funcDecl.returnType);
    const paramTypes = funcDecl.params.map(p => this.irTypeToLLVMType(p.type));
    const funcType = LLVMType.function(returnType, paramTypes);

    this.functionDecls.push({
      name: funcDecl.name,
      mangledName: `@${funcDecl.name}`,
      returnType: returnType,
      paramTypes: paramTypes,
      funcType: funcType,
      params: funcDecl.params,
      body: funcDecl.body
    });
  }

  /**
     * Register a global variable
     */
  registerGlobal(varDecl) {
    const llvmType = this.irTypeToLLVMType(varDecl.varType);
        
    this.globalVars.push({
      name: varDecl.name,
      mangledName: `@${varDecl.name}`,
      type: llvmType,
      mutable: !varDecl.isConst,
      init: varDecl.init
    });
  }

  /**
     * Convert IR type to LLVM type
     */
  irTypeToLLVMType(irType) {
    if (!irType) return LLVMType.i32;

    switch (irType.category) {
    case TypeCategory.PRIMITIVE:
      switch (irType.name) {
      case "number":
        return LLVMType.double;
      case "boolean":
        return LLVMType.i1;
      case "string":
        return LLVMType.ptr;
      case "void":
        return LLVMType.void;
      default:
        return LLVMType.i32;
      }
    case TypeCategory.ARRAY:
    case TypeCategory.OBJECT:
      return LLVMType.ptr;
    case TypeCategory.FUNCTION: {
      const returnType = this.irTypeToLLVMType(irType.returnType);
      const paramTypes = irType.paramTypes.map(t => this.irTypeToLLVMType(t));
      return LLVMType.function(returnType, paramTypes);
    }
    default:
      return LLVMType.i32;
    }
  }

  /**
   * Compile all function bodies
   */
  compileFunctions() {
    this.module.push("; Function definitions");
        
    for (const funcDecl of this.functionDecls) {
      this.compileFunction(funcDecl);
      this.module.push("");
    }
  }

  /**
     * Compile a single function
     */
  compileFunction(funcDecl) {
    this.currentFunction = funcDecl;
    this.builder.clear();
    this.symbolTable.clear();

    // Function signature
    const params = funcDecl.params.map((p, i) => 
      `${funcDecl.paramTypes[i]} %${p.name}`
    ).join(", ");

    this.module.push(`define ${funcDecl.returnType} ${funcDecl.mangledName}(${params}) {`);

    // Entry block
    this.builder.emitLabel("entry");

    // Allocate space for parameters (for SSA)
    funcDecl.params.forEach((param, idx) => {
      const allocaName = this.builder.newValue(param.name + "_addr");
      this.builder.emit(`${allocaName} = alloca ${funcDecl.paramTypes[idx]}, align 4`);
      this.builder.emit(`store ${funcDecl.paramTypes[idx]} %${param.name}, ptr ${allocaName}, align 4`);
      this.symbolTable.set(param.name, {
        type: "local",
        llvmType: funcDecl.paramTypes[idx],
        address: allocaName
      });
    });

    // Compile function body
    if (funcDecl.body) {
      this.compileBlock(funcDecl.body);
    }

    // Add implicit return if needed
    if (funcDecl.returnType === LLVMType.void) {
      this.builder.emit("ret void");
    } else {
      // Return default value
      const defaultValue = this.getDefaultValue(funcDecl.returnType);
      this.builder.emit(`ret ${funcDecl.returnType} ${defaultValue}`);
    }

    this.module.push(this.builder.getInstructions());
    this.module.push("}");

    this.currentFunction = null;
  }

  /**
     * Get default value for type
     */
  getDefaultValue(llvmType) {
    if (llvmType === LLVMType.i1) return "0";
    if (llvmType === LLVMType.i32 || llvmType === LLVMType.i64) return "0";
    if (llvmType === LLVMType.float || llvmType === LLVMType.double) return "0.0";
    if (llvmType === LLVMType.ptr) return "null";
    return "0";
  }

  /**
     * Compile block of statements
     */
  compileBlock(block) {
    const statements = block.kind === NodeCategory.BLOCK ? 
      block.body : [block];

    for (const stmt of statements) {
      this.compileStatement(stmt);
    }
  }

  /**
     * Compile statement
     */
  compileStatement(stmt) {
    switch (stmt.kind) {
    case NodeCategory.VAR_DECL:
      this.compileVarDecl(stmt);
      break;
    case NodeCategory.RETURN:
      this.compileReturn(stmt);
      break;
    case NodeCategory.IF:
      this.compileIf(stmt);
      break;
    case NodeCategory.WHILE:
      this.compileWhile(stmt);
      break;
    case NodeCategory.FOR:
      this.compileFor(stmt);
      break;
    case NodeCategory.EXPRESSION_STMT:
      this.compileExpression(stmt.expression);
      break;
    case NodeCategory.BLOCK:
      this.compileBlock(stmt);
      break;
    case NodeCategory.BREAK:
      this.compileBreak();
      break;
    case NodeCategory.CONTINUE:
      this.compileContinue();
      break;
    }
  }

  /**
     * Compile variable declaration
     */
  compileVarDecl(varDecl) {
    const llvmType = this.irTypeToLLVMType(varDecl.varType);
    const allocaName = this.builder.newValue(varDecl.name + "_addr");
        
    this.builder.emit(`${allocaName} = alloca ${llvmType}, align 4`);
        
    if (varDecl.init) {
      const initValue = this.compileExpression(varDecl.init);
      this.builder.emit(`store ${llvmType} ${initValue.value}, ptr ${allocaName}, align 4`);
    }
        
    this.symbolTable.set(varDecl.name, {
      type: "local",
      llvmType: llvmType,
      address: allocaName
    });
  }

  /**
     * Compile return statement
     */
  compileReturn(returnStmt) {
    if (returnStmt.value) {
      const result = this.compileExpression(returnStmt.value);
      this.builder.emit(`ret ${result.type} ${result.value}`);
    } else {
      this.builder.emit("ret void");
    }
  }

  /**
     * Compile if statement
     */
  compileIf(ifStmt) {
    const condResult = this.compileExpression(ifStmt.test);
        
    // Convert to i1 if needed
    let condValue = condResult.value;
    if (condResult.type !== LLVMType.i1) {
      const cmpResult = this.builder.newValue("cmp");
      this.builder.emit(`${cmpResult} = icmp ne ${condResult.type} ${condValue}, 0`);
      condValue = cmpResult;
    }

    const thenLabel = this.builder.newLabel("if_then");
    const elseLabel = this.builder.newLabel("if_else");
    const endLabel = this.builder.newLabel("if_end");

    // Branch
    if (ifStmt.alternate) {
      this.builder.emit(`br i1 ${condValue}, label %${thenLabel}, label %${elseLabel}`);
    } else {
      this.builder.emit(`br i1 ${condValue}, label %${thenLabel}, label %${endLabel}`);
    }

    // Then block
    this.builder.emitLabel(thenLabel);
    this.compileBlock(ifStmt.consequent);
    this.builder.emit(`br label %${endLabel}`);

    // Else block
    if (ifStmt.alternate) {
      this.builder.emitLabel(elseLabel);
      this.compileBlock(ifStmt.alternate);
      this.builder.emit(`br label %${endLabel}`);
    }

    // End block
    this.builder.emitLabel(endLabel);
  }

  /**
     * Compile while loop
     */
  compileWhile(whileStmt) {
    const condLabel = this.builder.newLabel("while_cond");
    const bodyLabel = this.builder.newLabel("while_body");
    const endLabel = this.builder.newLabel("while_end");

    // Push loop context for break/continue
    this.loopStack.push({ condLabel, endLabel });

    // Jump to condition
    this.builder.emit(`br label %${condLabel}`);

    // Condition block
    this.builder.emitLabel(condLabel);
    const condResult = this.compileExpression(whileStmt.test);
        
    let condValue = condResult.value;
    if (condResult.type !== LLVMType.i1) {
      const cmpResult = this.builder.newValue("cmp");
      this.builder.emit(`${cmpResult} = icmp ne ${condResult.type} ${condValue}, 0`);
      condValue = cmpResult;
    }
        
    this.builder.emit(`br i1 ${condValue}, label %${bodyLabel}, label %${endLabel}`);

    // Body block
    this.builder.emitLabel(bodyLabel);
    this.compileBlock(whileStmt.body);
    this.builder.emit(`br label %${condLabel}`);

    // End block
    this.builder.emitLabel(endLabel);

    this.loopStack.pop();
  }

  /**
     * Compile for loop
     */
  compileFor(forStmt) {
    // Initialize
    if (forStmt.init) {
      this.compileStatement(forStmt.init);
    }

    const condLabel = this.builder.newLabel("for_cond");
    const bodyLabel = this.builder.newLabel("for_body");
    const updateLabel = this.builder.newLabel("for_update");
    const endLabel = this.builder.newLabel("for_end");

    // Push loop context
    this.loopStack.push({ condLabel: updateLabel, endLabel });

    // Jump to condition
    this.builder.emit(`br label %${condLabel}`);

    // Condition block
    this.builder.emitLabel(condLabel);
    if (forStmt.test) {
      const condResult = this.compileExpression(forStmt.test);
            
      let condValue = condResult.value;
      if (condResult.type !== LLVMType.i1) {
        const cmpResult = this.builder.newValue("cmp");
        this.builder.emit(`${cmpResult} = icmp ne ${condResult.type} ${condValue}, 0`);
        condValue = cmpResult;
      }
            
      this.builder.emit(`br i1 ${condValue}, label %${bodyLabel}, label %${endLabel}`);
    } else {
      this.builder.emit(`br label %${bodyLabel}`);
    }

    // Body block
    this.builder.emitLabel(bodyLabel);
    this.compileBlock(forStmt.body);
    this.builder.emit(`br label %${updateLabel}`);

    // Update block
    this.builder.emitLabel(updateLabel);
    if (forStmt.update) {
      this.compileExpression(forStmt.update);
    }
    this.builder.emit(`br label %${condLabel}`);

    // End block
    this.builder.emitLabel(endLabel);

    this.loopStack.pop();
  }

  /**
     * Compile break statement
     */
  compileBreak() {
    if (this.loopStack.length > 0) {
      const loop = this.loopStack[this.loopStack.length - 1];
      this.builder.emit(`br label %${loop.endLabel}`);
    }
  }

  /**
     * Compile continue statement
     */
  compileContinue() {
    if (this.loopStack.length > 0) {
      const loop = this.loopStack[this.loopStack.length - 1];
      this.builder.emit(`br label %${loop.condLabel}`);
    }
  }

  /**
     * Compile expression and return { type, value }
     */
  compileExpression(expr) {
    switch (expr.kind) {
    case NodeCategory.LITERAL:
      return this.compileLiteral(expr);
    case NodeCategory.IDENTIFIER:
      return this.compileIdentifier(expr);
    case NodeCategory.BINARY_OP:
      return this.compileBinaryOp(expr);
    case NodeCategory.UNARY_OP:
      return this.compileUnaryOp(expr);
    case NodeCategory.ASSIGNMENT:
      return this.compileAssignment(expr);
    case NodeCategory.CALL:
      return this.compileCall(expr);
    case NodeCategory.CONDITIONAL:
      return this.compileConditional(expr);
    default:
      return { type: LLVMType.i32, value: "0" };
    }
  }

  /**
     * Compile literal
     */
  compileLiteral(literal) {
    const value = literal.value;
        
    if (typeof value === "number") {
      if (Number.isInteger(value)) {
        return { type: LLVMType.i32, value: String(value) };
      } else {
        return { type: LLVMType.double, value: String(value) };
      }
    } else if (typeof value === "boolean") {
      return { type: LLVMType.i1, value: value ? "1" : "0" };
    } else if (typeof value === "string") {
      const strIndex = this.addStringConstant(value);
      const strGlobal = `@.str.${strIndex}`;
      const ptrResult = this.builder.newValue("str");
      this.builder.emit(`${ptrResult} = getelementptr inbounds [${value.length + 1} x i8], ptr ${strGlobal}, i32 0, i32 0`);
      return { type: LLVMType.ptr, value: ptrResult };
    } else {
      // null, undefined
      return { type: LLVMType.ptr, value: "null" };
    }
  }

  /**
     * Add string constant
     */
  addStringConstant(str) {
    const index = this.stringConstants.length;
    this.stringConstants.push(str);
    return index;
  }

  /**
     * Compile identifier
     */
  compileIdentifier(identifier) {
    const name = identifier.name;
        
    if (this.symbolTable.has(name)) {
      const symbol = this.symbolTable.get(name);
      const loadResult = this.builder.newValue(name);
      this.builder.emit(`${loadResult} = load ${symbol.llvmType}, ptr ${symbol.address}, align 4`);
      return { type: symbol.llvmType, value: loadResult };
    } else {
      return { type: LLVMType.i32, value: "0" };
    }
  }

  /**
   * Compile binary operation
   */
  compileBinaryOp(binOp) {
    const left = this.compileExpression(binOp.left);
    const right = this.compileExpression(binOp.right);

    const arithmetic = this.compileArithmeticBinary(binOp.operator, left, right);
    if (arithmetic) {
      return arithmetic;
    }

    const comparison = this.compileComparisonBinary(binOp.operator, left, right);
    if (comparison) {
      return comparison;
    }

    const logical = this.compileLogicalBinary(binOp.operator, left, right);
    if (logical) {
      return logical;
    }

    const bitwise = this.compileBitwiseBinary(binOp.operator, left, right);
    if (bitwise) {
      return bitwise;
    }

    return { type: LLVMType.i32, value: "0" };
  }

  compileArithmeticBinary(operator, left, right) {
    const opMap = left.type === LLVMType.double ? floatArithmeticOps : integerArithmeticOps;
    const mappedOp = opMap[operator];

    if (!mappedOp) {
      return null;
    }

    const resultValue = this.builder.newValue("binop");
    this.builder.emit(`${resultValue} = ${mappedOp} ${left.type} ${left.value}, ${right.value}`);
    return { type: left.type, value: resultValue };
  }

  compileComparisonBinary(operator, left, right) {
    const predicateMap = left.type === LLVMType.double ? floatComparisonPredicates : integerComparisonPredicates;
    const predicate = predicateMap[operator];

    if (!predicate) {
      return null;
    }

    const resultValue = this.builder.newValue("binop");
    const comparisonOp = left.type === LLVMType.double ? "fcmp" : "icmp";
    this.builder.emit(`${resultValue} = ${comparisonOp} ${predicate} ${left.type} ${left.value}, ${right.value}`);
    return { type: LLVMType.i1, value: resultValue };
  }

  compileLogicalBinary(operator, left, right) {
    if (operator !== "&&" && operator !== "||") {
      return null;
    }

    const opName = operator === "&&" ? "and" : "or";
    const resultValue = this.builder.newValue("binop");
    this.builder.emit(`${resultValue} = ${opName} i1 ${left.value}, ${right.value}`);
    return { type: LLVMType.i1, value: resultValue };
  }

  compileBitwiseBinary(operator, left, right) {
    const mappedOp = bitwiseOps[operator];

    if (!mappedOp) {
      return null;
    }

    const resultValue = this.builder.newValue("binop");
    this.builder.emit(`${resultValue} = ${mappedOp} ${left.type} ${left.value}, ${right.value}`);
    return { type: left.type, value: resultValue };
  }

  /**
     * Compile unary operation
     */
  compileUnaryOp(unaryOp) {
    const operand = this.compileExpression(unaryOp.operand);
    const resultValue = this.builder.newValue("unop");

    switch (unaryOp.operator) {
    case "-":
      if (operand.type === LLVMType.i32) {
        this.builder.emit(`${resultValue} = sub i32 0, ${operand.value}`);
      } else if (operand.type === LLVMType.double) {
        this.builder.emit(`${resultValue} = fneg double ${operand.value}`);
      }
      return { type: operand.type, value: resultValue };
    case "!":
      this.builder.emit(`${resultValue} = xor i1 ${operand.value}, 1`);
      return { type: LLVMType.i1, value: resultValue };
    case "~":
      this.builder.emit(`${resultValue} = xor i32 ${operand.value}, -1`);
      return { type: LLVMType.i32, value: resultValue };
    default:
      return operand;
    }
  }

  /**
     * Compile assignment
     */
  compileAssignment(assignment) {
    const value = this.compileExpression(assignment.value);

    if (assignment.target.kind === NodeCategory.IDENTIFIER) {
      const name = assignment.target.name;
            
      if (this.symbolTable.has(name)) {
        const symbol = this.symbolTable.get(name);
        this.builder.emit(`store ${symbol.llvmType} ${value.value}, ptr ${symbol.address}, align 4`);
      }
    }

    return value;
  }

  /**
     * Compile function call
     */
  compileCall(call) {
    // Compile arguments
    const args = call.args.map(arg => this.compileExpression(arg));

    // Get callee
    let calleeName = "";
    if (call.callee.kind === NodeCategory.IDENTIFIER) {
      calleeName = "@" + call.callee.name;
    }

    // Find function declaration
    const funcDecl = this.functionDecls.find(f => f.mangledName === calleeName);
        
    if (funcDecl) {
      const argStr = args.map((arg, i) => 
        `${funcDecl.paramTypes[i]} ${arg.value}`
      ).join(", ");

      if (funcDecl.returnType === LLVMType.void) {
        this.builder.emit(`call ${funcDecl.returnType} ${calleeName}(${argStr})`);
        return { type: LLVMType.void, value: "void" };
      } else {
        const resultValue = this.builder.newValue("call");
        this.builder.emit(`${resultValue} = call ${funcDecl.returnType} ${calleeName}(${argStr})`);
        return { type: funcDecl.returnType, value: resultValue };
      }
    }

    return { type: LLVMType.i32, value: "0" };
  }

  /**
     * Compile conditional expression
     */
  compileConditional(conditional) {
    const condResult = this.compileExpression(conditional.test);
        
    let condValue = condResult.value;
    if (condResult.type !== LLVMType.i1) {
      const cmpResult = this.builder.newValue("cmp");
      this.builder.emit(`${cmpResult} = icmp ne ${condResult.type} ${condValue}, 0`);
      condValue = cmpResult;
    }

    const thenLabel = this.builder.newLabel("cond_then");
    const elseLabel = this.builder.newLabel("cond_else");
    const endLabel = this.builder.newLabel("cond_end");

    // Result allocation
    const resultAddr = this.builder.newValue("cond_result");
    this.builder.emit(`${resultAddr} = alloca i32, align 4`);

    // Branch
    this.builder.emit(`br i1 ${condValue}, label %${thenLabel}, label %${elseLabel}`);

    // Then block
    this.builder.emitLabel(thenLabel);
    const thenValue = this.compileExpression(conditional.consequent);
    this.builder.emit(`store i32 ${thenValue.value}, ptr ${resultAddr}, align 4`);
    this.builder.emit(`br label %${endLabel}`);

    // Else block
    this.builder.emitLabel(elseLabel);
    const elseValue = this.compileExpression(conditional.alternate);
    this.builder.emit(`store i32 ${elseValue.value}, ptr ${resultAddr}, align 4`);
    this.builder.emit(`br label %${endLabel}`);

    // End block
    this.builder.emitLabel(endLabel);
    const resultValue = this.builder.newValue("cond_val");
    this.builder.emit(`${resultValue} = load i32, ptr ${resultAddr}, align 4`);

    return { type: LLVMType.i32, value: resultValue };
  }

  /**
     * Emit string constants
     */
  emitStringConstants() {
    if (this.stringConstants.length === 0) return;

    this.module.push("; String constants");
    this.stringConstants.forEach((str, idx) => {
      const escaped = str.replace(/\\/g, "\\\\").replace(/"/g, "\\\"");
      this.module.push(`@.str.${idx} = private unnamed_addr constant [${str.length + 1} x i8] c"${escaped}\\00", align 1`);
    });
    this.module.push("");
  }

  /**
     * Assemble complete LLVM IR module
     */
  assembleModule() {
    return this.module.join("\n");
  }
}

module.exports = { IRToLLVMCompiler, LLVMType, LLVMIRBuilder };
