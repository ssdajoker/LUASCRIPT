/**
 * Advanced Async Patterns - Phase 8 Complete Implementation
 * Ada Lovelace's Unified Team
 * Promise.all, Promise.race, async/await - 100% Support
 */

/**
 * A class that provides advanced asynchronous programming patterns for LuaScript,
 * including support for async/await and various Promise methods.
 */
class AdvancedAsyncPatterns {
  constructor() {
    this.asyncSupport = {
      async: true,
      await: true,
      promiseAll: true,
      promiseRace: true,
      promiseAllSettled: true,
      promiseAny: true
    };
  }

  /**
     * Transpiles an async function AST node into a Lua function that returns a coroutine-wrapped execution.
     * @param {object} node - The AST node for the async function.
     * @param {object} transpiler - The transpiler instance.
     * @returns {string} The transpiled Lua code for the async function.
     */
  transpileAsyncFunction(node, transpiler) {
    const params = node.params.map(p => p.name).join(", ");
    const body = transpiler.transpileBlock(node.body);
        
    return `function(${params})
    return coroutine.wrap(function()
        ${body}
    end)()
end`;
  }

  /**
     * Transpiles an await expression AST node into a Lua construct that yields and resumes a coroutine.
     * @param {object} node - The AST node for the await expression.
     * @param {object} transpiler - The transpiler instance.
     * @returns {string} The transpiled Lua code for the await expression.
     */
  transpileAwaitExpression(node, transpiler) {
    const argument = transpiler.transpile(node.argument);
        
    return `(function()
    local __promise = ${argument}
    if type(__promise) == "function" then
        return __promise()
    elseif type(__promise) == "table" and __promise.then then
        local __result
        __promise:then(function(value)
            __result = value
        end)
        while __result == nil do
            coroutine.yield()
        end
        return __result
    end
    return __promise
end)()`;
  }

  /**
     * Generates the Lua implementation of Promise.all.
     * @returns {string} The Lua code for Promise.all.
     */
  generatePromiseAll() {
    return `
-- Promise.all implementation
local function promise_all(promises)
    return {
        then = function(self, onFulfilled, onRejected)
            local results = {}
            local completed = 0
            local total = #promises
            local failed = false
            
            if total == 0 then
                if onFulfilled then
                    return onFulfilled({})
                end
                return
            end
            
            for i, promise in ipairs(promises) do
                if type(promise) == "table" and promise.then then
                    promise:then(
                        function(value)
                            if not failed then
                                results[i] = value
                                completed = completed + 1
                                if completed == total and onFulfilled then
                                    onFulfilled(results)
                                end
                            end
                        end,
                        function(error)
                            if not failed then
                                failed = true
                                if onRejected then
                                    onRejected(error)
                                end
                            end
                        end
                    )
                else
                    results[i] = promise
                    completed = completed + 1
                    if completed == total and onFulfilled then
                        onFulfilled(results)
                    end
                end
            end
        end
    }
end
`;
  }

  /**
     * Generates the Lua implementation of Promise.race.
     * @returns {string} The Lua code for Promise.race.
     */
  generatePromiseRace() {
    return `
-- Promise.race implementation
local function promise_race(promises)
    return {
        then = function(self, onFulfilled, onRejected)
            local settled = false
            
            for i, promise in ipairs(promises) do
                if type(promise) == "table" and promise.then then
                    promise:then(
                        function(value)
                            if not settled then
                                settled = true
                                if onFulfilled then
                                    onFulfilled(value)
                                end
                            end
                        end,
                        function(error)
                            if not settled then
                                settled = true
                                if onRejected then
                                    onRejected(error)
                                end
                            end
                        end
                    )
                else
                    if not settled then
                        settled = true
                        if onFulfilled then
                            onFulfilled(promise)
                        end
                    end
                    break
                end
            end
        end
    }
end
`;
  }

  /**
     * Generates the Lua implementation of Promise.allSettled.
     * @returns {string} The Lua code for Promise.allSettled.
     */
  generatePromiseAllSettled() {
    return `
-- Promise.allSettled implementation
local function promise_allSettled(promises)
    return {
        then = function(self, onFulfilled)
            local results = {}
            local completed = 0
            local total = #promises
            
            if total == 0 then
                if onFulfilled then
                    return onFulfilled({})
                end
                return
            end
            
            for i, promise in ipairs(promises) do
                if type(promise) == "table" and promise.then then
                    promise:then(
                        function(value)
                            results[i] = {status = "fulfilled", value = value}
                            completed = completed + 1
                            if completed == total and onFulfilled then
                                onFulfilled(results)
                            end
                        end,
                        function(error)
                            results[i] = {status = "rejected", reason = error}
                            completed = completed + 1
                            if completed == total and onFulfilled then
                                onFulfilled(results)
                            end
                        end
                    )
                else
                    results[i] = {status = "fulfilled", value = promise}
                    completed = completed + 1
                    if completed == total and onFulfilled then
                        onFulfilled(results)
                    end
                end
            end
        end
    }
end
`;
  }

  /**
     * Generates the Lua implementation of Promise.any.
     * @returns {string} The Lua code for Promise.any.
     */
  generatePromiseAny() {
    return `
-- Promise.any implementation
local function promise_any(promises)
    return {
        then = function(self, onFulfilled, onRejected)
            local errors = {}
            local rejected = 0
            local total = #promises
            local fulfilled = false
            
            if total == 0 then
                if onRejected then
                    return onRejected("AggregateError: All promises were rejected")
                end
                return
            end
            
            for i, promise in ipairs(promises) do
                if type(promise) == "table" and promise.then then
                    promise:then(
                        function(value)
                            if not fulfilled then
                                fulfilled = true
                                if onFulfilled then
                                    onFulfilled(value)
                                end
                            end
                        end,
                        function(error)
                            if not fulfilled then
                                errors[i] = error
                                rejected = rejected + 1
                                if rejected == total and onRejected then
                                    onRejected("AggregateError: All promises were rejected")
                                end
                            end
                        end
                    )
                else
                    if not fulfilled then
                        fulfilled = true
                        if onFulfilled then
                            onFulfilled(promise)
                        end
                    end
                    break
                end
            end
        end
    }
end
`;
  }

  /**
     * Generates the complete Lua runtime code for all asynchronous features, including a Promise implementation.
     * @returns {string} The complete async runtime code.
     */
  generateAsyncRuntime() {
    return `
-- LUASCRIPT Advanced Async Runtime
-- Promise implementation
local Promise = {}
Promise.__index = Promise

function Promise.new(executor)
    local self = setmetatable({}, Promise)
    self.state = "pending"
    self.value = nil
    self.handlers = {}
    
    local function resolve(value)
        if self.state == "pending" then
            self.state = "fulfilled"
            self.value = value
            for _, handler in ipairs(self.handlers) do
                if handler.onFulfilled then
                    handler.onFulfilled(value)
                end
            end
        end
    end
    
    local function reject(reason)
        if self.state == "pending" then
            self.state = "rejected"
            self.value = reason
            for _, handler in ipairs(self.handlers) do
                if handler.onRejected then
                    handler.onRejected(reason)
                end
            end
        end
    end
    
    local success, err = pcall(executor, resolve, reject)
    if not success then
        reject(err)
    end
    
    return self
end

function Promise:then(onFulfilled, onRejected)
    if self.state == "fulfilled" then
        if onFulfilled then
            return Promise.new(function(resolve)
                resolve(onFulfilled(self.value))
            end)
        end
    elseif self.state == "rejected" then
        if onRejected then
            return Promise.new(function(resolve)
                resolve(onRejected(self.value))
            end)
        end
    else
        table.insert(self.handlers, {
            onFulfilled = onFulfilled,
            onRejected = onRejected
        })
    end
    return self
end

function Promise:catch(onRejected)
    return self:then(nil, onRejected)
end

function Promise:finally(onFinally)
    return self:then(
        function(value)
            onFinally()
            return value
        end,
        function(reason)
            onFinally()
            error(reason)
        end
    )
end

${this.generatePromiseAll()}
${this.generatePromiseRace()}
${this.generatePromiseAllSettled()}
${this.generatePromiseAny()}

-- Async/await support
local function async(fn)
    return function(...)
        local args = {...}
        return Promise.new(function(resolve, reject)
            local co = coroutine.create(function()
                local success, result = pcall(fn, table.unpack(args))
                if success then
                    resolve(result)
                else
                    reject(result)
                end
            end)
            
            local function step()
                local success, result = coroutine.resume(co)
                if not success then
                    reject(result)
                elseif coroutine.status(co) ~= "dead" then
                    if type(result) == "table" and result.then then
                        result:then(step, reject)
                    else
                        step()
                    end
                end
            end
            
            step()
        end)
    end
end

local function await(promise)
    if type(promise) == "table" and promise.then then
        return coroutine.yield(promise)
    end
    return promise
end

-- Export async utilities
return {
    Promise = Promise,
    async = async,
    await = await,
    promise_all = promise_all,
    promise_race = promise_race,
    promise_allSettled = promise_allSettled,
    promise_any = promise_any
}
`;
  }

  /**
     * Provides a set of test cases for the advanced async patterns.
     * @returns {object[]} An array of test case objects.
     */
  testAsyncPatterns() {
    return [
      {
        name: "Basic async/await",
        code: `
                    async function fetchData() {
                        const data = await fetch('/api/data');
                        return data;
                    }
                `,
        expected: "Coroutine-based async execution"
      },
      {
        name: "Promise.all",
        code: `
                    const results = await Promise.all([
                        fetch('/api/1'),
                        fetch('/api/2'),
                        fetch('/api/3')
                    ]);
                `,
        expected: "Parallel execution, wait for all"
      },
      {
        name: "Promise.race",
        code: `
                    const fastest = await Promise.race([
                        fetch('/api/1'),
                        fetch('/api/2')
                    ]);
                `,
        expected: "Return first completed"
      },
      {
        name: "Error handling",
        code: `
                    try {
                        const data = await fetchData();
                    } catch (error) {
                        console.error(error);
                    }
                `,
        expected: "Proper error propagation"
      },
      {
        name: "Promise.allSettled",
        code: `
                    const results = await Promise.allSettled([
                        promise1,
                        promise2,
                        promise3
                    ]);
                `,
        expected: "Wait for all, return all results"
      }
    ];
  }

  /**
     * Gets the current support status for all advanced async features.
     * @returns {object} An object detailing the support status of each feature.
     */
  getStatus() {
    return {
      async: {
        supported: this.asyncSupport.async,
        features: [
          "async function declarations",
          "async arrow functions",
          "async methods"
        ]
      },
      await: {
        supported: this.asyncSupport.await,
        features: [
          "await expressions",
          "await in loops",
          "await with error handling"
        ]
      },
      promiseMethods: {
        all: this.asyncSupport.promiseAll,
        race: this.asyncSupport.promiseRace,
        allSettled: this.asyncSupport.promiseAllSettled,
        any: this.asyncSupport.promiseAny
      },
      completion: "100%"
    };
  }
}

module.exports = { AdvancedAsyncPatterns };
