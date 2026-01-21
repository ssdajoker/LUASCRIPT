
/**
 * LUASCRIPT Phase 2 Core - Module System Implementation
 * PS2/PS3 Specialists + Steve Jobs + Donald Knuth Excellence
 * 32+ Developer Team Implementation - CRUNCH MODE!
 */

const fs = require("fs");
const path = require("path");
const { LuaScriptParser } = require("./phase1_core_parser");
const { LuaScriptInterpreter, Environment, LuaScriptObject } = require("./phase2_core_interpreter");

/**
 * A cache for storing loaded modules to avoid redundant loading and handle circular dependencies.
 */
class ModuleCache {
  constructor() {
    this.cache = new Map();
    this.loading = new Set();
  }

  /**
     * Checks if a module is present in the cache.
     * @param {string} modulePath - The absolute path of the module.
     * @returns {boolean} True if the module is cached.
     */
  has(modulePath) {
    return this.cache.has(modulePath);
  }

  /**
     * Gets a module from the cache.
     * @param {string} modulePath - The absolute path of the module.
     * @returns {*} The cached module exports.
     */
  get(modulePath) {
    return this.cache.get(modulePath);
  }

  /**
     * Sets a module's exports in the cache.
     * @param {string} modulePath - The absolute path of the module.
     * @param {*} moduleExports - The exports of the module.
     */
  set(modulePath, moduleExports) {
    this.cache.set(modulePath, moduleExports);
  }

  /**
     * Checks if a module is currently being loaded.
     * @param {string} modulePath - The absolute path of the module.
     * @returns {boolean} True if the module is being loaded.
     */
  isLoading(modulePath) {
    return this.loading.has(modulePath);
  }

  /**
     * Marks a module as currently being loaded.
     * @param {string} modulePath - The absolute path of the module.
     */
  startLoading(modulePath) {
    this.loading.add(modulePath);
  }

  /**
     * Marks a module as finished loading.
     * @param {string} modulePath - The absolute path of the module.
     */
  finishLoading(modulePath) {
    this.loading.delete(modulePath);
  }

  /**
     * Clears the entire module cache.
     */
  clear() {
    this.cache.clear();
    this.loading.clear();
  }

  /**
     * Deletes a module from the cache.
     * @param {string} modulePath - The absolute path of the module.
     */
  delete(modulePath) {
    this.cache.delete(modulePath);
    this.loading.delete(modulePath);
  }

  /**
     * Gets an array of all cached module paths.
     * @returns {string[]} The array of module paths.
     */
  keys() {
    return Array.from(this.cache.keys());
  }

  /**
     * Gets the number of modules in the cache.
     * @returns {number} The size of the cache.
     */
  size() {
    return this.cache.size;
  }
}

/**
 * Resolves module specifiers to absolute file paths.
 */
class ModuleResolver {
  /**
     * Creates an instance of ModuleResolver.
     * @param {object} [options={}] - Configuration options for the resolver.
     * @param {string} [options.basePath=process.cwd()] - The base path for resolving modules.
     * @param {string[]} [options.extensions=['.js', '.luascript', '.ls']] - The file extensions to try.
     * @param {string[]} [options.moduleDirectories=['node_modules', 'luascript_modules']] - The directories to search for modules.
     * @param {object} [options.aliases={}] - A map of module aliases.
     */
  constructor(options = {}) {
    this.basePath = options.basePath || process.cwd();
    this.extensions = options.extensions || [".js", ".luascript", ".ls"];
    this.moduleDirectories = options.moduleDirectories || ["node_modules", "luascript_modules"];
    this.aliases = new Map(Object.entries(options.aliases || {}));
  }

  /**
     * Resolves a module specifier to an absolute file path.
     * @param {string} specifier - The module specifier to resolve.
     * @param {string} [fromPath=this.basePath] - The path of the file importing the module.
     * @returns {string} The resolved absolute path.
     * @throws {Error} If the module cannot be resolved.
     */
  resolve(specifier, fromPath = this.basePath) {
    // Handle aliases
    if (this.aliases.has(specifier)) {
      specifier = this.aliases.get(specifier);
    }

    // Absolute path
    if (path.isAbsolute(specifier)) {
      return this.resolveFile(specifier);
    }

    // Relative path
    if (specifier.startsWith("./") || specifier.startsWith("../")) {
      const resolvedPath = path.resolve(path.dirname(fromPath), specifier);
      return this.resolveFile(resolvedPath);
    }

    // Module name - search in module directories
    return this.resolveModule(specifier, fromPath);
  }

  /**
     * Resolves a file path, trying different extensions and directory index files.
     * @param {string} filePath - The file path to resolve.
     * @returns {string} The resolved absolute file path.
     * @private
     */
  resolveFile(filePath) {
    // Try exact path first
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      return filePath;
    }

    // Try with extensions
    for (const ext of this.extensions) {
      const withExt = filePath + ext;
      if (fs.existsSync(withExt) && fs.statSync(withExt).isFile()) {
        return withExt;
      }
    }

    // Try as directory with index file
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      for (const ext of this.extensions) {
        const indexFile = path.join(filePath, "index" + ext);
        if (fs.existsSync(indexFile) && fs.statSync(indexFile).isFile()) {
          return indexFile;
        // Try as directory with index file
        if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
            for (const ext of this.extensions) {
                const indexFile = path.join(filePath, "index" + ext);
                if (fs.existsSync(indexFile) && fs.statSync(indexFile).isFile()) {
                    return indexFile;
                }
            }

            // Try package.json main field
            const packageJsonPath = path.join(filePath, "package.json");
            if (fs.existsSync(packageJsonPath)) {
                try {
                    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
                    if (packageJson.main) {
                        const mainPath = path.resolve(filePath, packageJson.main);
                        return this.resolveFile(mainPath);
                    }
                } catch {
                    // Ignore package.json parsing errors
                }
            }
        }
      }

      // Try package.json main field
      const packageJsonPath = path.join(filePath, "package.json");
      if (fs.existsSync(packageJsonPath)) {
        try {
          const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
          if (packageJson.main) {
            const mainPath = path.resolve(filePath, packageJson.main);
            return this.resolveFile(mainPath);
          }
        } catch {
          // Ignore package.json parsing errors
        }
      }
    }

    throw new Error(`Cannot resolve module: ${filePath}`);
  }

  /**
     * Resolves a module name by searching in `node_modules` directories.
     * @param {string} moduleName - The name of the module to resolve.
     * @param {string} fromPath - The path of the file importing the module.
     * @returns {string} The resolved absolute file path.
     * @private
     */
  resolveModule(moduleName, fromPath) {
    let currentPath = path.dirname(fromPath);

    while (currentPath !== path.dirname(currentPath)) {
      for (const moduleDir of this.moduleDirectories) {
        const modulePath = path.join(currentPath, moduleDir, moduleName);
        try {
          return this.resolveFile(modulePath);
        } catch {
          // Continue searching
    resolveModule(moduleName, fromPath) {
        let currentPath = path.dirname(fromPath);

        while (currentPath !== path.dirname(currentPath)) {
            for (const moduleDir of this.moduleDirectories) {
                const modulePath = path.join(currentPath, moduleDir, moduleName);
                try {
                    return this.resolveFile(modulePath);
                } catch {
                    // Continue searching
                }
            }
            currentPath = path.dirname(currentPath);
        }

        // Try global module directories
        const globalPaths = this.getGlobalPaths();
        for (const globalPath of globalPaths) {
            const modulePath = path.join(globalPath, moduleName);
            try {
                return this.resolveFile(modulePath);
            } catch {
                // Continue searching
            }
        }
      }
      currentPath = path.dirname(currentPath);
    }

    // Try global module directories
    const globalPaths = this.getGlobalPaths();
    for (const globalPath of globalPaths) {
      const modulePath = path.join(globalPath, moduleName);
      try {
        return this.resolveFile(modulePath);
      } catch {
        // Continue searching
      }
    }

    throw new Error(`Cannot resolve module: ${moduleName}`);
  }

  /**
     * Gets the global search paths for modules.
     * @returns {string[]} An array of global paths.
     * @private
     */
  getGlobalPaths() {
    const paths = [];
        
    // NODE_PATH environment variable
    if (process.env.NODE_PATH) {
      paths.push(...process.env.NODE_PATH.split(path.delimiter));
    }

    // Global node_modules
    if (process.env.NODE_PATH) {
      paths.push(path.join(process.env.NODE_PATH, "node_modules"));
    }

    return paths;
  }

  /**
     * Adds a new module alias.
     * @param {string} alias - The alias name.
     * @param {string} target - The target path for the alias.
     */
  addAlias(alias, target) {
    this.aliases.set(alias, target);
  }

  /**
     * Removes a module alias.
     * @param {string} alias - The alias to remove.
     */
  removeAlias(alias) {
    this.aliases.delete(alias);
  }

  /**
     * Gets the current module aliases.
     * @returns {object} An object containing the aliases.
     */
  getAliases() {
    return Object.fromEntries(this.aliases);
  }
}

/**
 * Loads and executes modules, supporting both CommonJS and ES module formats.
 */
class ModuleLoader {
  /**
     * Creates an instance of ModuleLoader.
     * @param {object} [options={}] - Configuration options for the loader.
     * @param {boolean} [options.allowNativeModules=true] - Whether to allow loading of native Node.js modules.
     * @param {boolean} [options.strictMode=false] - Whether to enforce strict mode in loaded modules.
     */
  constructor(options = {}) {
    this.resolver = new ModuleResolver(options);
    this.cache = new ModuleCache();
    this.interpreter = new LuaScriptInterpreter(options);
    this.options = {
      allowNativeModules: options.allowNativeModules !== false,
      strictMode: options.strictMode || false,
      ...options
    };
  }

  /**
     * Implements the `require` function for loading CommonJS modules.
     * @param {string} specifier - The module specifier.
     * @param {string} fromPath - The path of the calling module.
     * @returns {*} The exports of the loaded module.
     * @throws {Error} If a circular dependency is detected or if the module fails to load.
     */
  require(specifier, fromPath) {
    const resolvedPath = this.resolver.resolve(specifier, fromPath);
        
    // Check cache first
    if (this.cache.has(resolvedPath)) {
      return this.cache.get(resolvedPath);
    }

    // Check for circular dependencies
    if (this.cache.isLoading(resolvedPath)) {
      throw new Error(`Circular dependency detected: ${resolvedPath}`);
    }

    this.cache.startLoading(resolvedPath);

    try {
      const moduleExports = this.loadModule(resolvedPath);
      this.cache.set(resolvedPath, moduleExports);
      return moduleExports;
    } finally {
      this.cache.finishLoading(resolvedPath);
    }
  }

  /**
     * Loads a module based on its file extension.
     * @param {string} modulePath - The absolute path of the module.
     * @returns {*} The exports of the loaded module.
     * @private
     */
  loadModule(modulePath) {
    const ext = path.extname(modulePath);
        
    switch (ext) {
    case ".js":
      return this.loadJavaScriptModule(modulePath);
    case ".luascript":
    case ".ls":
      return this.loadLuaScriptModule(modulePath);
    case ".json":
      return this.loadJsonModule(modulePath);
    default:
      // Try to load as LuaScript by default
      return this.loadLuaScriptModule(modulePath);
    }
  }

  /**
     * Loads a native JavaScript module.
     * @param {string} modulePath - The absolute path of the module.
     * @returns {*} The exports of the loaded module.
     * @private
     */
  loadJavaScriptModule(modulePath) {
    if (!this.options.allowNativeModules) {
      throw new Error("Native JavaScript modules are not allowed");
    }

    // Clear require cache to ensure fresh load
    delete require.cache[require.resolve(modulePath)];
        
    try {
      return require(modulePath);
    } catch (error) {
      throw new Error(`Failed to load JavaScript module ${modulePath}: ${error.message}`);
    }
  }

  /**
     * Loads and executes a LuaScript module.
     * @param {string} modulePath - The absolute path of the module.
     * @returns {*} The exports of the loaded module.
     * @private
     */
  loadLuaScriptModule(modulePath) {
    try {
      const source = fs.readFileSync(modulePath, "utf8");
      return this.executeModule(source, modulePath);
    } catch (error) {
      throw new Error(`Failed to load LuaScript module ${modulePath}: ${error.message}`);
    }
  }

  /**
     * Loads and parses a JSON module.
     * @param {string} modulePath - The absolute path of the module.
     * @returns {object} The parsed JSON object.
     * @private
     */
  loadJsonModule(modulePath) {
    try {
      const source = fs.readFileSync(modulePath, "utf8");
      return JSON.parse(source);
    } catch (error) {
      throw new Error(`Failed to load JSON module ${modulePath}: ${error.message}`);
    }
  }

  /**
     * Executes the source code of a module in a new environment.
     * @param {string} source - The source code of the module.
     * @param {string} modulePath - The absolute path of the module.
     * @returns {*} The exports of the executed module.
     * @private
     */
  executeModule(source, modulePath) {
    // Parse the module source
    const parser = new LuaScriptParser(source, {
      errorRecovery: false,
      strictMode: this.options.strictMode
    });
        
    const ast = parser.parse();
        
    if (parser.hasErrors()) {
      const errors = parser.getErrors().map(err => err.message).join("\n");
      throw new Error(`Parse errors in ${modulePath}:\n${errors}`);
    }

    // Create module environment
    const moduleEnv = new Environment(this.interpreter.getGlobals());
        
    // Set up module globals
    const moduleExports = new LuaScriptObject();
    const moduleObject = new LuaScriptObject({
      exports: moduleExports,
      filename: modulePath,
      id: modulePath,
      loaded: false,
      parent: null,
      children: [],
      paths: this.resolver.moduleDirectories.map(dir => 
        path.resolve(path.dirname(modulePath), dir)
      )
    });

    moduleEnv.define("module", moduleObject);
    moduleEnv.define("exports", moduleExports);
    moduleEnv.define("__filename", modulePath);
    moduleEnv.define("__dirname", path.dirname(modulePath));
        
    // Set up require function for this module
    const requireFunction = (specifier) => {
      return this.require(specifier, modulePath);
    };
        
    // Add require.resolve
    requireFunction.resolve = (specifier) => {
      return this.resolver.resolve(specifier, modulePath);
    };
        
    // Add require.cache
    requireFunction.cache = this.cache;
        
    moduleEnv.define("require", requireFunction);

    // Execute the module
    const previousEnv = this.interpreter.environment;
    this.interpreter.environment = moduleEnv;
        
    try {
      this.interpreter.interpret(ast);
            
      // Get the final exports
      const finalExports = moduleEnv.get("exports");
      moduleObject.set("loaded", true);
            
      return finalExports;
    } finally {
      this.interpreter.environment = previousEnv;
    }
  }

  /**
     * Clears the module cache.
     */
  clearCache() {
    this.cache.clear();
  }

  /**
     * Gets the module cache instance.
     * @returns {ModuleCache} The module cache.
     */
  getCache() {
    return this.cache;
  }

  /**
     * Gets the module resolver instance.
     * @returns {ModuleResolver} The module resolver.
     */
  getResolver() {
    return this.resolver;
  }

  /**
     * Adds a module alias.
     * @param {string} alias - The alias name.
     * @param {string} target - The target path.
     */
  addAlias(alias, target) {
    this.resolver.addAlias(alias, target);
  }

  /**
     * Removes a module alias.
     * @param {string} alias - The alias to remove.
     */
  removeAlias(alias) {
    this.resolver.removeAlias(alias);
  }
}

/**
 * A module loader specifically for ES modules, supporting dynamic `import()`.
 * @extends ModuleLoader
 */
class ESModuleLoader extends ModuleLoader {
  constructor(options = {}) {
    super(options);
    this.importMap = new Map();
  }

  /**
     * Asynchronously imports an ES module.
     * @param {string} specifier - The module specifier.
     * @param {string} fromPath - The path of the calling module.
     * @returns {Promise<*>} A promise that resolves with the module's exports.
     */
  async import(specifier, fromPath) {
    const resolvedPath = this.resolver.resolve(specifier, fromPath);
        
    // Check cache first
    if (this.cache.has(resolvedPath)) {
      return this.cache.get(resolvedPath);
    }

    // Check for circular dependencies
    if (this.cache.isLoading(resolvedPath)) {
      throw new Error(`Circular dependency detected: ${resolvedPath}`);
    }

    this.cache.startLoading(resolvedPath);

    try {
      const moduleExports = await this.loadESModule(resolvedPath);
      this.cache.set(resolvedPath, moduleExports);
      return moduleExports;
    } finally {
      this.cache.finishLoading(resolvedPath);
    }
  }

  /**
     * Loads an ES module based on its file extension.
     * @param {string} modulePath - The absolute path of the module.
     * @returns {Promise<*>} A promise that resolves with the module's exports.
     * @private
     */
  async loadESModule(modulePath) {
    const ext = path.extname(modulePath);
        
    switch (ext) {
    case ".js":
      return await this.loadESJavaScriptModule(modulePath);
    case ".luascript":
    case ".ls":
      return await this.loadESLuaScriptModule(modulePath);
    case ".json":
      return this.loadJsonModule(modulePath);
    default:
      return await this.loadESLuaScriptModule(modulePath);
    }
  }

  /**
     * Loads a native ES JavaScript module.
     * @param {string} modulePath - The absolute path of the module.
     * @returns {Promise<*>} A promise that resolves with the module's exports.
     * @private
     */
  async loadESJavaScriptModule(modulePath) {
    if (!this.options.allowNativeModules) {
      throw new Error("Native JavaScript modules are not allowed");
    }

    try {
      // Use dynamic import for ES modules
      const module = await import(modulePath);
      return module;
    } catch (error) {
      throw new Error(`Failed to load ES JavaScript module ${modulePath}: ${error.message}`);
    }
  }

  /**
     * Loads and executes an ES LuaScript module.
     * @param {string} modulePath - The absolute path of the module.
     * @returns {Promise<*>} A promise that resolves with the module's exports.
     * @private
     */
  async loadESLuaScriptModule(modulePath) {
    try {
      const source = fs.readFileSync(modulePath, "utf8");
      return await this.executeESModule(source, modulePath);
    } catch (error) {
      throw new Error(`Failed to load ES LuaScript module ${modulePath}: ${error.message}`);
    }
  }

  /**
     * Executes the source code of an ES module.
     * @param {string} source - The source code of the module.
     * @param {string} modulePath - The absolute path of the module.
     * @returns {Promise<*>} A promise that resolves with the module's exports.
     * @private
     */
  async executeESModule(source, modulePath) {
    // Parse the module source
    const parser = new LuaScriptParser(source, {
      errorRecovery: false,
      strictMode: this.options.strictMode
    });
        
    const ast = parser.parse();
        
    if (parser.hasErrors()) {
      const errors = parser.getErrors().map(err => err.message).join("\n");
      throw new Error(`Parse errors in ${modulePath}:\n${errors}`);
    }

    // Create module environment
    const moduleEnv = new Environment(this.interpreter.getGlobals());
        
    // Set up ES module globals
    const moduleExports = new LuaScriptObject();
        
    moduleEnv.define("import", async (specifier) => {
      return await this.import(specifier, modulePath);
    });
        
    moduleEnv.define("export", (name, value) => {
      moduleExports.set(name, value);
    });
        
    moduleEnv.define("__filename", modulePath);
    moduleEnv.define("__dirname", path.dirname(modulePath));

    // Execute the module
    const previousEnv = this.interpreter.environment;
    this.interpreter.environment = moduleEnv;
        
    try {
      this.interpreter.interpret(ast);
      return moduleExports;
    } finally {
      this.interpreter.environment = previousEnv;
    }
  }

  /**
     * Sets the import map for the ES module loader.
     * @param {object} importMap - An object representing the import map.
     */
  setImportMap(importMap) {
    this.importMap = new Map(Object.entries(importMap));
        
    // Update resolver aliases
    for (const [alias, target] of this.importMap) {
      this.resolver.addAlias(alias, target);
    }
  }

  /**
     * Gets the current import map.
     * @returns {object} The import map object.
     */
  getImportMap() {
    return Object.fromEntries(this.importMap);
  }
}

// Built-in modules
const builtinModules = {
  "fs": {
    readFileSync: fs.readFileSync,
    writeFileSync: fs.writeFileSync,
    existsSync: fs.existsSync,
    statSync: fs.statSync,
    readdirSync: fs.readdirSync,
    mkdirSync: fs.mkdirSync,
    rmdirSync: fs.rmdirSync,
    unlinkSync: fs.unlinkSync
  },
  "path": {
    join: path.join,
    resolve: path.resolve,
    dirname: path.dirname,
    basename: path.basename,
    extname: path.extname,
    isAbsolute: path.isAbsolute,
    relative: path.relative,
    normalize: path.normalize,
    sep: path.sep,
    delimiter: path.delimiter
  },
  "util": {
    inspect: require("util").inspect,
    format: require("util").format,
    isArray: Array.isArray,
    isObject: (obj) => obj !== null && typeof obj === "object",
    isFunction: (fn) => typeof fn === "function",
    isString: (str) => typeof str === "string",
    isNumber: (num) => typeof num === "number",
    isBoolean: (bool) => typeof bool === "boolean"
  }
};

// Built-in modules will be registered when ModuleLoader is instantiated

module.exports = {
  ModuleLoader,
  ESModuleLoader,
  ModuleResolver,
  ModuleCache,
  builtinModules
};
