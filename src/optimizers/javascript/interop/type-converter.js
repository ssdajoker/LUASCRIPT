/**
 * Type Converter - Phase 3.5 Task 5.4
 * 
 * Implements safe and efficient type conversion across language boundaries.
 * Provides type mapping, safety validation, precision preservation, and 
 * conversion strategy optimization.
 * 
 * Performance targets:
 * - Achieve 10% overhead reduction through conversion efficiency
 * - Zero data loss in numeric conversions
 * - Deterministic type mapping across identical runs
 * - Support for JS↔Lua↔OCaml type bridges
 */

class TypeConverter {
  constructor() {
    this.typeMap = new Map();
    this.conversionCache = new Map();
    this.precisionMetrics = new Map();
    this.safetyCache = new Map();
    this._initializeTypeMap();
  }

  /**
   * Initialize type mapping for all language pairs
   * @private
   */
  _initializeTypeMap() {
    // JavaScript ↔ Lua type mappings
    this.typeMap.set('js-lua', {
      'number': { lua: 'number', cost: 5, safe: true },
      'boolean': { lua: 'boolean', cost: 2, safe: true },
      'string': { lua: 'string', cost: 10, safe: true },
      'object': { lua: 'table', cost: 15, safe: true },
      'array': { lua: 'table', cost: 15, safe: true },
      'int32': { lua: 'integer', cost: 3, safe: true },
      'uint32': { lua: 'number', cost: 5, safe: true },
      'float64': { lua: 'number', cost: 5, safe: true },
      'null': { lua: 'nil', cost: 1, safe: true }
    });

    // Lua ↔ JavaScript type mappings
    this.typeMap.set('lua-js', {
      'number': { js: 'number', cost: 5, safe: true },
      'boolean': { js: 'boolean', cost: 2, safe: true },
      'string': { js: 'string', cost: 10, safe: true },
      'table': { js: 'object', cost: 15, safe: true },
      'integer': { js: 'number', cost: 3, safe: true },
      'nil': { js: 'null', cost: 1, safe: true }
    });

    // JavaScript ↔ OCaml type mappings
    this.typeMap.set('js-ocaml', {
      'number': { ocaml: 'float', cost: 5, safe: true },
      'boolean': { ocaml: 'bool', cost: 2, safe: true },
      'string': { ocaml: 'string', cost: 10, safe: true },
      'object': { ocaml: 'record', cost: 20, safe: false },
      'array': { ocaml: 'array', cost: 15, safe: true },
      'int32': { ocaml: 'int', cost: 3, safe: true },
      'null': { ocaml: 'option', cost: 5, safe: true }
    });

    // Lua ↔ OCaml type mappings
    this.typeMap.set('lua-ocaml', {
      'number': { ocaml: 'float', cost: 5, safe: true },
      'boolean': { ocaml: 'bool', cost: 2, safe: true },
      'string': { ocaml: 'string', cost: 10, safe: true },
      'table': { ocaml: 'record', cost: 20, safe: false },
      'integer': { ocaml: 'int', cost: 3, safe: true },
      'nil': { ocaml: 'option', cost: 5, safe: true }
    });
  }

  /**
   * Main analysis entry point - analyzes type conversion opportunities
   * @param {Object} ir - Intermediate representation with type information
   * @returns {Object} Conversion strategy and recommendations
   */
  analyzeTypeConversion(ir) {
    if (!ir || typeof ir !== 'object') {
      throw new Error('Invalid IR provided');
    }

    const startTime = process.hrtime.bigint();
    const metrics = {
      totalTypeConversions: 0,
      safeConversions: 0,
      riskyConversions: 0,
      precisionPreserved: 0,
      estimatedReduction: 0,
      analysisTime: 0
    };

    const conversions = [];
    const strategyMap = new Map();

    // Extract type conversions from IR
    const typeOps = this._extractTypeOperations(ir);
    metrics.totalTypeConversions = typeOps.length;

    for (const op of typeOps) {
      // Validate conversion safety
      const safety = this._validateConversionSafety(op);
      
      if (safety.safe) {
        metrics.safeConversions++;
      } else {
        metrics.riskyConversions++;
      }

      // Assess precision preservation
      const precision = this._assessPrecisionPreservation(op);
      if (precision.preserved) {
        metrics.precisionPreserved++;
      }

      // Build conversion strategy
      const strategy = this._buildConversionStrategy(op, safety, precision);
      conversions.push({
        ...op,
        safety,
        precision,
        strategy,
        overhead: this._calculateConversionOverhead(op)
      });

      const key = `${op.source}-${op.target}`;
      if (!strategyMap.has(key)) {
        strategyMap.set(key, []);
      }
      strategyMap.get(key).push(strategy);
    }

    // Calculate estimated reduction
    metrics.estimatedReduction = this._calculateEstimatedReduction(conversions);

    const endTime = process.hrtime.bigint();
    metrics.analysisTime = Number(endTime - startTime) / 1000; // microseconds

    return {
      conversions,
      metrics,
      recommendations: this._buildRecommendations(conversions, strategyMap)
    };
  }

  /**
   * Extract type conversion operations from IR
   * @private
   */
  _extractTypeOperations(ir) {
    const ops = [];

    if (ir.typeConversions && Array.isArray(ir.typeConversions)) {
      ir.typeConversions.forEach(conv => {
        ops.push({
          id: conv.id || `conv-${ops.length}`,
          source: conv.source,
          sourceType: conv.sourceType,
          target: conv.target,
          targetType: conv.targetType,
          dataSize: conv.dataSize || 0,
          frequency: conv.frequency || 1,
          isCritical: conv.isCritical || false
        });
      });
    }

    if (ir.ffiCalls && Array.isArray(ir.ffiCalls)) {
      ir.ffiCalls.forEach((call, idx) => {
        if (call.parameters) {
          call.parameters.forEach((param, pIdx) => {
            ops.push({
              id: `ffi-${idx}-${pIdx}`,
              source: 'js',
              sourceType: param.type,
              target: call.target || 'lua',
              targetType: this._mapType(param.type, 'js', call.target || 'lua'),
              dataSize: this._estimateTypeSize(param.type),
              frequency: call.frequency || 1,
              isCritical: false
            });
          });
        }
      });
    }

    return ops;
  }

  /**
   * Map type from source to target language
   * @private
   */
  _mapType(type, sourceLanguage, targetLanguage) {
    const key = `${sourceLanguage}-${targetLanguage}`;
    const mappings = this.typeMap.get(key);

    if (!mappings || !mappings[type]) {
      // Fallback: return target language type or generic mapping
      return type;
    }

    const mapping = mappings[type];
    if (mapping.lua) return mapping.lua;
    if (mapping.js) return mapping.js;
    if (mapping.ocaml) return mapping.ocaml;

    return type;
  }

  /**
   * Estimate size of a data type
   * @private
   */
  _estimateTypeSize(type) {
    if (type.includes('int32')) return 4;
    if (type.includes('int64') || type.includes('float64')) return 8;
    if (type.includes('int16')) return 2;
    if (type.includes('int8') || type.includes('char')) return 1;
    if (type.includes('buffer') || type.includes('arraybuffer')) return 8192;
    if (type.includes('object')) return 4096;
    if (type.includes('array')) return 2048;
    return 256;
  }

  /**
   * Validate type conversion safety
   * @private
   */
  _validateConversionSafety(operation) {
    const cacheKey = `${operation.sourceType}-${operation.source}-${operation.target}`;
    
    if (this.safetyCache.has(cacheKey)) {
      return this.safetyCache.get(cacheKey);
    }

    const issues = [];
    const warnings = [];

    // Check for direct unsafe conversions
    const key = `${operation.source}-${operation.target}`;
    const mappings = this.typeMap.get(key);

    if (mappings && mappings[operation.sourceType]) {
      const mapping = mappings[operation.sourceType];
      
      if (!mapping.safe) {
        warnings.push(`Conversion of ${operation.sourceType} may require intermediate steps`);
      }
    } else {
      issues.push(`No mapping found for ${operation.sourceType} from ${operation.source} to ${operation.target}`);
    }

    // Check for numeric precision loss
    if ((operation.sourceType.includes('float') || operation.sourceType.includes('double')) &&
        (operation.targetType.includes('int'))) {
      warnings.push('Potential precision loss: float to integer conversion');
    }

    // Check for overflow risk
    if (operation.sourceType === 'uint32' && operation.targetType === 'int32') {
      warnings.push('Range overflow risk: uint32 to int32 conversion');
    }

    const safety = {
      safe: issues.length === 0,
      issues,
      warnings,
      riskLevel: issues.length > 0 ? 'high' : (warnings.length > 0 ? 'medium' : 'low')
    };

    this.safetyCache.set(cacheKey, safety);
    return safety;
  }

  /**
   * Assess precision preservation in conversion
   * @private
   */
  _assessPrecisionPreservation(operation) {
    const cacheKey = `prec-${operation.sourceType}-${operation.targetType}`;

    if (this.precisionMetrics.has(cacheKey)) {
      return this.precisionMetrics.get(cacheKey);
    }

    let preserved = true;
    let percentLoss = 0;

    // Analyze specific conversions
    if (operation.sourceType === 'float64' && operation.targetType === 'float32') {
      preserved = false;
      percentLoss = 0.01; // ~1 bit loss in mantissa
    } else if (operation.sourceType === 'uint64' && operation.targetType === 'int32') {
      preserved = false;
      percentLoss = 50; // Significant loss
    } else if (operation.sourceType === 'double' && operation.targetType === 'int') {
      preserved = false;
      percentLoss = 100; // Complete loss of fractional part
    } else if (operation.sourceType.includes('int') && operation.targetType.includes('int')) {
      // Integer to integer usually preserves if target is wider or equal
      if (this._getTypeWidth(operation.sourceType) <= this._getTypeWidth(operation.targetType)) {
        preserved = true;
        percentLoss = 0;
      }
    } else if (operation.sourceType === operation.targetType) {
      preserved = true;
      percentLoss = 0;
    }

    const result = {
      preserved,
      percentLoss,
      recommendation: preserved ? 'safe' : 'validate input range'
    };

    this.precisionMetrics.set(cacheKey, result);
    return result;
  }

  /**
   * Get bit width of a type
   * @private
   */
  _getTypeWidth(type) {
    if (type.includes('8')) return 8;
    if (type.includes('16')) return 16;
    if (type.includes('32')) return 32;
    if (type.includes('64')) return 64;
    if (type === 'int' || type === 'integer') return 32;
    if (type === 'float' || type === 'number') return 64;
    return 32;
  }

  /**
   * Build conversion strategy for an operation
   * @private
   */
  _buildConversionStrategy(operation, safety, precision) {
    if (safety.riskLevel === 'high') {
      return {
        approach: 'validate-before-convert',
        steps: [
          'Validate input range',
          'Apply range check',
          'Convert with bounds checking',
          'Validate output'
        ],
        overhead: 25 // microseconds
      };
    }

    if (safety.riskLevel === 'medium' || !precision.preserved) {
      return {
        approach: 'convert-with-check',
        steps: [
          'Check for edge cases',
          'Convert',
          'Verify result'
        ],
        overhead: 15
      };
    }

    return {
      approach: 'direct-convert',
      steps: [
        'Direct type cast'
      ],
      overhead: 5
    };
  }

  /**
   * Calculate conversion overhead
   * @private
   */
  _calculateConversionOverhead(operation) {
    const baseOverhead = 10; // 10µs base
    const typeComplexity = this._getTypeComplexity(operation.sourceType, operation.targetType);
    const frequencyFactor = Math.log(operation.frequency + 1);

    return baseOverhead + (typeComplexity * 5) + frequencyFactor;
  }

  /**
   * Get complexity score for type conversion
   * @private
   */
  _getTypeComplexity(sourceType, targetType) {
    // Simple types: low complexity
    const simpleTypes = ['int32', 'uint32', 'float64', 'boolean', 'nil', 'number'];
    
    if (simpleTypes.includes(sourceType) && simpleTypes.includes(targetType)) {
      return 1;
    }

    // Strings and enums: medium complexity
    if (sourceType === 'string' || targetType === 'string') {
      return 2;
    }

    // Objects/records/tables: high complexity
    if ((sourceType.includes('object') || sourceType.includes('table') || sourceType.includes('record')) &&
        (targetType.includes('object') || targetType.includes('table') || targetType.includes('record'))) {
      return 4;
    }

    // Mixed complexity
    return 2;
  }

  /**
   * Calculate estimated reduction from applying conversions
   * @private
   */
  _calculateEstimatedReduction(conversions) {
    if (conversions.length === 0) {
      return 0;
    }

    let totalReduction = 0;
    let safeCount = 0;

    for (const conv of conversions) {
      if (conv.safety.safe && conv.strategy.approach === 'direct-convert') {
        // Direct conversions can achieve ~15% reduction through optimization
        totalReduction += 15 * (conv.strategy.overhead / 25);
        safeCount++;
      } else if (conv.safety.riskLevel === 'medium') {
        // Medium-risk can achieve ~5% reduction
        totalReduction += 5 * (conv.strategy.overhead / 25);
      }
    }

    // Average reduction across all conversions
    const avgReduction = safeCount > 0 ? (totalReduction / conversions.length) : 0;
    
    // Cap at 10% target
    return Math.min(10, avgReduction);
  }

  /**
   * Build recommendations for type conversion strategy
   * @private
   */
  _buildRecommendations(conversions, strategyMap) {
    const recommendations = [];
    const safeCount = conversions.filter(c => c.safety.safe).length;
    const riskyCount = conversions.filter(c => !c.safety.safe).length;

    // Overall recommendation
    if (safeCount === conversions.length) {
      recommendations.push({
        priority: 'high',
        text: 'All conversions are type-safe. Proceed with optimization.',
        action: 'apply-direct-conversion'
      });
    } else if (riskyCount > 0 && safeCount > 0) {
      recommendations.push({
        priority: 'medium',
        text: `${riskyCount} risky conversions detected. Apply validation for these types.`,
        action: 'apply-selective-validation'
      });
    } else {
      recommendations.push({
        priority: 'high',
        text: 'All conversions require validation. Apply comprehensive checks.',
        action: 'apply-comprehensive-validation'
      });
    }

    // Precision recommendations
    const precisionRisk = conversions.filter(c => !c.precision.preserved).length;
    if (precisionRisk > 0) {
      recommendations.push({
        priority: 'medium',
        text: `${precisionRisk} conversions may lose precision. Verify acceptable.`,
        action: 'validate-precision-requirements'
      });
    }

    return recommendations;
  }

  /**
   * Get type mapping information
   * @param {string} source - Source language (js, lua, ocaml)
   * @param {string} target - Target language
   * @returns {Object} Type mapping details
   */
  getTypeMapping(source, target) {
    const key = `${source}-${target}`;
    return this.typeMap.get(key) || {};
  }

  /**
   * Validate a specific type conversion
   * @param {string} sourceType - Source type
   * @param {string} sourceLanguage - Source language
   * @param {string} targetLanguage - Target language
   * @returns {Object} Validation result
   */
  validateTypeConversion(sourceType, sourceLanguage, targetLanguage) {
    const key = `${sourceLanguage}-${targetLanguage}`;
    const mappings = this.typeMap.get(key);

    if (!mappings) {
      return {
        valid: false,
        error: `No mapping between ${sourceLanguage} and ${targetLanguage}`
      };
    }

    const mapping = mappings[sourceType];
    if (!mapping) {
      return {
        valid: false,
        error: `No conversion defined for ${sourceType} in ${key}`
      };
    }

    return {
      valid: true,
      targetType: Object.values(mapping)[0], // Get mapped type
      cost: mapping.cost,
      safe: mapping.safe
    };
  }

  /**
   * Clear caches (for cleanup/testing)
   */
  clearCaches() {
    this.conversionCache.clear();
    this.precisionMetrics.clear();
    this.safetyCache.clear();
  }

  /**
   * Get converter statistics
   * @returns {Object} Statistics
   */
  getStatistics() {
    return {
      typeMappingsAvailable: this.typeMap.size,
      safetyChecksCache: this.safetyCache.size,
      precisionMetricsCache: this.precisionMetrics.size,
      conversionCacheSize: this.conversionCache.size
    };
  }
}

module.exports = TypeConverter;
