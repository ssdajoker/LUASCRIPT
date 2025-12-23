
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
        
        // Add node-specific info
        if (json.name) {
            output += ` "${json.name}"`;
        } else if (json.operator) {
            output += ` (${json.operator})`;
        } else if (json.value !== undefined) {
            const value = typeof json.value === "string" 
                ? `"${json.value}"` 
                : json.value;
            output += ` = ${value}`;
        }
        
        output += "\n";
        
        // Recursively visualize children
        if (json.body) {
            if (Array.isArray(json.body)) {
                json.body.forEach(child => {
                    output += this.visualize(IRNode.fromJSON(child), indent + 1);
                });
            } else {
                output += this.visualize(IRNode.fromJSON(json.body), indent + 1);
            }
        }
        
        if (json.statements) {
            json.statements.forEach(stmt => {
                output += this.visualize(IRNode.fromJSON(stmt), indent + 1);
            });
        }
        
        if (json.parameters) {
            json.parameters.forEach(param => {
                output += this.visualize(IRNode.fromJSON(param), indent + 1);
            });
        }
        
        if (json.condition) {
            output += `${spaces}  condition:\n`;
            output += this.visualize(IRNode.fromJSON(json.condition), indent + 2);
        }
        
        if (json.consequent) {
            output += `${spaces}  consequent:\n`;
            output += this.visualize(IRNode.fromJSON(json.consequent), indent + 2);
        }
        
        if (json.alternate) {
            output += `${spaces}  alternate:\n`;
            output += this.visualize(IRNode.fromJSON(json.alternate), indent + 2);
        }
        
        if (json.left) {
            output += `${spaces}  left:\n`;
            output += this.visualize(IRNode.fromJSON(json.left), indent + 2);
        }
        
        if (json.right) {
            output += `${spaces}  right:\n`;
            output += this.visualize(IRNode.fromJSON(json.right), indent + 2);
        }
        
        if (json.operand) {
            output += `${spaces}  operand:\n`;
            output += this.visualize(IRNode.fromJSON(json.operand), indent + 2);
        }
        
        if (json.callee) {
            output += `${spaces}  callee:\n`;
            output += this.visualize(IRNode.fromJSON(json.callee), indent + 2);
        }
        
        if (json.args) {
            json.args.forEach((arg, i) => {
                output += `${spaces}  arg[${i}]:\n`;
                output += this.visualize(IRNode.fromJSON(arg), indent + 2);
            });
        }
        
        if (json.elements) {
            json.elements.forEach((el, i) => {
                if (el) {
                    output += `${spaces}  [${i}]:\n`;
                    output += this.visualize(IRNode.fromJSON(el), indent + 2);
                }
            });
        }
        
        if (json.properties && Array.isArray(json.properties)) {
            json.properties.forEach(prop => {
                output += this.visualize(IRNode.fromJSON(prop), indent + 1);
            });
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
}

module.exports = {
    IRSerializer
};
