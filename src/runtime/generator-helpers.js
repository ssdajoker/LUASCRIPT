/**
 * LUASCRIPT Generator Runtime Support
 * 
 * Provides runtime utilities for generator functions, including
 * iterator helpers and for-of loop support with generators.
 */

/**
 * Creates an iterator from a generator
 * Makes generators work with for-of loops
 * 
 * @param {Object} generator - Generator object with next() method
 * @returns {Object} - Iterator protocol object
 */
function makeIterator(generator) {
    return {
        [Symbol.iterator]() {
            return {
                next() {
                    return generator.next();
                }
            };
        }
    };
}

/**
 * Generator helper that mimics JavaScript generator behavior
 * Used by transpiled code to create generator objects
 * 
 * @param {Function} generatorFn - The generator function body
 * @returns {Object} - Generator object with next(), return(), throw()
 */
function createGenerator(generatorFn, ...args) {
    let state = 'suspended';
    let value;
    
    const generator = {
        next(arg) {
            if (state === 'completed') {
                return { value: undefined, done: true };
            }
            
            try {
                value = generatorFn(arg);
                if (value === undefined) {
                    state = 'completed';
                    return { value: undefined, done: true };
                }
                return { value, done: false };
            } catch (e) {
                state = 'completed';
                throw e;
            }
        },
        
        return(value) {
            state = 'completed';
            return { value, done: true };
        },
        
        throw(err) {
            state = 'completed';
            throw err;
        }
    };
    
    return generator;
}

/**
 * Helper for yield* (generator delegation)
 * Yields all values from another generator
 * 
 * @param {Object} generator - Generator to delegate to
 * @returns {any} - Final return value from delegated generator
 */
function* delegateGenerator(generator) {
    let result;
    while (true) {
        result = generator.next();
        if (result.done) {
            return result.value;
        }
        yield result.value;
    }
}

/**
 * Async generator support
 * Creates an async generator that can use await
 */
async function* createAsyncGenerator(generatorFn, ...args) {
    // Async generators combine promises with iteration
    yield* generatorFn(...args);
}

module.exports = {
    makeIterator,
    createGenerator,
    delegateGenerator,
    createAsyncGenerator
};
