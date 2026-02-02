"use strict";

/**
 * Python Buffer Overflow Detector
 * 
 * Detects potential buffer overflow vulnerabilities in Python code
 * interacting with C extensions or low-level memory operations.
 * 
 * Focuses on:
 * - Array/buffer boundary violations
 * - Unsafe string operations
 * - Memory allocation without bounds checking
 * - ctypes pointer arithmetic
 * - struct.pack/unpack operations
 * 
 * Phase E Component: Security & Interoperability
 */

class PythonBufferOverflowDetector {
  constructor(options = {}) {
    this.options = {
      enabled: options.enabled !== false,
      checkArrayAccess: options.checkArrayAccess !== false,
      checkStringOps: options.checkStringOps !== false,
      checkCtypes: options.checkCtypes !== false,
      checkStructOps: options.checkStructOps !== false,
      strictMode: options.strictMode || false,
      ...options,
    };

    this.issues = [];
    this.buffers = new Map(); // Track buffer sizes
    this.accessPatterns = [];
  }

  /**
   * Analyze IR for buffer overflow vulnerabilities
   */
  analyze(ir) {
    this.reset();

    try {
      this._analyzeNode(ir);

      return {
        success: true,
        issues: this.issues,
        severity: this._calculateOverallSeverity(),
        stats: this._getStats(),
        recommendations: this._generateRecommendations(),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Analyze IR node recursively
   */
  _analyzeNode(node) {
    if (!node) return;

    switch (node.type) {
      case 'Subscript':
        this._analyzeSubscript(node);
        break;

      case 'Call':
        this._analyzeCall(node);
        break;

      case 'BinOp':
        this._analyzeBinOp(node);
        break;

      case 'Assign':
        this._analyzeAssign(node);
        break;

      case 'For':
        this._analyzeFor(node);
        break;

      case 'While':
        this._analyzeWhile(node);
        break;
    }

    // Recurse through children
    if (node.body) {
      if (Array.isArray(node.body)) {
        node.body.forEach(child => this._analyzeNode(child));
      } else {
        this._analyzeNode(node.body);
      }
    }

    if (node.orelse) {
      if (Array.isArray(node.orelse)) {
        node.orelse.forEach(child => this._analyzeNode(child));
      } else {
        this._analyzeNode(node.orelse);
      }
    }

    if (node.left) this._analyzeNode(node.left);
    if (node.right) this._analyzeNode(node.right);
    if (node.value) this._analyzeNode(node.value);
  }

  /**
   * Analyze array/list subscript access
   */
  _analyzeSubscript(node) {
    if (!this.options.checkArrayAccess) return;

    const bufferName = this._getNodeName(node.value);
    const index = node.slice;

    // Check for constant index out of bounds
    if (this._isConstant(index)) {
      const indexValue = this._getConstantValue(index);
      const bufferSize = this.buffers.get(bufferName);

      if (bufferSize !== undefined && indexValue >= bufferSize) {
        this.issues.push({
          type: 'BUFFER_OVERFLOW',
          severity: 'HIGH',
          location: node.lineno || 0,
          buffer: bufferName,
          index: indexValue,
          bufferSize: bufferSize,
          message: `Array index ${indexValue} exceeds buffer size ${bufferSize}`,
          description: 'Accessing array beyond its allocated bounds',
          remediation: 'Add bounds checking before array access',
          cwe: 'CWE-125', // Out-of-bounds Read
        });
      }
    }

    // Check for negative indices (Python allows, but can be dangerous in C)
    if (this._isNegativeIndex(index)) {
      this.issues.push({
        type: 'NEGATIVE_INDEX',
        severity: 'MEDIUM',
        location: node.lineno || 0,
        buffer: bufferName,
        message: `Negative index used on buffer '${bufferName}'`,
        description: 'Negative indices can cause issues in C interop',
        remediation: 'Use explicit length calculation or positive indices',
        cwe: 'CWE-129', // Improper Validation of Array Index
      });
    }

    // Track access pattern
    this.accessPatterns.push({
      buffer: bufferName,
      index: index,
      type: 'subscript',
      location: node.lineno,
    });
  }

  /**
   * Analyze function calls for unsafe operations
   */
  _analyzeCall(node) {
    const funcName = this._getFunctionName(node.func);

    // Check string operations
    if (this.options.checkStringOps) {
      this._checkStringOperations(node, funcName);
    }

    // Check ctypes operations
    if (this.options.checkCtypes) {
      this._checkCtypesOperations(node, funcName);
    }

    // Check struct operations
    if (this.options.checkStructOps) {
      this._checkStructOperations(node, funcName);
    }

    // Check memoryview operations
    this._checkMemoryViewOperations(node, funcName);

    // Check array operations
    this._checkArrayOperations(node, funcName);
  }

  /**
   * Check string operations for buffer issues
   */
  _checkStringOperations(node, funcName) {
    const unsafeStringOps = ['strcpy', 'strcat', 'sprintf', 'gets', 'scanf'];

    if (unsafeStringOps.includes(funcName)) {
      this.issues.push({
        type: 'UNSAFE_STRING_OP',
        severity: 'HIGH',
        location: node.lineno || 0,
        function: funcName,
        message: `Unsafe string operation: ${funcName}`,
        description: `${funcName} can cause buffer overflow if input exceeds buffer size`,
        remediation: `Use safe alternative (e.g., strncpy, strncat, snprintf)`,
        cwe: 'CWE-120', // Buffer Copy without Checking Size
      });
    }

    // Check for format string vulnerabilities
    if (['sprintf', 'printf', 'fprintf'].includes(funcName)) {
      if (node.args.length > 0 && !this._isConstantString(node.args[0])) {
        this.issues.push({
          type: 'FORMAT_STRING',
          severity: 'HIGH',
          location: node.lineno || 0,
          function: funcName,
          message: `Format string from untrusted source in ${funcName}`,
          description: 'Format string vulnerabilities can lead to memory corruption',
          remediation: 'Use constant format strings or sanitize input',
          cwe: 'CWE-134', // Use of Externally-Controlled Format String
        });
      }
    }
  }

  /**
   * Check ctypes operations
   */
  _checkCtypesOperations(node, funcName) {
    // Check pointer arithmetic
    if (funcName === 'cast' || funcName === 'pointer') {
      this.issues.push({
        type: 'POINTER_ARITHMETIC',
        severity: 'MEDIUM',
        location: node.lineno || 0,
        function: funcName,
        message: `Potentially unsafe pointer operation: ${funcName}`,
        description: 'Pointer arithmetic without bounds checking',
        remediation: 'Ensure pointers stay within allocated memory',
        cwe: 'CWE-823', // Use of Out-of-range Pointer Offset
      });
    }

    // Check memory allocation
    if (funcName === 'create_string_buffer' || funcName === 'create_unicode_buffer') {
      if (node.args.length === 0 || !this._isConstant(node.args[0])) {
        this.issues.push({
          type: 'DYNAMIC_ALLOCATION',
          severity: 'LOW',
          location: node.lineno || 0,
          function: funcName,
          message: `Dynamic buffer allocation in ${funcName}`,
          description: 'Buffer size determined at runtime',
          remediation: 'Use constant sizes or validate size parameter',
          cwe: 'CWE-789', // Memory Allocation with Excessive Size
        });
      }
    }

    // Check pointer dereferencing
    if (funcName === 'contents' || funcName === 'value') {
      this.issues.push({
        type: 'POINTER_DEREF',
        severity: 'MEDIUM',
        location: node.lineno || 0,
        function: funcName,
        message: `Pointer dereference without null check`,
        description: 'Dereferencing pointer that might be NULL',
        remediation: 'Add null pointer check before dereferencing',
        cwe: 'CWE-476', // NULL Pointer Dereference
      });
    }
  }

  /**
   * Check struct pack/unpack operations
   */
  _checkStructOperations(node, funcName) {
    if (funcName === 'pack' || funcName === 'pack_into') {
      // Check format string and argument count
      if (node.args.length < 2) {
        this.issues.push({
          type: 'STRUCT_PACK_ERROR',
          severity: 'MEDIUM',
          location: node.lineno || 0,
          function: funcName,
          message: `Insufficient arguments to struct.${funcName}`,
          description: 'Missing format or values can cause buffer issues',
          remediation: 'Ensure format string matches argument count',
          cwe: 'CWE-787', // Out-of-bounds Write
        });
      }

      // Check for unchecked buffer size in pack_into
      if (funcName === 'pack_into' && node.args.length < 3) {
        this.issues.push({
          type: 'PACK_INTO_NO_OFFSET',
          severity: 'HIGH',
          location: node.lineno || 0,
          function: funcName,
          message: `struct.pack_into without offset validation`,
          description: 'Writing to buffer without checking bounds',
          remediation: 'Validate buffer size and offset before packing',
          cwe: 'CWE-787', // Out-of-bounds Write
        });
      }
    }

    if (funcName === 'unpack' || funcName === 'unpack_from') {
      // Check buffer size matches format
      this.issues.push({
        type: 'STRUCT_UNPACK_SIZE',
        severity: 'MEDIUM',
        location: node.lineno || 0,
        function: funcName,
        message: `struct.${funcName} without size validation`,
        description: 'Unpacking from buffer without size check',
        remediation: 'Validate buffer size matches format string',
        cwe: 'CWE-125', // Out-of-bounds Read
      });
    }
  }

  /**
   * Check memoryview operations
   */
  _checkMemoryViewOperations(node, funcName) {
    if (funcName === 'memoryview') {
      // Track memoryview creation
      this.issues.push({
        type: 'MEMORYVIEW_ACCESS',
        severity: 'LOW',
        location: node.lineno || 0,
        function: funcName,
        message: `Direct memory access via memoryview`,
        description: 'Memoryview bypasses Python bounds checking',
        remediation: 'Ensure all accesses stay within bounds',
        cwe: 'CWE-119', // Improper Restriction of Operations within Memory Bounds
      });
    }
  }

  /**
   * Check array module operations
   */
  _checkArrayOperations(node, funcName) {
    if (funcName === 'frombytes' || funcName === 'fromstring') {
      this.issues.push({
        type: 'ARRAY_FROM_BYTES',
        severity: 'MEDIUM',
        location: node.lineno || 0,
        function: funcName,
        message: `Array created from bytes without validation`,
        description: 'Converting bytes to array without size check',
        remediation: 'Validate byte string length matches array size',
        cwe: 'CWE-805', // Buffer Access with Incorrect Length
      });
    }
  }

  /**
   * Analyze binary operations for pointer arithmetic
   */
  _analyzeBinOp(node) {
    // Check for pointer arithmetic patterns (Add/Sub on ctypes pointers)
    if (node.op === 'Add' || node.op === 'Sub') {
      const leftName = this._getNodeName(node.left);
      const rightName = this._getNodeName(node.right);

      if (this._looksLikePointer(leftName) || this._looksLikePointer(rightName)) {
        this.issues.push({
          type: 'POINTER_ARITHMETIC',
          severity: 'MEDIUM',
          location: node.lineno || 0,
          message: `Pointer arithmetic detected`,
          description: 'Arithmetic on pointer-like variable',
          remediation: 'Ensure pointer stays within allocated bounds',
          cwe: 'CWE-823', // Use of Out-of-range Pointer Offset
        });
      }
    }
  }

  /**
   * Analyze assignments to track buffer sizes
   */
  _analyzeAssign(node) {
    if (!node.targets || node.targets.length === 0) return;

    const targetName = this._getNodeName(node.targets[0]);
    
    // Track list/array creation with known size
    if (node.value.type === 'List' && node.value.elts) {
      this.buffers.set(targetName, node.value.elts.length);
    }

    // Track bytearray creation
    if (node.value.type === 'Call') {
      const funcName = this._getFunctionName(node.value.func);
      
      if (funcName === 'bytearray' && node.value.args.length > 0) {
        const size = this._getConstantValue(node.value.args[0]);
        if (size !== null) {
          this.buffers.set(targetName, size);
        }
      }

      if (funcName === 'create_string_buffer' && node.value.args.length > 0) {
        const size = this._getConstantValue(node.value.args[0]);
        if (size !== null) {
          this.buffers.set(targetName, size);
        }
      }
    }
  }

  /**
   * Analyze for loops for potential array access issues
   */
  _analyzeFor(node) {
    // Check if loop variable used in array access
    const loopVar = node.target.id || '';
    
    // Track loop bounds
    if (node.iter.type === 'Call' && this._getFunctionName(node.iter.func) === 'range') {
      const rangeArgs = node.iter.args;
      if (rangeArgs.length > 0) {
        const end = this._getConstantValue(rangeArgs[rangeArgs.length - 1]);
        
        // Check for off-by-one errors in loops
        this._checkLoopBodyForOffByOne(node.body, loopVar, end);
      }
    }
  }

  /**
   * Analyze while loops for unbounded access
   */
  _analyzeWhile(node) {
    // Check for unbounded loops with array access
    this.issues.push({
      type: 'UNBOUNDED_LOOP',
      severity: 'LOW',
      location: node.lineno || 0,
      message: `While loop with potential unbounded array access`,
      description: 'Loop condition might not prevent buffer overflow',
      remediation: 'Add explicit bounds checking in loop',
      cwe: 'CWE-835', // Loop with Unreachable Exit Condition
    });
  }

  /**
   * Check loop body for off-by-one errors
   */
  _checkLoopBodyForOffByOne(body, loopVar, loopEnd) {
    // Simplified check: look for array[loopVar] patterns
    // In production would need full data flow analysis
  }

  /**
   * Calculate overall severity
   */
  _calculateOverallSeverity() {
    if (this.issues.some(i => i.severity === 'CRITICAL')) return 'CRITICAL';
    if (this.issues.some(i => i.severity === 'HIGH')) return 'HIGH';
    if (this.issues.some(i => i.severity === 'MEDIUM')) return 'MEDIUM';
    if (this.issues.some(i => i.severity === 'LOW')) return 'LOW';
    return 'NONE';
  }

  /**
   * Get statistics
   */
  _getStats() {
    const counts = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    this.issues.forEach(issue => {
      const sev = issue.severity.toLowerCase();
      if (counts[sev] !== undefined) {
        counts[sev]++;
      }
    });

    return {
      totalIssues: this.issues.length,
      byType: this._countByType(),
      bySeverity: counts,
      buffersTracked: this.buffers.size,
      accessPatternsFound: this.accessPatterns.length,
    };
  }

  /**
   * Count issues by type
   */
  _countByType() {
    const types = {};
    this.issues.forEach(issue => {
      types[issue.type] = (types[issue.type] || 0) + 1;
    });
    return types;
  }

  /**
   * Generate recommendations
   */
  _generateRecommendations() {
    const recs = [];

    if (this.issues.some(i => i.type === 'BUFFER_OVERFLOW')) {
      recs.push('Add bounds checking before all array accesses');
    }

    if (this.issues.some(i => i.type === 'UNSAFE_STRING_OP')) {
      recs.push('Replace unsafe string functions with safe alternatives');
    }

    if (this.issues.some(i => i.type === 'POINTER_ARITHMETIC')) {
      recs.push('Validate pointer offsets stay within allocated memory');
    }

    if (this.issues.some(i => i.type === 'STRUCT_PACK_ERROR' || i.type === 'STRUCT_UNPACK_SIZE')) {
      recs.push('Always validate buffer size matches struct format string');
    }

    return recs;
  }

  /**
   * Helper: Get node name
   */
  _getNodeName(node) {
    if (!node) return '';
    if (node.id) return node.id;
    if (node.attr) return node.attr;
    return '';
  }

  /**
   * Helper: Get function name
   */
  _getFunctionName(node) {
    if (!node) return '';
    if (node.id) return node.id;
    if (node.attr) return node.attr;
    if (node.func) return this._getFunctionName(node.func);
    return '';
  }

  /**
   * Helper: Check if node is constant
   */
  _isConstant(node) {
    if (!node) return false;
    return node.type === 'Constant' || node.type === 'Num';
  }

  /**
   * Helper: Get constant value
   */
  _getConstantValue(node) {
    if (!node) return null;
    if (node.type === 'Constant') return node.value;
    if (node.type === 'Num') return node.n;
    return null;
  }

  /**
   * Helper: Check if index is negative
   */
  _isNegativeIndex(node) {
    if (!node) return false;
    if (node.type === 'UnaryOp' && node.op === 'USub') return true;
    if (this._isConstant(node)) {
      const val = this._getConstantValue(node);
      return val !== null && val < 0;
    }
    return false;
  }

  /**
   * Helper: Check if node is constant string
   */
  _isConstantString(node) {
    if (!node) return false;
    return (node.type === 'Str') || 
           (node.type === 'Constant' && typeof node.value === 'string');
  }

  /**
   * Helper: Check if name looks like pointer
   */
  _looksLikePointer(name) {
    const pointerPatterns = ['_ptr', 'ptr_', 'pointer', 'address', '_p', 'p_'];
    return pointerPatterns.some(pattern => name.toLowerCase().includes(pattern));
  }

  /**
   * Reset detector state
   */
  reset() {
    this.issues = [];
    this.buffers = new Map();
    this.accessPatterns = [];
  }
}

module.exports = { PythonBufferOverflowDetector };
