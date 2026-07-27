/**
 * PHASE C CONCURRENCY VALIDATOR
 * Race condition detection, deadlock prevention, concurrency analysis
 * 
 * Responsibilities:
 * - Race condition detection (shared mutable state)
 * - Deadlock potential identification
 * - Lock order consistency checking
 * - Goroutine/coroutine leak detection
 * - Channel/promise pattern validation
 * - Concurrency primitive usage validation
 * - Synchronization requirement checking
 * 
 * Lines: 170
 */

class ConcurrencyValidator {
  constructor(sharedContext = {}) {
    this.context = sharedContext;
    this.sharedState = new Map(); // variable -> access info
    this.locks = new Map(); // lock -> usage info
    this.goroutines = new Set();
    this.channels = new Map();
    this.lockOrder = [];
    this.errors = [];
  }

  /**
   * Detect potential race conditions in code
   * @param {Object} ast - Abstract syntax tree
   * @returns {Array} - Race condition info
   */
  detectRaceConditions(ast) {
    const races = [];

    if (!ast || !ast.body) return races;

    // Scan for shared mutable state
    const sharedVars = this.findSharedState(ast);

    // Check for concurrent access patterns
    for (const [varName, accesses] of sharedVars) {
      if (accesses.length < 2) continue;

      // Check if accessed without synchronization
      const unsafeAccess = this.checkUnsynchronizedAccess(accesses);
      if (unsafeAccess.length > 1) {
        races.push({
          variable: varName,
          accesses: unsafeAccess.map((a, _i) => ({
            line: a.line,
            type: a.type, // read, write, modify
            thread: a.thread || "unknown"
          })),
          severity: this.calculateRaceSeverity(unsafeAccess),
          message: `Potential race condition on variable '${varName}'`
        });
      }
    }

    return races;
  }

  /**
   * Detect potential deadlock scenarios
   * @param {Object} concurrencyGraph - Lock dependency graph
   * @returns {Array} - Deadlock scenarios
   */
  detectPotentialDeadlocks(concurrencyGraph) {
    const deadlocks = [];

    if (!concurrencyGraph || !concurrencyGraph.locks) {
      return deadlocks;
    }

    // Find circular dependencies in lock acquisition
    const locks = concurrencyGraph.locks || [];
    const dependencies = this.buildLockDependencies(locks);

    for (const [lock, deps] of dependencies) {
      const cycle = this.findCycle(lock, deps, dependencies, new Set());
      if (cycle) {
        deadlocks.push({
          cycle: cycle,
          locks: cycle,
          message: `Potential deadlock: circular lock dependency ${cycle.join(" -> ")}`,
          severity: "critical"
        });
      }
    }

    // Check for nested lock inversions
    for (const lock of locks) {
      if (lock.nested && lock.nested.length > 0) {
        const outOfOrder = this.checkLockOrder(lock, locks);
        if (outOfOrder) {
          deadlocks.push({
            lock: lock.name,
            message: `Lock order violation: ${lock.name} acquired out of order`,
            severity: "high"
          });
        }
      }
    }

    return deadlocks;
  }

  /**
   * Validate channel/promise usage patterns
   * @param {Array} channelOps - Channel operations
   * @returns {Array} - Validation errors
   */
  validateChannelUsage(channelOps) {
    const errors = [];

    if (!Array.isArray(channelOps)) return errors;

    const channels = new Map(); // channel -> operations

    for (const op of channelOps) {
      if (!op.channel) continue;

      if (!channels.has(op.channel)) {
        channels.set(op.channel, []);
      }
      channels.get(op.channel).push(op);
    }

    // Check each channel
    for (const [channelName, ops] of channels) {
      // Check for send on closed channel
      let closed = false;
      for (const op of ops) {
        if (op.type === "close") {
          closed = true;
        } else if (op.type === "send" && closed) {
          errors.push({
            type: "SendOnClosedChannel",
            channel: channelName,
            line: op.line,
            message: `Sending on closed channel '${channelName}'`
          });
        }
      }

      // Check for receive from nil channel
      if (channelName.includes("nil")) {
        errors.push({
          type: "ReceiveFromNilChannel",
          channel: channelName,
          message: "Attempting to receive from nil channel"
        });
      }
    }

    return errors;
  }

  /**
   * Check for goroutine/coroutine leaks
   * @param {Array} coroutines - Coroutine definitions
   * @returns {Array} - Leak info
   */
  checkCoroutineLeaks(coroutines) {
    const leaks = [];

    if (!Array.isArray(coroutines)) return leaks;

    const launched = new Set();
    const finished = new Set();

    for (const coro of coroutines) {
      if (coro.type === "launch" || coro.type === "go") {
        launched.add(coro.id || coro.name);
      } else if (coro.type === "join" || coro.type === "await") {
        finished.add(coro.target);
      } else if (coro.type === "cancel") {
        finished.add(coro.target);
      }
    }

    // Find launched coroutines that are never joined
    for (const coroId of launched) {
      if (!finished.has(coroId)) {
        leaks.push({
          coroutine: coroId,
          type: "CoroutineLeak",
          message: `Coroutine '${coroId}' launched but never joined/awaited`,
          severity: "warning"
        });
      }
    }

    return leaks;
  }

  /**
   * Validate lock ordering consistency
   * @param {Array} locks - Lock operations
   * @returns {Array} - Violations
   */
  validateLockOrdering(locks) {
    const violations = [];

    if (!Array.isArray(locks)) return violations;

    const threadLockOrder = new Map(); // thread -> lock sequence

    for (const lock of locks) {
      if (!lock.thread) continue;

      if (!threadLockOrder.has(lock.thread)) {
        threadLockOrder.set(lock.thread, []);
      }

      const order = threadLockOrder.get(lock.thread);
      const op = lock.operation || "acquire";

      if (op === "acquire" || op === "lock") {
        // Check if lock was already acquired by this thread (non-reentrant)
        if (order.includes(lock.name)) {
          violations.push({
            type: "DeadlockRisk",
            lock: lock.name,
            thread: lock.thread,
            line: lock.line,
            message: `Non-reentrant lock '${lock.name}' acquired twice by thread ${lock.thread}`
          });
        }
        order.push(lock.name);
      } else if (op === "release" || op === "unlock") {
        const idx = order.lastIndexOf(lock.name);
        if (idx === -1) {
          violations.push({
            type: "LockNotAcquired",
            lock: lock.name,
            thread: lock.thread,
            line: lock.line,
            message: `Releasing lock '${lock.name}' that was not acquired`
          });
        } else {
          order.splice(idx, 1);
        }
      }
    }

    return violations;
  }

  /**
   * INTERNAL: Find shared mutable state
   */
  findSharedState(ast) {
    const shared = new Map();

    const visit = (node) => {
      if (!node) return;

      if (node.type === "VariableDeclaration") {
        const name = node.id?.name;
        if (name && !node.isConst && !node.isImmutable) {
          if (!shared.has(name)) {
            shared.set(name, []);
          }
        }
      } else if (node.type === "AssignmentExpression" || node.type === "UpdateExpression") {
        const name = node.left?.name || node.argument?.name;
        if (name && shared.has(name)) {
          shared.get(name).push({
            type: node.type === "UpdateExpression" ? "modify" : "write",
            line: node.loc?.start?.line
          });
        }
      } else if (node.type === "Identifier" && node.parent?.type !== "VariableDeclaration") {
        if (shared.has(node.name)) {
          shared.get(node.name).push({
            type: "read",
            line: node.loc?.start?.line
          });
        }
      }

      for (const key in node) {
        if (key !== "loc" && typeof node[key] === "object") {
          if (Array.isArray(node[key])) {
            for (const child of node[key]) {
              if (child && child.type) visit(child);
            }
          } else if (node[key].type) {
            visit(node[key]);
          }
        }
      }
    };

    if (ast.body) {
      for (const stmt of ast.body) {
        visit(stmt);
      }
    }

    return shared;
  }

  /**
   * INTERNAL: Check for unsynchronized access
   */
  checkUnsynchronizedAccess(accesses) {
    return accesses.filter(a => !a.synchronized);
  }

  /**
   * INTERNAL: Calculate race severity
   */
  calculateRaceSeverity(accesses) {
    const hasWrite = accesses.some(a => a.type === "write" || a.type === "modify");
    return hasWrite ? "critical" : "warning";
  }

  /**
   * INTERNAL: Build lock dependencies
   */
  buildLockDependencies(locks) {
    const deps = new Map();
    for (const lock of locks) {
      if (!deps.has(lock.name)) {
        deps.set(lock.name, []);
      }
      if (lock.acquiresBefore) {
        deps.get(lock.name).push(...lock.acquiresBefore);
      }
    }
    return deps;
  }

  /**
   * INTERNAL: Find cycle in dependencies
   */
  findCycle(start, deps, allDeps, visited) {
    if (visited.has(start)) return null;
    visited.add(start);

    for (const dep of (deps || [])) {
      if (dep === start) {
        return [start, dep];
      }
      const cycle = this.findCycle(dep, allDeps.get(dep), allDeps, new Set(visited));
      if (cycle) {
        return [start, ...cycle];
      }
    }

    return null;
  }

  /**
   * INTERNAL: Check lock order
   */
  checkLockOrder(lock, allLocks) {
    if (!lock.nested) return false;

    const lockIndex = allLocks.findIndex(l => l.name === lock.name);
    for (const nested of lock.nested) {
      const nestedIndex = allLocks.findIndex(l => l.name === nested);
      if (nestedIndex !== -1 && nestedIndex < lockIndex) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get all errors
   */
  getErrors() {
    return this.errors;
  }

  /**
   * Clear state
   */
  clear() {
    this.errors = [];
    this.sharedState.clear();
    this.locks.clear();
    this.goroutines.clear();
    this.channels.clear();
  }
}

module.exports = ConcurrencyValidator;
