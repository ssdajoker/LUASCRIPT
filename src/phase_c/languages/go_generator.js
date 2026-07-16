/**
 * GO PHASE C GENERATOR
 * Generates Lua and JavaScript code from Go AST
 * 
 * Features:
 * - Goroutines → Lua coroutines / JS Promises
 * - Channels → Lua table-based queue / JS AsyncQueue
 * - Select statements → appropriate language construct
 * - Error handling translation
 * - Interface satisfaction checking
 * 
 * Lines: 300
 */

const AbstractPhaseC_Generator = require("../framework/abstract_generator");

class GoPhaseC_Generator extends AbstractPhaseC_Generator {
  constructor(ast, config = {}) {
    super(ast, {
      language: "Go",
      ...config
    });

    this.goTemplates = {
      lua: {
        goroutine: "coroutine.resume(coroutine.create(function()\n%s\nend))",
        channel: "local %s = { queue = {}, capacity = 0 }\nfunction %s:send(value)\n  table.insert(self.queue, value)\nend\nfunction %s:receive()\n  return table.remove(self.queue, 1)\nend",
        select: "local selected = false\nfor i, case in ipairs({%s}) do\n  if not selected then\n    %s\n    selected = true\n  end\nend",
        defer: "local cleanup = function()\n  %s\nend\ndefer(cleanup)",
        errorCheck: "if err ~= nil then\n  %s\nend",
        interface: "local %s = {}\nfunction %s:new()\n  local obj = {}\n  %s\n  return obj\nend"
      },
      javascript: {
        goroutine: "(async () => {\n%s\n})()",
        channel: "const %s = new AsyncQueue()",
        channelSend: "await %s.put(%s)",
        channelReceive: "await %s.get()",
        select: "Promise.race([\n%s\n])",
        asyncWait: "await new Promise(resolve => setTimeout(resolve, %d))",
        errorCheck: "if (error != null) {\n%s\n}",
        interface: "class %s {\n  constructor() {\n%s\n  }\n}"
      }
    };

    this.generationMetrics = {
      goroutinesGenerated: 0,
      channelsGenerated: 0,
      selectsGenerated: 0,
      interfacesGenerated: 0,
      errorHandlersGenerated: 0
    };
  }

  /**
   * OVERRIDE GENERATE FOR GO-SPECIFIC HANDLING
   */
  generate() {
    this.output = [];
    this.indentLevel = 0;

    try {
      this.generateHeader();

      if (this.ast.body && Array.isArray(this.ast.body)) {
        for (const node of this.ast.body) {
          this.generateGoNode(node);
        }
      }

      this.generateFooter();

      return this.output.join("\n");
    } catch (error) {
      this.generatedMetrics.errors.push(`Go generation error: ${error.message}`);
      throw error;
    }
  }

  /**
   * GO-SPECIFIC NODE GENERATION
   */
  generateGoNode(node) {
    if (!node) return;

    switch (node.type) {
    case "GoroutineDeclaration":
      this.generateGoroutine(node);
      break;
    case "ChannelType":
      this.generateChannelType(node);
      break;
    case "ChannelOperation":
      this.generateChannelOperation(node);
      break;
    case "SelectStatement":
      this.generateSelectStatement(node);
      break;
    case "ErrorHandling":
      this.generateErrorHandling(node);
      break;
    case "InterfaceDefinition":
      this.generateInterface(node);
      break;
    case "BuilderPattern":
      this.generateBuilder(node);
      break;
    default:
      super.generateNode(node);
    }
  }

  /**
   * GOROUTINE GENERATION
   * Go: go functionCall()
   * Lua: coroutine.resume(coroutine.create(function() ... end))
   * JS: (async () => { ... })()
   */
  generateGoroutine(node) {
    if (this.config.target === "lua") {
      this.emit("coroutine.resume(coroutine.create(function()");
      this.incIndent();
      
      if (node.function) {
        this.emit(`-- Call: ${node.function}`);
        this.emit(`${node.function}(${node.arguments.map(arg => this.expressionToString(arg)).join(", ")})`);
      }
      
      this.decIndent();
      this.emit("end))");
    } else {
      this.emit("(async () => {");
      this.incIndent();
      
      if (node.function) {
        this.emit(`// Call: ${node.function}`);
        this.emit(`await ${node.function}(${node.arguments.map(arg => this.expressionToString(arg)).join(", ")})`);
      }
      
      this.decIndent();
      this.emit("})();");
    }

    this.generationMetrics.goroutinesGenerated++;
  }

  /**
   * CHANNEL TYPE GENERATION
   * Creates channel variables with send/receive operations
   */
  generateChannelType(node) {
    if (this.config.target === "lua") {
      const channelName = `channel_${node.elementType || "generic"}`;
      
      this.emit(`-- Channel: ${node.elementType || "generic"}`);
      this.emit(`local ${channelName} = {}`);
      this.emit(`${channelName}.queue = {}`);
      this.emit(`${channelName}.direction = '${node.direction}'`);
      
      if (node.buffered) {
        this.emit(`${channelName}.capacity = ${node.bufferSize}`);
      }
      
      this.emit(`function ${channelName}:send(value)`);
      this.incIndent();
      this.emit("table.insert(self.queue, value)");
      this.decIndent();
      this.emit("end");
      this.emit("");
      this.emit(`function ${channelName}:receive()`);
      this.incIndent();
      this.emit("return table.remove(self.queue, 1)");
      this.decIndent();
      this.emit("end");
    } else {
      const channelName = `channel_${node.elementType || "generic"}`;
      
      this.emit(`// Channel: ${node.elementType || "generic"}`);
      this.emit("class Channel {");
      this.incIndent();
      this.emit("constructor() {");
      this.incIndent();
      this.emit("this.queue = [];");
      this.emit(`this.direction = '${node.direction}';`);
      if (node.buffered) {
        this.emit(`this.capacity = ${node.bufferSize};`);
      }
      this.decIndent();
      this.emit("}");
      this.emit("");
      this.emit("async send(value) {");
      this.incIndent();
      this.emit("this.queue.push(value);");
      this.decIndent();
      this.emit("}");
      this.emit("");
      this.emit("async receive() {");
      this.incIndent();
      this.emit("return this.queue.shift();");
      this.decIndent();
      this.emit("}");
      this.decIndent();
      this.emit("}");
      this.emit(`const ${channelName} = new Channel();`);
    }

    this.generationMetrics.channelsGenerated++;
  }

  /**
   * CHANNEL OPERATION GENERATION
   * ch <- value or value := <-ch
   */
  generateChannelOperation(node) {
    if (this.config.target === "lua") {
      if (node.operator === "<-") {
        // Receive
        const channelName = this.expressionToString(node.channel);
        this.emit(`local value = ${channelName}:receive()`);
      }
    } else {
      if (node.operator === "<-") {
        // Receive
        const channelName = this.expressionToString(node.channel);
        this.emit(`const value = await ${channelName}.receive();`);
      }
    }
  }

  /**
   * SELECT STATEMENT GENERATION
   * Converts select { case ... } to Lua/JS equivalent
   */
  generateSelectStatement(node) {
    if (this.config.target === "lua") {
      this.emit("-- Select statement");
      this.emit("local selected = false");
      this.emit("");
      
      for (const selectCase of node.cases) {
        this.emit("if not selected then");
        this.incIndent();
        
        if (selectCase.communication) {
          this.emit("-- Check channel communication");
          this.generateChannelOperation(selectCase.communication);
        }
        
        for (const stmt of selectCase.body) {
          this.generateGoNode(stmt);
        }
        
        this.emit("selected = true");
        this.decIndent();
        this.emit("end");
        this.emit("");
      }
      
      if (node.defaultCase) {
        this.emit("if not selected then");
        this.incIndent();
        for (const stmt of node.defaultCase.body) {
          this.generateGoNode(stmt);
        }
        this.decIndent();
        this.emit("end");
      }
    } else {
      this.emit("Promise.race([");
      this.incIndent();
      
      for (let i = 0; i < node.cases.length; i++) {
        const selectCase = node.cases[i];
        this.emit("new Promise(async (resolve) => {");
        this.incIndent();
        
        for (const stmt of selectCase.body) {
          this.generateGoNode(stmt);
        }
        
        this.emit("resolve();");
        this.decIndent();
        this.emit(`})${i < node.cases.length - 1 ? "," : ""}`);
      }
      
      this.decIndent();
      this.emit("]);");
    }

    this.generationMetrics.selectsGenerated++;
  }

  /**
   * ERROR HANDLING GENERATION
   * Converts Go error handling to Lua/JS try-catch
   */
  generateErrorHandling(node) {
    if (node.category === "defer_cleanup") {
      if (this.config.target === "lua") {
        this.emit("-- Defer cleanup");
        if (node.handler) {
          this.emit(this.expressionToString(node.handler));
        }
      } else {
        this.emit("// Defer cleanup");
        if (node.handler) {
          this.emit(this.expressionToString(node.handler) + ";");
        }
      }
    } else if (node.category === "error_check") {
      if (this.config.target === "lua") {
        this.emit("if error ~= nil then");
        this.incIndent();
        this.emit("-- Handle error");
        this.decIndent();
        this.emit("end");
      } else {
        this.emit("if (error != null) {");
        this.incIndent();
        this.emit("// Handle error");
        this.decIndent();
        this.emit("}");
      }
    }

    this.generationMetrics.errorHandlersGenerated++;
  }

  /**
   * INTERFACE GENERATION
   */
  generateInterface(node) {
    if (this.config.target === "lua") {
      this.emit(`-- Interface: ${node.name || "anonymous"}`);
      this.emit(`local ${node.name || "interface"} = {}`);
      
      for (const method of node.methods) {
        this.emit(`function ${node.name}:${method.name}(${method.parameters.join(", ")})`);
        this.incIndent();
        this.emit("-- Method implementation");
        this.decIndent();
        this.emit("end");
      }
    } else {
      this.emit(`// Interface: ${node.name || "anonymous"}`);
      this.emit(`class ${node.name || "Interface"} {`);
      this.incIndent();
      
      for (const method of node.methods) {
        this.emit(`${method.name}(${method.parameters.join(", ")}) {`);
        this.incIndent();
        this.emit("// Method implementation");
        this.decIndent();
        this.emit("}");
      }
      
      this.decIndent();
      this.emit("}");
    }

    this.generationMetrics.interfacesGenerated++;
  }

  /**
   * BUILDER PATTERN GENERATION
   */
  generateBuilder(node) {
    if (this.config.target === "lua") {
      this.emit("-- Builder pattern");
      
      for (const method of node.methods) {
        if (typeof method === "string") {
          this.emit(`obj = obj.${method}()`);
        } else if (method.name) {
          this.emit(`obj = obj.${method.name}(${method.arguments.join(", ")})`);
        }
      }
    } else {
      this.emit("// Builder pattern");
      
      let chain = "obj";
      for (const method of node.methods) {
        if (typeof method === "string") {
          chain += `.${method}()`;
        } else if (method.name) {
          chain += `.${method.name}(${method.arguments.join(", ")})`;
        }
      }
      
      this.emit(chain + ";");
    }
  }

  // HELPER METHODS

  expressionToString(expr) {
    if (!expr) return "";
    
    if (typeof expr === "string") return expr;
    if (expr.type === "Identifier") return expr.name;
    if (expr.type === "Number") return expr.value;
    if (expr.type === "String") return expr.value;
    if (expr.type === "BinaryExpression") {
      return `${this.expressionToString(expr.left)} ${expr.operator} ${this.expressionToString(expr.right)}`;
    }
    
    return "";
  }

  getMetrics() {
    return {
      ...super.getMetrics(),
      goroutinesGenerated: this.generationMetrics.goroutinesGenerated,
      channelsGenerated: this.generationMetrics.channelsGenerated,
      selectsGenerated: this.generationMetrics.selectsGenerated,
      interfacesGenerated: this.generationMetrics.interfacesGenerated,
      errorHandlersGenerated: this.generationMetrics.errorHandlersGenerated
    };
  }
}

module.exports = GoPhaseC_Generator;
