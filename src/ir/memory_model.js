"use strict";

/**
 * Memory Model Abstraction
 * Abstracts stack/heap/register allocation across languages
 * 
 * Purpose: Provide unified memory layout semantics for:
 * - Pointer/reference normalization
 * - Lifetime analysis
 * - Escape analysis
 * - Memory safety annotations
 */

class MemoryModelAbstraction {
  constructor(options = {}) {
    this.options = options;
    this.initializeMemoryLocations();
    this.initializeLifetimeRules();
    this.initializeMemorySafety();
  }

  /**
   * Initialize memory location types
   */
  initializeMemoryLocations() {
    this.locations = {
      // Stack allocation (automatic, LIFO)
      stack: {
        name: "Stack",
        automatic: true,
        lifetime: "scope",
        alignment: 8,
        restrictions: ["size bounded", "scope-bound"],
        speedCategory: "fastest",
      },

      // Heap allocation (manual or GC-managed)
      heap: {
        name: "Heap",
        automatic: false,
        lifetime: "explicit",
        alignment: 16,
        restrictions: ["fragmentation", "GC overhead"],
        speedCategory: "slow",
      },

      // Register allocation (zero-overhead)
      register: {
        name: "Register",
        automatic: true,
        lifetime: "expression",
        alignment: "natural",
        restrictions: ["limited count", "caller/callee save"],
        speedCategory: "fastest",
      },

      // Thread-local storage
      threadLocal: {
        name: "Thread-Local Storage",
        automatic: true,
        lifetime: "thread",
        alignment: "natural",
        restrictions: ["thread-bound", "no sharing"],
        speedCategory: "fast",
      },

      // Global/static allocation
      global: {
        name: "Global/Static",
        automatic: true,
        lifetime: "program",
        alignment: "natural",
        restrictions: ["initialization order", "no destruction"],
        speedCategory: "fast",
      },
    };
  }

  /**
   * Initialize lifetime analysis rules
   */
  initializeLifetimeRules() {
    this.lifetimeRules = {
      // Scope-based (C/C++ stack)
      scoped: {
        rule: "Allocation destroyed at scope end",
        languages: ["C", "C++", "C#", "Objective-C"],
        tracking: "deterministic",
        verification: "compile-time",
      },

      // GC-managed (Python, JavaScript, Lua)
      managed: {
        rule: "Allocation tracked by garbage collector",
        languages: ["Python", "JavaScript", "Lua"],
        tracking: "automatic",
        verification: "runtime",
      },

      // Reference counted (C++ shared_ptr, Python refcount)
      refCounted: {
        rule: "Deallocation when reference count reaches 0",
        languages: ["C++", "Python"],
        tracking: "explicit-hybrid",
        verification: "runtime",
      },

      // Manual (C malloc/free)
      manual: {
        rule: "Explicit allocation and deallocation",
        languages: ["C", "C--"],
        tracking: "manual",
        verification: "analysis",
      },

      // Static (global variables)
      static_: {
        rule: "Allocation at program start, deallocation at end",
        languages: ["all"],
        tracking: "implicit",
        verification: "compile-time",
      },
    };
  }

  /**
   * Initialize memory safety annotations
   */
  initializeMemorySafety() {
    this.safetyLevels = {
      unsafe: {
        name: "Unsafe",
        allowsUncheckedCasts: true,
        allowsRawPointers: true,
        allowsManualMemory: true,
        requiresAnnotation: false,
        languages: ["C", "C++"],
      },

      safe: {
        name: "Safe",
        allowsUncheckedCasts: false,
        allowsRawPointers: false,
        allowsManualMemory: false,
        requiresAnnotation: true,
        languages: ["Python", "JavaScript", "C#"],
      },

      bounded: {
        name: "Bounded",
        allowsUncheckedCasts: false,
        allowsRawPointers: true,
        allowsManualMemory: true,
        requiresAnnotation: true,
        languages: ["Objective-C", "C++"],
      },
    };

    this.safetyAnnotations = {
      "unsafe": "Code is unchecked, potential memory errors",
      "safe": "Memory safety enforced by runtime/type system",
      "bounded": "Bounded scope for unsafe operations",
      "owned": "Exclusive ownership of allocation",
      "borrowed": "Temporary access (non-owning)",
      "shared": "Shared access (read-only or reference-counted)",
      "pinned": "Address cannot change (for self-referential structures)",
      "gc": "Managed by garbage collector",
      "rc": "Reference-counted",
    };
  }

  /**
   * Map a language-specific allocation to IR allocation
   * @param {object} allocation - Language-specific allocation
   * @param {string} language - Source language
   * @returns {object} Canonical IR allocation
   */
  canonicalizeAllocation(allocation, language) {
    let location = "heap"; // default

    if (language === "C" || language === "C++" || language === "Objective-C") {
      if (allocation.isStack || allocation.automatic) {
        location = "stack";
      } else if (allocation.isGlobal || allocation.isStatic) {
        location = "global";
      }
    } else if (language === "Python" || language === "JavaScript" || language === "Lua") {
      location = "heap"; // Always GC-managed
    }

    return {
      canonical: location,
      language,
      original: allocation,
      size: allocation.size || null,
      alignment: allocation.alignment || "natural",
      lifetime: this.getLifetime(allocation, language),
      safety: this.getSafetyLevel(allocation, language),
    };
  }

  /**
   * Get lifetime rule for allocation
   */
  getLifetime(allocation, language) {
    if (allocation.isStatic || allocation.isGlobal) {
      return { rule: "static_", duration: "program" };
    }

    if (language === "Python" || language === "JavaScript" || language === "Lua") {
      return { rule: "managed", duration: "gc" };
    }

    if (allocation.isStack || allocation.automatic) {
      return { rule: "scoped", duration: "scope" };
    }

    if (language === "C" || language === "C--") {
      return { rule: "manual", duration: "explicit" };
    }

    return { rule: "managed", duration: "gc" };
  }

  /**
   * Get safety level for allocation
   */
  getSafetyLevel(allocation, language) {
    if (language === "C" || language === "C++") {
      return allocation.isUnsafe ? "unsafe" : "bounded";
    }
    if (language === "Python" || language === "JavaScript" || language === "Lua") {
      return "safe";
    }
    if (language === "C#" || language === "Objective-C") {
      return "safe";
    }
    return "safe";
  }

  /**
   * Perform escape analysis
   * Determines if allocation escapes its local scope
   * @param {object} allocation - Allocation descriptor
   * @param {object[]} uses - Uses of the allocation
   * @returns {object} Escape analysis result
   */
  performEscapeAnalysis(allocation, uses = []) {
    const escapes = {
      returnsFromFunction: false,
      passedToUnknownFunction: false,
      storedInGlobal: false,
      storedInHeap: false,
      passedToAnotherThread: false,
    };

    for (const use of uses) {
      if (use.type === "return") {
        escapes.returnsFromFunction = true;
      }
      if (use.type === "functionCall" && use.isExternal) {
        escapes.passedToUnknownFunction = true;
      }
      if (use.type === "globalStore") {
        escapes.storedInGlobal = true;
      }
      if (use.type === "heapStore") {
        escapes.storedInHeap = true;
      }
      if (use.type === "threadSend") {
        escapes.passedToAnotherThread = true;
      }
    }

    const escapeLevel = Object.values(escapes).some(v => v) ? "global" : "local";

    return {
      allocation: allocation.name,
      escapes: escapeLevel,
      details: escapes,
      optimizations: this.getEscapeOptimizations(escapeLevel),
    };
  }

  /**
   * Get optimization opportunities based on escape level
   */
  getEscapeOptimizations(escapeLevel) {
    if (escapeLevel === "local") {
      return [
        "stack allocation",
        "no reference counting needed",
        "can be inlined",
        "can be stack-copy passed",
      ];
    }
    return [
      "must use heap allocation",
      "reference counting may apply",
      "inlining limited",
    ];
  }

  /**
   * Perform alias analysis
   * Determines potential aliasing relationships
   * @param {string[]} pointerNames - Pointer variable names
   * @param {object[]} assignments - Pointer assignments
   * @returns {object} Alias analysis result
   */
  performAliasAnalysis(pointerNames, assignments = []) {
    const _aliasGroups = new Map();
    const mustAliases = new Set(); // Definitely alias
    const mayAliases = new Set();  // Might alias

    for (const assignment of assignments) {
      const key = `${assignment.src}→${assignment.dst}`;
      if (assignment.definite) {
        mustAliases.add(key);
      } else {
        mayAliases.add(key);
      }
    }

    return {
      pointers: pointerNames,
      mustAliases: Array.from(mustAliases),
      mayAliases: Array.from(mayAliases),
      canOptimize: mustAliases.size === 0,
    };
  }

  /**
   * Normalize pointer semantics
   * Maps language-specific pointer rules to IR
   * @param {object} pointerType - Pointer type descriptor
   * @param {string} language - Source language
   * @returns {object} Normalized pointer
   */
  normalizePointerSemantics(pointerType, language) {
    const isReference = language === "C++" && pointerType.isReference;
    const isSmartPointer = language === "C++" && pointerType.isSmartPtr;
    
    let ownership = "borrowed";
    if (isSmartPointer) {
      ownership = pointerType.pointerType === "unique_ptr" ? "owned" : "shared";
    } else if (isReference) {
      ownership = "borrowed";
    } else if (language === "Python" || language === "JavaScript") {
      ownership = "shared"; // GC-managed
    }

    return {
      canonical: "pointer",
      pointeeType: pointerType.pointeeType,
      ownership,
      nullability: pointerType.nullable !== false,
      mutability: pointerType.mutable !== false,
      safety: this.getPointerSafety(pointerType, language),
    };
  }

  /**
   * Determine pointer safety level
   */
  getPointerSafety(pointerType, language) {
    if (language === "C") return "unchecked";
    if (language === "C++" && pointerType.isSmartPtr) return "checked";
    if (language === "Python" || language === "JavaScript") return "safe";
    return "default";
  }

  /**
   * Calculate memory layout for struct/class
   * @param {object} structDef - Structure definition
   * @param {string} language - Source language
   * @returns {object} Memory layout
   */
  calculateMemoryLayout(structDef, _language) {
    let offset = 0;
    let maxAlignment = 1;
    const fieldLayouts = [];

    for (const field of structDef.fields || []) {
      const alignment = field.alignment || 1;
      
      // Align current offset if needed
      if (offset % alignment !== 0) {
        offset += alignment - (offset % alignment);
      }

      fieldLayouts.push({
        name: field.name,
        type: field.type,
        offset,
        size: field.size || 0,
        alignment,
      });

      offset += field.size || 0;
      maxAlignment = Math.max(maxAlignment, alignment);
    }

    // Pad structure to alignment boundary
    if (offset % maxAlignment !== 0) {
      offset += maxAlignment - (offset % maxAlignment);
    }

    return {
      struct: structDef.name,
      fields: fieldLayouts,
      totalSize: offset,
      alignment: maxAlignment,
      isPacked: structDef.isPacked || false,
    };
  }

  /**
   * Verify memory safety of code
   * @param {object[]} accesses - Memory access operations
   * @returns {object} Safety verification result
   */
  verifyMemorySafety(accesses) {
    const issues = [];

    for (const access of accesses) {
      if (access.type === "bufferAccess" && access.boundChecked === false) {
        issues.push(`Unchecked buffer access: ${access.name}[${access.index}]`);
      }
      if (access.type === "nullPointerDereference") {
        issues.push(`Potential null pointer dereference: ${access.name}`);
      }
      if (access.type === "useAfterFree") {
        issues.push(`Use after free: ${access.name}`);
      }
      if (access.type === "raceCondition") {
        issues.push(`Data race: ${access.name}`);
      }
    }

    return {
      safe: issues.length === 0,
      issues,
      accessCount: accesses.length,
      safeAccessCount: accesses.filter(a => a.safe).length,
    };
  }
}

module.exports = MemoryModelAbstraction;
