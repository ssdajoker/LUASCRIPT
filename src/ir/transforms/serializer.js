
/**
 * LUASCRIPT IR Serializer
 * 
 * Handles serialization and deserialization of IR to/from JSON.
 */

const { IRNode } = require("./nodes");

class IRSerializer {
  constructor(options = {}) {
    this.options = {
      prettyPrint: options.prettyPrint !== false,
      indent: options.indent || 2,
      includeMetadata: options.includeMetadata !== false,
      ...options
    };
  }

  /**
     * Serialize IR to JSON string
     */
  serialize(node) {
    const json = node.toJSON();
        
    if (this.options.prettyPrint) {
      return JSON.stringify(json, null, this.options.indent);
    }
        
    return JSON.stringify(json);
  }

  /**
     * Deserialize JSON string to IR
     */
  deserialize(jsonString) {
    const json = typeof jsonString === "string" 
      ? JSON.parse(jsonString) 
      : jsonString;
        
    return IRNode.fromJSON(json);
  }

  /**
     * Serialize IR to a file
     */
  serializeToFile(node, filepath) {
    const fs = require("fs");
    const json = this.serialize(node);
    fs.writeFileSync(filepath, json, "utf8");
  }

  /**
     * Deserialize IR from a file
     */
  deserializeFromFile(filepath) {
    const fs = require("fs");
    const json = fs.readFileSync(filepath, "utf8");
    return this.deserialize(json);
  }

  /**
     * Pretty print IR as formatted JSON
     */
  prettyPrint(node) {
    const json = node.toJSON();
    return JSON.stringify(json, null, 2);
  }

  /**
     * Generate a visual tree representation of IR
     */
  visualize(node, indent = 0) {
    const spaces = "  ".repeat(indent);
    const json = node.toJSON();

    let output = `${spaces}${json.kind}`;
    output += this.getNodeSummary(json);
    output += "\n";

    const appendNode = (child, label, depthOffset = 1) => {
      if (!child) return;
      const nestedSpaces = "  ".repeat(depthOffset);
      const labelPrefix = label ? `${spaces}${nestedSpaces}${label}:\n` : "";
      output += labelPrefix;
      output += this.visualize(IRNode.fromJSON(child), indent + depthOffset);
    };

    const appendList = (list, labelPrefix, depthOffset = 1) => {
      if (!Array.isArray(list)) return;
      list.forEach((item, index) => appendNode(item, `${labelPrefix}[${index}]`, depthOffset));
    };

    if (json.body) {
      if (Array.isArray(json.body)) {
        appendList(json.body, "body");
      } else {
        appendNode(json.body, "body");
      }
    }

    appendList(json.statements, "stmt");
    appendList(json.parameters, "param");

    appendNode(json.condition, "condition", 2);
    appendNode(json.consequent, "consequent", 2);
    appendNode(json.alternate, "alternate", 2);
    appendNode(json.left, "left", 2);
    appendNode(json.right, "right", 2);
    appendNode(json.operand, "operand", 2);
    appendNode(json.callee, "callee", 2);
    appendList(json.args, "arg", 2);

    if (json.elements) {
      json.elements.forEach((el, i) => {
        appendNode(el, `[${i}]`, 2);
      });
    }

    if (Array.isArray(json.properties)) {
      json.properties.forEach(prop => appendNode(prop, "property"));
    }

    return output;
  }

  /**
     * Generate DOT graph for visualization
     */
  toDotGraph(node) {
    let nodeCounter = 0;
    const edges = [];
        
    const traverse = (n) => {
      const currentId = nodeCounter++;
      const json = n.toJSON();
      // Removed unused variable label
            
      // Removed unused variable nodeDef
            
      // Collect child nodes
      const children = this.getChildNodes(json);
      children.forEach(child => {
        const childNode = IRNode.fromJSON(child.node);
        const childId = traverse(childNode);
        edges.push(`  node${currentId} -> node${childId} [label="${child.label}"];`);
      });
            
      return currentId;
    };
        
    const rootId = traverse(node);
        
    return [
      "digraph IR {",
      "  node [shape=box];",
      `  node${rootId} [label="${this.getDotLabel(node.toJSON())}"];`,
      ...edges,
      "}"
    ].join("\n");
  }

  /**
     * Helper to get DOT label for a node
     */
  getDotLabel(json) {
    let label = json.kind;
        
    if (json.name) {
      label += `\\n"${json.name}"`;
    } else if (json.operator) {
      label += `\\n${json.operator}`;
    } else if (json.value !== undefined) {
      const value = typeof json.value === "string" 
        ? `"${json.value}"` 
        : json.value;
      label += `\\n${value}`;
    }
        
    return label;
  }

  /**
     * Helper to get child nodes for DOT graph
     */
  getChildNodes(json) {
    const children = [];
        
    if (json.body) {
      if (Array.isArray(json.body)) {
        json.body.forEach((child, i) => {
          children.push({ node: child, label: `body[${i}]` });
        });
      } else {
        children.push({ node: json.body, label: "body" });
      }
    }
        
    if (json.statements) {
      json.statements.forEach((stmt, i) => {
        children.push({ node: stmt, label: `stmt[${i}]` });
      });
    }
        
    if (json.condition) {
      children.push({ node: json.condition, label: "condition" });
    }
        
    if (json.consequent) {
      children.push({ node: json.consequent, label: "consequent" });
    }
        
    if (json.alternate) {
      children.push({ node: json.alternate, label: "alternate" });
    }
        
    if (json.left) {
      children.push({ node: json.left, label: "left" });
    }
        
    if (json.right) {
      children.push({ node: json.right, label: "right" });
    }
        
    return children;
  }

  getNodeSummary(json) {
    if (json.name) {
      return ` "${json.name}"`;
    }
    if (json.operator) {
      return ` (${json.operator})`;
    }
    if (json.value !== undefined) {
      const value = typeof json.value === "string"
        ? `"${json.value}"`
        : json.value;
      return ` = ${value}`;
    }
    return "";
  }
}

module.exports = {
  IRSerializer
};
