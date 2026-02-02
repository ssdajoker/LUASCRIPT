/**
 * Marshaling Optimizer - Phase 3.5 Task 5.3
 * 
 * Optimizes data structure conversion across language boundaries.
 * Implements zero-copy detection, buffer pooling, and shared memory optimization.
 * 
 * Performance targets:
 * - Achieve 15% overhead reduction through marshaling efficiency
 * - Zero-copy detection for compatible types
 * - Buffer pooling reduces allocation overhead by 30%
 * - Deterministic results across identical runs
 */

class MarshalingOptimizer {
  constructor() {
    this.bufferPool = [];
    this.typeCache = new Map();
    this.allocationStats = new Map();
    this.detectionCache = new Map();
  }

  /**
   * Main analysis entry point - analyzes marshaling opportunities
   * @param {Object} ir - Intermediate representation
   * @returns {Object} Optimization report
   */
  analyzeMarshaling(ir) {
    if (!ir || typeof ir !== 'object') {
      throw new Error('Invalid IR provided');
    }

    const startTime = process.hrtime.bigint();
    const opportunities = [];
    const metrics = {
      totalCalls: 0,
      zeroCopyCandidates: 0,
      bufferPoolable: 0,
      sharedMemoryOptimal: 0,
      estimatedReduction: 0,
      analysisTime: 0
    };

    // Collect all marshaling calls from FFI interface
    const marshalingCalls = this._extractMarshalingCalls(ir);
    metrics.totalCalls = marshalingCalls.length;

    // Detect zero-copy opportunities
    const zeroCopyOps = this._detectZeroCopyOpportunities(marshalingCalls);
    metrics.zeroCopyCandidates = zeroCopyOps.length;
    opportunities.push(...zeroCopyOps);

    // Detect buffer pooling opportunities
    const poolOps = this._detectBufferPoolingOpportunities(marshalingCalls);
    metrics.bufferPoolable = poolOps.length;
    opportunities.push(...poolOps);

    // Detect shared memory optimization opportunities
    const sharedMemOps = this._detectSharedMemoryOpportunities(marshalingCalls);
    metrics.sharedMemoryOptimal = sharedMemOps.length;
    opportunities.push(...sharedMemOps);

    // Calculate estimated overhead reduction
    metrics.estimatedReduction = this._calculateEstimatedReduction(opportunities);

    const endTime = process.hrtime.bigint();
    metrics.analysisTime = Number(endTime - startTime) / 1000; // Convert to microseconds

    return {
      opportunities,
      metrics,
      strategy: this._buildOptimizationStrategy(opportunities)
    };
  }

  /**
   * Extract marshaling calls from IR
   * @private
   */
  _extractMarshalingCalls(ir) {
    const calls = [];

    if (ir.ffiCalls) {
      ir.ffiCalls.forEach(call => {
        if (call.parameters && call.parameters.length > 0) {
          call.parameters.forEach((param, idx) => {
            calls.push({
              callId: call.id,
              paramIndex: idx,
              paramName: param.name,
              paramType: param.type,
              paramSize: this._estimateTypeSize(param.type),
              isArray: param.type.includes('[]'),
              isObject: param.type.includes('{}'),
              direction: param.direction || 'in',
              frequency: call.frequency || 1
            });
          });
        }
      });
    }

    return calls;
  }

  /**
   * Detect zero-copy opportunities - identifies types that can be passed directly
   * @private
   */
  _detectZeroCopyOpportunities(calls) {
    const opportunities = [];
    const zeroCopyTypes = new Set([
      'int32', 'uint32', 'int64', 'uint64',
      'float32', 'float64',
      'buffer', 'arraybuffer',
      'typed_array'
    ]);

    for (const call of calls) {
      const cacheKey = `zero-copy-${call.paramType}`;
      
      if (this.detectionCache.has(cacheKey)) {
        if (this.detectionCache.get(cacheKey)) {
          opportunities.push({
            type: 'zero-copy',
            paramType: call.paramType,
            paramName: call.paramName,
            reduction: 50, // 50% overhead reduction for zero-copy
            safety: 'safe',
            applicability: this._assessZeroCopySafety(call)
          });
        }
        continue;
      }

      if (zeroCopyTypes.has(call.paramType) && !call.isArray && !call.isObject) {
        const isSafe = this._assessZeroCopySafety(call);
        if (isSafe) {
          this.detectionCache.set(cacheKey, true);
          opportunities.push({
            type: 'zero-copy',
            paramType: call.paramType,
            paramName: call.paramName,
            reduction: 50,
            safety: 'safe',
            applicability: 100
          });
        }
      } else if (call.paramType === 'buffer' || call.paramType === 'arraybuffer') {
        this.detectionCache.set(cacheKey, true);
        opportunities.push({
          type: 'zero-copy',
          paramType: call.paramType,
          paramName: call.paramName,
          reduction: 60, // Even better for buffers
          safety: 'safe',
          applicability: 100
        });
      } else {
        this.detectionCache.set(cacheKey, false);
      }
    }

    return opportunities;
  }

  /**
   * Assess safety of zero-copy marshaling
   * @private
   */
  _assessZeroCopySafety(call) {
    // Cannot do zero-copy if:
    // 1. Type requires endianness conversion
    // 2. Type requires padding/alignment adjustment
    // 3. Bidirectional transfer (in/out)

    if (call.direction === 'inout') {
      return false;
    }

    if (call.paramType.includes('endian')) {
      return false;
    }

    // Types that are safe for zero-copy
    const safeTypes = ['int32', 'uint32', 'float64', 'buffer', 'arraybuffer', 'typed_array'];
    return safeTypes.includes(call.paramType);
  }

  /**
   * Detect buffer pooling opportunities
   * @private
   */
  _detectBufferPoolingOpportunities(calls) {
    const opportunities = [];
    const poolableTypes = new Map();

    for (const call of calls) {
      // Buffer pooling is beneficial for arrays and objects
      // or any call with high frequency
      const isPoolable = (call.isArray || call.isObject) || call.frequency > 5;

      if (isPoolable) {
        if (!poolableTypes.has(call.paramType)) {
          poolableTypes.set(call.paramType, []);
        }
        poolableTypes.get(call.paramType).push(call);
      }
    }

    for (const [type, callList] of poolableTypes) {
      if (callList.length >= 2) {
        // Only recommend pooling if there are multiple candidates
        opportunities.push({
          type: 'buffer-pooling',
          paramType: type,
          candidates: callList.length,
          reduction: 30, // 30% reduction through pooling
          poolSize: Math.max(...callList.map(c => c.paramSize)),
          allocationSaved: callList.length - 1,
          applicability: Math.min(100, callList.length * 20)
        });
      }
    }

    return opportunities;
  }

  /**
   * Detect shared memory optimization opportunities
   * @private
   */
  _detectSharedMemoryOpportunities(calls) {
    const opportunities = [];
    const frequentTypes = new Map();

    for (const call of calls) {
      const key = `${call.paramType}-${call.paramSize}`;
      if (!frequentTypes.has(key)) {
        frequentTypes.set(key, { count: 0, totalFrequency: 0, examples: [] });
      }

      const entry = frequentTypes.get(key);
      entry.count++;
      entry.totalFrequency += call.frequency;
      entry.examples.push(call);
    }

    for (const [key, data] of frequentTypes) {
      // Shared memory is worthwhile if:
      // 1. Type is large (> 2KB)
      // 2. Called frequently (> 10 times)
      // 3. Multiple instances would benefit

      const [paramType, sizeStr] = key.split('-');
      const size = parseInt(sizeStr, 10);

      if (size > 2048 && data.totalFrequency > 10 && data.count >= 2) {
        opportunities.push({
          type: 'shared-memory',
          paramType: paramType,
          instances: data.count,
          totalFrequency: data.totalFrequency,
          size: size,
          reduction: 45, // 45% reduction through shared memory
          allocationsEliminated: Math.floor(data.totalFrequency * 0.8),
          applicability: Math.min(100, data.totalFrequency * 5)
        });
      }
    }

    return opportunities;
  }

  /**
   * Calculate estimated overhead reduction
   * @private
   */
  _calculateEstimatedReduction(opportunities) {
    if (opportunities.length === 0) {
      return 0;
    }

    // Reduction calculation: compound effect of multiple optimizations
    let totalReduction = 0;
    let maxReduction = 100;

    for (const opp of opportunities) {
      const weight = opp.applicability / 100;
      const effect = opp.reduction * weight;
      totalReduction += effect * 0.3; // Conservative multiplier (30% per optimization)
    }

    // Cap at 50% total reduction (realistic limit)
    return Math.min(50, totalReduction);
  }

  /**
   * Estimate size of a data type
   * @private
   */
  _estimateTypeSize(type) {
    if (type.includes('int32') || type.includes('float32')) return 4;
    if (type.includes('int64') || type.includes('float64') || type.includes('double')) return 8;
    if (type.includes('int16') || type.includes('short')) return 2;
    if (type.includes('int8') || type.includes('char')) return 1;
    if (type.includes('buffer') || type.includes('arraybuffer')) return 8192; // Assume 8KB
    if (type.includes('object') || type.includes('{}')) return 4096; // Assume 4KB
    if (type.includes('[]')) return 2048; // Assume 2KB array
    return 256; // Default fallback
  }

  /**
   * Build optimization strategy from opportunities
   * @private
   */
  _buildOptimizationStrategy(opportunities) {
    const strategy = {
      prioritized: [],
      estimatedImpact: 'moderate'
    };

    // Sort by reduction percentage (highest first)
    const sorted = [...opportunities].sort((a, b) => b.reduction - a.reduction);

    // Take top 3 optimizations
    strategy.prioritized = sorted.slice(0, 3).map(opp => ({
      type: opp.type,
      description: this._getStrategyDescription(opp.type),
      targetType: opp.paramType || opp.type,
      expectedReduction: opp.reduction
    }));

    // Estimate overall impact
    const avgReduction = sorted.reduce((sum, opp) => sum + opp.reduction, 0) / sorted.length;
    if (avgReduction > 40) {
      strategy.estimatedImpact = 'high';
    } else if (avgReduction > 25) {
      strategy.estimatedImpact = 'moderate';
    } else {
      strategy.estimatedImpact = 'low';
    }

    return strategy;
  }

  /**
   * Get human-readable description of strategy
   * @private
   */
  _getStrategyDescription(type) {
    const descriptions = {
      'zero-copy': 'Pass compatible types directly without copying',
      'buffer-pooling': 'Reuse pre-allocated buffers for frequent transfers',
      'shared-memory': 'Use shared memory regions for large, frequent data'
    };
    return descriptions[type] || 'Apply optimization strategy';
  }

  /**
   * Calculate marshaling overhead
   * @param {number} dataSize - Size of data to marshal
   * @returns {Object} Overhead breakdown
   */
  calculateMarshalingOverhead(dataSize) {
    if (dataSize <= 0) {
      throw new Error('Data size must be positive');
    }

    const baseOverhead = 50; // 50 microseconds base
    const copyOverhead = Math.ceil(dataSize / 1024) * 10; // 10µs per KB
    const conversionOverhead = 20; // 20 microseconds for type conversion

    return {
      baseOverhead,
      copyOverhead,
      conversionOverhead,
      totalOverhead: baseOverhead + copyOverhead + conversionOverhead,
      dataSize
    };
  }

  /**
   * Estimate reduction from applying optimizations
   * @param {number} originalOverhead - Original overhead
   * @param {Array} optimizations - Optimizations to apply
   * @returns {Object} Reduction analysis
   */
  estimateReductionImpact(originalOverhead, optimizations = []) {
    if (originalOverhead <= 0) {
      throw new Error('Original overhead must be positive');
    }

    let reducedOverhead = originalOverhead;

    for (const opt of optimizations) {
      if (opt.reduction && opt.reduction > 0) {
        reducedOverhead *= (1 - opt.reduction / 100);
      }
    }

    return {
      originalOverhead,
      reducedOverhead,
      absoluteReduction: Math.round(originalOverhead - reducedOverhead),
      percentageReduction: Math.round(((originalOverhead - reducedOverhead) / originalOverhead) * 100)
    };
  }

  /**
   * Validate marshaling safety
   * @param {Object} marshalingOp - Marshaling operation
   * @returns {Object} Safety assessment
   */
  validateMarshalingSafety(marshalingOp) {
    if (!marshalingOp || typeof marshalingOp !== 'object') {
      throw new Error('Invalid marshaling operation');
    }

    const issues = [];
    const warnings = [];

    // Check for type compatibility
    if (!marshalingOp.sourceType || !marshalingOp.targetType) {
      issues.push('Missing type information');
    }

    // Check for alignment issues
    if (marshalingOp.alignment && marshalingOp.alignment < 4) {
      warnings.push('Suboptimal alignment detected');
    }

    // Check for endianness mismatch
    if (marshalingOp.sourceEndian && marshalingOp.targetEndian) {
      if (marshalingOp.sourceEndian !== marshalingOp.targetEndian) {
        warnings.push('Endianness conversion required');
      }
    }

    return {
      safe: issues.length === 0,
      issues,
      warnings,
      recommendation: issues.length === 0 ? 'Proceed with optimization' : 'Review issues before proceeding'
    };
  }

  /**
   * Clear buffer pool (for cleanup/testing)
   */
  clearBufferPool() {
    this.bufferPool = [];
    this.allocationStats.clear();
  }

  /**
   * Get optimizer statistics
   * @returns {Object} Statistics summary
   */
  getStatistics() {
    return {
      cachedDetections: this.detectionCache.size,
      poolSize: this.bufferPool.length,
      allocationStatistics: Array.from(this.allocationStats.entries())
    };
  }
}

module.exports = MarshalingOptimizer;
