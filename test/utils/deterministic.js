const DEFAULT_SEED = 1337;

function installDeterministicSeed(seed = DEFAULT_SEED) {
  const originalRandom = Math.random;
  let state = seed >>> 0;

  const seededRandom = () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x100000000;
  };

  const reseed = (nextSeed = seed) => {
    state = nextSeed >>> 0;
    Math.random = seededRandom;
  };

  reseed(seed);

  return {
    reseed,
    restore: () => {
      Math.random = originalRandom;
    },
  };
}

function createDeterministicIdGenerator(prefix = 'id', start = 0) {
  let counter = start;
  return () => `${prefix}_${++counter}`;
}

module.exports = {
  createDeterministicIdGenerator,
  installDeterministicSeed,
};
