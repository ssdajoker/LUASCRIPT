/**
 * LUASCRIPT Extension API
 * 
 * Formal specification for third-party transforms, passes, and plugins.
 * Enables extensible pipeline architecture with backward compatibility guarantees.
 * 
 * @version 1.0.0
 */

/**
 * Base Transform Interface
 * 
 * All IR transforms must implement this interface.
 * Provides standardized contract for pipeline integration.
 */
class IRTransform {
  /**
   * Create a transform instance
   * @param {object} options - Transform configuration
   * @param {string} options.name - Unique transform identifier
   * @param {string} options.version - Semantic version (e.g., "1.0.0")
   * @param {number} [options.priority=100] - Execution priority (lower = earlier)
   * @param {string[]} [options.tags=[]] - Categorization tags (e.g., ["optimization", "lowering"])
   * @param {object} [options.config={}] - Custom configuration
   */
  constructor(options = {}) {
    this.name = options.name;
    this.version = options.version;
    this.priority = options.priority || 100;
    this.tags = options.tags || [];
    this.config = options.config || {};
    this.enabled = true;
    
    // Validation
    if (!this.name) throw new Error("Transform.name is required");
    if (!this.version) throw new Error("Transform.version is required");
  }

  /**
   * Get transform metadata
   * @returns {object} Metadata object
   */
  getMetadata() {
    return {
      name: this.name,
      version: this.version,
      priority: this.priority,
      tags: this.tags,
      enabled: this.enabled,
      capabilities: this.getCapabilities?.() || {},
    };
  }

  /**
   * Describe what this transform does
   * @returns {object} Description with purpose, inputs, outputs
   */
  describe() {
    return {
      name: this.name,
      version: this.version,
      purpose: "Transform IR nodes",
      inputTypes: this.getInputTypes ? this.getInputTypes() : [],
      outputTypes: this.getOutputTypes ? this.getOutputTypes() : [],
      sideEffects: this.hasSideEffects ? this.hasSideEffects() : false,
    };
  }

  /**
   * Check if this transform can process a node
   * @param {object} node - IR node to check
   * @returns {boolean}
   */
  canProcess(node) {
    if (!node) return false;
    const inputTypes = this.getInputTypes?.() || [];
    return inputTypes.length === 0 || inputTypes.includes(node.type);
  }

  /**
   * Apply transform to IR tree
   * Must be implemented by subclasses
   * 
   * @param {object} node - IR tree node
   * @param {object} context - Execution context
   * @returns {object} Transformed node
   * @throws {TransformError} If transform fails
   */
  transform(_node, _context) {
    throw new Error(`${this.name}.transform() not implemented`);
  }

  /**
   * Validate transform output
   * Called automatically after transform
   * 
   * @param {object} original - Original node
   * @param {object} transformed - Transformed node
   * @returns {object} { valid: boolean, errors: string[] }
   */
  validate(_original, _transformed) {
    return { valid: true, errors: [] };
  }

  /**
   * Rollback transform (for debugging)
   * 
   * @param {object} node - Transformed node
   * @returns {object} Original node
   */
  rollback(_node) {
    throw new Error(`${this.name}.rollback() not implemented`);
  }
}

/**
 * Visitor Pattern for Tree Traversal
 * 
 * Base class for visitor-based transforms
 */
class IRVisitor extends IRTransform {
  constructor(options = {}) {
    super(options);
    this.visitedNodes = new Set();
  }

  /**
   * Visit a node and its children
   * @param {object} node - Node to visit
   * @param {object} context - Visitor context
   * @returns {object} Visited/transformed node
   */
  visit(node, context = {}) {
    if (!node) return null;
    if (this.visitedNodes.has(node.id)) return node; // Prevent cycles

    this.visitedNodes.add(node.id);

    // Pre-visit hook
    if (this.onEnter) {
      node = this.onEnter(node, context) || node;
    }

    // Visit children
    if (node.children) {
      node.children = node.children.map(child => this.visit(child, context));
    }

    // Post-visit hook
    if (this.onExit) {
      node = this.onExit(node, context) || node;
    }

    return node;
  }

  /**
   * Entry hook - called on node visit
   * @param {object} node
   * @param {object} context
   * @returns {object|null} Modified node or null to keep original
   */
  onEnter(_node, _context) {
    return null;
  }

  /**
   * Exit hook - called after children visited
   * @param {object} node
   * @param {object} context
   * @returns {object|null} Modified node or null to keep original
   */
  onExit(_node, _context) {
    return null;
  }

  /**
   * Implement transform by delegating to visit
   */
  transform(node, context) {
    this.visitedNodes.clear();
    return this.visit(node, context);
  }
}

/**
 * Optimization Pass Interface
 * 
 * Specific transform type for optimizations
 */
class OptimizationPass extends IRTransform {
  constructor(options = {}) {
    super({
      ...options,
      tags: [...(options.tags || []), "optimization"],
    });
    this.statistics = {
      nodesProcessed: 0,
      optimizationsApplied: 0,
      bytesReduced: 0,
    };
  }

  /**
   * Get optimization statistics
   * @returns {object} Stats object
   */
  getStatistics() {
    return { ...this.statistics };
  }

  /**
   * Reset statistics
   */
  resetStatistics() {
    this.statistics = {
      nodesProcessed: 0,
      optimizationsApplied: 0,
      bytesReduced: 0,
    };
  }
}

/**
 * Lowering Pass Interface
 * 
 * Specific transform type for lowering to simpler forms
 */
class LoweringPass extends IRTransform {
  constructor(options = {}) {
    super({
      ...options,
      tags: [...(options.tags || []), "lowering"],
    });
  }

  /**
   * Lowering transforms typically operate on specific node types
   * Subclasses should implement getInputTypes()
   */
  getInputTypes() {
    throw new Error(`${this.name}.getInputTypes() must return array of node types to lower`);
  }

  /**
   * Lowering produces simpler IR forms
   */
  getOutputTypes() {
    return ["IRNode"]; // Generic output
  }
}

/**
 * Extension Registry
 * 
 * Manages registration, loading, and execution of transforms
 */
class ExtensionRegistry {
  constructor(options = {}) {
    this.transforms = new Map(); // name -> transform instance
    this.executionPlan = null;
    this.compatibilityMode = options.compatibilityMode !== false;
    this.maxDepth = options.maxDepth || 1000;
    this.timeout = options.timeout || 30000; // ms
  }

  /**
   * Register a transform
   * @param {IRTransform} transform - Transform instance
   * @throws {Error} If name conflicts or invalid
   */
  register(transform) {
    if (!transform || !(transform instanceof IRTransform)) {
      throw new Error("Invalid transform: must extend IRTransform");
    }

    if (this.transforms.has(transform.name)) {
      throw new Error(`Transform '${transform.name}' already registered`);
    }

    this.transforms.set(transform.name, transform);
    this.executionPlan = null; // Invalidate plan
  }

  /**
   * Unregister a transform
   * @param {string} name - Transform name
   */
  unregister(name) {
    this.transforms.delete(name);
    this.executionPlan = null;
  }

  /**
   * Get registered transform
   * @param {string} name
   * @returns {IRTransform|null}
   */
  get(name) {
    return this.transforms.get(name) || null;
  }

  /**
   * Get all registered transforms
   * @returns {IRTransform[]}
   */
  getAll() {
    return Array.from(this.transforms.values());
  }

  /**
   * Plan execution order based on priorities and dependencies
   * @returns {IRTransform[]} Ordered list of transforms
   */
  planExecution() {
    if (this.executionPlan) return this.executionPlan;

    const transforms = this.getAll().filter(t => t.enabled);
    
    // Sort by priority (lower first)
    transforms.sort((a, b) => a.priority - b.priority);

    // Resolve dependencies (if any)
    const plan = this.resolveDependencies(transforms);
    this.executionPlan = plan;
    return plan;
  }

  /**
   * Resolve transform dependencies
   * @private
   */
  resolveDependencies(transforms) {
    // Basic implementation - can be extended for explicit dependencies
    return transforms;
  }

  /**
   * Execute all transforms in order
   * @param {object} node - IR tree root
   * @param {object} context - Execution context
   * @returns {object} Transformed tree
   * @throws {Error} If any transform fails
   */
  executeAll(node, context = {}) {
    const plan = this.planExecution();
    let result = node;

    for (const transform of plan) {
      try {
        result = transform.transform(result, context);
        
        // Validate output
        const validation = transform.validate(node, result);
        if (!validation.valid) {
          if (this.compatibilityMode) {
            console.warn(`Transform '${transform.name}' validation failed:`, validation.errors);
          } else {
            throw new Error(`Transform '${transform.name}' validation failed: ${validation.errors.join(", ")}`);
          }
        }
      } catch (error) {
        throw new Error(`Transform '${transform.name}' failed: ${error.message}`);
      }
    }

    return result;
  }

  /**
   * Get execution statistics
   * @returns {object} Stats for all transforms
   */
  getStatistics() {
    const stats = {};
    for (const [name, transform] of this.transforms) {
      if (transform.getStatistics) {
        stats[name] = transform.getStatistics();
      }
    }
    return stats;
  }
}

/**
 * Extension Loader
 * 
 * Loads transforms from files or npm packages
 */
class ExtensionLoader {
  constructor(options = {}) {
    this.searchPaths = options.searchPaths || [
      "./transforms",
      "./extensions",
      "./plugins",
    ];
    this.registry = options.registry || new ExtensionRegistry();
  }

  /**
   * Load transform from file
   * @param {string} filePath - Path to transform file
   * @returns {IRTransform}
   */
  loadFromFile(filePath) {
    try {
      const mod = require(filePath);
      const Transform = mod.default || mod;
      
      if (!Transform || !(Transform.prototype instanceof IRTransform)) {
        throw new Error("Module must export IRTransform subclass");
      }

      const instance = new Transform();
      return instance;
    } catch (error) {
      throw new Error(`Failed to load transform from '${filePath}': ${error.message}`);
    }
  }

  /**
   * Load transform from npm package
   * @param {string} packageName - NPM package name
   * @returns {IRTransform}
   */
  loadFromPackage(packageName) {
    try {
      const mod = require(packageName);
      const Transform = mod.default || mod;
      
      if (!Transform || !(Transform.prototype instanceof IRTransform)) {
        throw new Error("Package must export IRTransform subclass");
      }

      const instance = new Transform();
      return instance;
    } catch (error) {
      throw new Error(`Failed to load transform from package '${packageName}': ${error.message}`);
    }
  }

  /**
   * Auto-discover and load transforms from search paths
   * @returns {IRTransform[]} Loaded transforms
   */
  autoDiscover() {
    const fs = require("fs");
    const path = require("path");
    const loaded = [];

    for (const searchPath of this.searchPaths) {
      if (!fs.existsSync(searchPath)) continue;

      const files = fs.readdirSync(searchPath).filter(f => f.endsWith(".js"));
      
      for (const file of files) {
        try {
          const filePath = path.join(searchPath, file);
          const transform = this.loadFromFile(filePath);
          this.registry.register(transform);
          loaded.push(transform);
        } catch (error) {
          console.warn(`Failed to load transform from '${file}':`, error.message);
        }
      }
    }

    return loaded;
  }
}

/**
 * Compatibility Validator
 * 
 * Ensures third-party transforms are compatible with current API
 */
class CompatibilityValidator {
  /**
   * Check if transform is compatible
   * @param {IRTransform} transform
   * @returns {object} { compatible: boolean, issues: string[] }
   */
  static validate(transform) {
    const issues = [];

    // Check required methods
    const requiredMethods = ["describe", "transform"];
    for (const method of requiredMethods) {
      if (typeof transform[method] !== "function") {
        issues.push(`Missing required method: ${method}`);
      }
    }

    // Check metadata
    if (!transform.name) issues.push("Missing name");
    if (!transform.version) issues.push("Missing version");

    // Check instance type
    if (!(transform instanceof IRTransform)) {
      issues.push("Must extend IRTransform base class");
    }

    return {
      compatible: issues.length === 0,
      issues,
    };
  }

  /**
   * Get API compatibility level
   * @param {string} transformVersion - Transform version string
   * @returns {string} Compatibility level ('full', 'partial', 'deprecated')
   */
  static getCompatibilityLevel(transformVersion) {
    // Simple semver compatibility check
    const [major, minor] = transformVersion.split(".").map(Number);
    const [apiMajor, apiMinor] = this.API_VERSION.split(".").map(Number);

    if (major > apiMajor) return "deprecated";
    if (major < apiMajor) return "partial";
    if (minor > apiMinor) return "partial";
    return "full";
  }
}

/**
 * Transform Error - custom error for transform failures
 */
class TransformError extends Error {
  constructor(transformName, message, originalError = null) {
    super(`${transformName}: ${message}`);
    this.transformName = transformName;
    this.originalError = originalError;
  }
}

module.exports = {
  // Base classes
  IRTransform,
  IRVisitor,
  OptimizationPass,
  LoweringPass,

  // Registry & Management
  ExtensionRegistry,
  ExtensionLoader,
  CompatibilityValidator,

  // Errors
  TransformError,

  // API Version
  API_VERSION: "1.0.0",
};
