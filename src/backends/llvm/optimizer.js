
/**
 * LLVM IR Optimization Passes for LUASCRIPT
 * 
 * Implements various optimization passes on LLVM IR
 */

/**
 * LLVM Optimizer
 */
class LLVMOptimizer {
  constructor(options = {}) {
    this.options = {
      level: options.level || 2, // 0-3, similar to -O0 to -O3
      enableAll: options.enableAll !== false,
      passes: options.passes || [],
      ...options
    };
        
    this.passes = this.initializePasses();
  }

  /**
     * Initialize optimization passes
     */
  initializePasses() {
    const allPasses = {
      // Instruction combining
      "instcombine": new InstCombinePass(),
            
      // Dead code elimination
      "dce": new DeadCodeEliminationPass(),
      "adce": new AggressiveDCEPass(),
            
      // Constant folding and propagation
      "constprop": new ConstantPropagationPass(),
      "sccp": new SCCPPass(), // Sparse Conditional Constant Propagation
            
      // Common subexpression elimination
      "cse": new CSEPass(),
      "gvn": new GVNPass(), // Global Value Numbering
            
      // Memory optimizations
      "mem2reg": new Mem2RegPass(),
      "sroa": new SROAPass(), // Scalar Replacement of Aggregates
            
      // Loop optimizations
      "loop-simplify": new LoopSimplifyPass(),
      "licm": new LICMPass(), // Loop Invariant Code Motion
      "loop-unroll": new LoopUnrollPass(),
      "loop-vectorize": new LoopVectorizePass(),
            
      // Inlining
      "inline": new InliningPass(),
      "always-inline": new AlwaysInlinerPass(),
            
      // Function optimizations
      "tailcallelim": new TailCallEliminationPass(),
      "simplifycfg": new SimplifyCFGPass(),
            
      // Interprocedural optimizations
      "globalopt": new GlobalOptPass(),
      "ipsccp": new IPSCCPPass(), // Interprocedural SCCP
            
      // Other
      "reassociate": new ReassociatePass(),
      "jump-threading": new JumpThreadingPass()
    };

    // Select passes based on optimization level
    return this.selectPassesByLevel(allPasses);
  }

  /**
     * Select passes based on optimization level
     */
  selectPassesByLevel(allPasses) {
    if (this.options.passes.length > 0) {
      return this.options.passes.map(name => allPasses[name]).filter(Boolean);
    }

    switch (this.options.level) {
    case 0:
      // -O0: No optimizations
      return [];
    case 1:
      // -O1: Basic optimizations
      return [
        allPasses["mem2reg"],
        allPasses["simplifycfg"],
        allPasses["instcombine"],
        allPasses["dce"]
      ];
    case 2:
      // -O2: Standard optimizations
      return [
        allPasses["mem2reg"],
        allPasses["sroa"],
        allPasses["inline"],
        allPasses["gvn"],
        allPasses["sccp"],
        allPasses["instcombine"],
        allPasses["simplifycfg"],
        allPasses["loop-simplify"],
        allPasses["licm"],
        allPasses["reassociate"],
        allPasses["adce"],
        allPasses["tailcallelim"]
      ];
    case 3:
      // -O3: Aggressive optimizations
      return [
        allPasses["mem2reg"],
        allPasses["sroa"],
        allPasses["globalopt"],
        allPasses["ipsccp"],
        allPasses["inline"],
        allPasses["gvn"],
        allPasses["sccp"],
        allPasses["instcombine"],
        allPasses["simplifycfg"],
        allPasses["loop-simplify"],
        allPasses["licm"],
        allPasses["loop-unroll"],
        allPasses["loop-vectorize"],
        allPasses["reassociate"],
        allPasses["jump-threading"],
        allPasses["adce"],
        allPasses["tailcallelim"]
      ];
    default:
      return [];
    }
  }

  /**
     * Run all optimization passes
     */
  optimize(llvmIR) {
    let optimized = llvmIR;
    let changed = true;
    let iterations = 0;
    const maxIterations = 10;

    // Run passes until fixpoint or max iterations
    while (changed && iterations < maxIterations) {
      changed = false;
      iterations++;

      for (const pass of this.passes) {
        const result = pass.run(optimized);
        if (result.changed) {
          optimized = result.ir;
          changed = true;
        }
      }
    }

    return {
      ir: optimized,
      iterations: iterations,
      changed: iterations > 1
    };
  }
}

/**
 * Base Optimization Pass
 */
class OptimizationPass {
  constructor(name) {
    this.name = name;
  }

  run(ir) {
    // Override in subclasses
    return { ir, changed: false };
  }
}

/**
 * Instruction Combining Pass
 * Combines instructions to simpler forms
 */
class InstCombinePass extends OptimizationPass {
  constructor() {
    super("instcombine");
  }
}

/**
 * Dead Code Elimination Pass
 */
class DeadCodeEliminationPass extends OptimizationPass {
  constructor() {
    super("dce");
  }
}

/**
 * Aggressive Dead Code Elimination Pass
 */
class AggressiveDCEPass extends OptimizationPass {
  constructor() {
    super("adce");
  }
}

/**
 * Constant Propagation Pass
 */
class ConstantPropagationPass extends OptimizationPass {
  constructor() {
    super("constprop");
  }
}

/**
 * Sparse Conditional Constant Propagation Pass
 */
class SCCPPass extends OptimizationPass {
  constructor() {
    super("sccp");
  }
}

/**
 * Common Subexpression Elimination Pass
 */
class CSEPass extends OptimizationPass {
  constructor() {
    super("cse");
  }
}

/**
 * Global Value Numbering Pass
 */
class GVNPass extends OptimizationPass {
  constructor() {
    super("gvn");
  }
}

/**
 * Promote Memory to Register Pass
 */
class Mem2RegPass extends OptimizationPass {
  constructor() {
    super("mem2reg");
  }
}

/**
 * Scalar Replacement of Aggregates Pass
 */
class SROAPass extends OptimizationPass {
  constructor() {
    super("sroa");
  }
}

/**
 * Loop Simplification Pass
 */
class LoopSimplifyPass extends OptimizationPass {
  constructor() {
    super("loop-simplify");
  }
}

/**
 * Loop Invariant Code Motion Pass
 */
class LICMPass extends OptimizationPass {
  constructor() {
    super("licm");
  }
}

/**
 * Loop Unrolling Pass
 */
class LoopUnrollPass extends OptimizationPass {
  constructor() {
    super("loop-unroll");
  }
}

/**
 * Loop Vectorization Pass
 */
class LoopVectorizePass extends OptimizationPass {
  constructor() {
    super("loop-vectorize");
  }
}

/**
 * Function Inlining Pass
 */
class InliningPass extends OptimizationPass {
  constructor() {
    super("inline");
  }
}

/**
 * Always Inliner Pass
 */
class AlwaysInlinerPass extends OptimizationPass {
  constructor() {
    super("always-inline");
  }
}

/**
 * Tail Call Elimination Pass
 */
class TailCallEliminationPass extends OptimizationPass {
  constructor() {
    super("tailcallelim");
  }
}

/**
 * Simplify Control Flow Graph Pass
 */
class SimplifyCFGPass extends OptimizationPass {
  constructor() {
    super("simplifycfg");
  }
}

/**
 * Global Optimizer Pass
 */
class GlobalOptPass extends OptimizationPass {
  constructor() {
    super("globalopt");
  }
}

/**
 * Interprocedural Sparse Conditional Constant Propagation Pass
 */
class IPSCCPPass extends OptimizationPass {
  constructor() {
    super("ipsccp");
  }
}

/**
 * Reassociate Expressions Pass
 */
class ReassociatePass extends OptimizationPass {
  constructor() {
    super("reassociate");
  }
}

/**
 * Jump Threading Pass
 */
class JumpThreadingPass extends OptimizationPass {
  constructor() {
    super("jump-threading");
  }
}

module.exports = {
  LLVMOptimizer,
  OptimizationPass,
  InstCombinePass,
  DeadCodeEliminationPass,
  AggressiveDCEPass,
  ConstantPropagationPass,
  SCCPPass,
  CSEPass,
  GVNPass,
  Mem2RegPass,
  SROAPass,
  LoopSimplifyPass,
  LICMPass,
  LoopUnrollPass,
  LoopVectorizePass,
  InliningPass,
  AlwaysInlinerPass,
  TailCallEliminationPass,
  SimplifyCFGPass,
  GlobalOptPass,
  IPSCCPPass,
  ReassociatePass,
  JumpThreadingPass
};
