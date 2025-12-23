/**
 * Module system regression tests.
 * Covers ES modules, CommonJS requires, circular detection, and namespace safety.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const assert = require('assert');

const {
  ModuleLoader,
  ESModuleLoader,
  ModuleResolver,
  ModuleCache,
} = require('../src/phase2_core_modules');

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'luascript-mod-tests-'));

function writeTemp(fileName, contents) {
  const fullPath = path.join(tempRoot, fileName);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, contents, 'utf8');
  return fullPath;
}

const tests = [];
function test(name, fn) {
  tests.push({ name, fn });
}

// ---------- ModuleResolver coverage ----------
test('ModuleResolver resolves relative JavaScript file', () => {
  const resolver = new ModuleResolver({ basePath: tempRoot });
  const file = writeTemp('relative/basic.js', 'module.exports = 42;');
  const resolved = resolver.resolve('./relative/basic', file);
  assert.strictEqual(resolved, file);
});

test('ModuleResolver prefers index file inside directory', () => {
  const resolver = new ModuleResolver({ basePath: tempRoot });
  const indexFile = writeTemp('pkg/index.js', 'module.exports = "indexed";');
  const resolved = resolver.resolve('./pkg', indexFile);
  assert.strictEqual(resolved, indexFile);
});

test('ModuleResolver respects package.json main field', () => {
  const resolver = new ModuleResolver({ basePath: tempRoot });
  const pkgDir = path.join(tempRoot, 'lib');
  fs.mkdirSync(pkgDir, { recursive: true });
  writeTemp('lib/main.js', 'module.exports = "main-entry";');
  fs.writeFileSync(
    path.join(pkgDir, 'package.json'),
    JSON.stringify({ main: './main.js' }),
    'utf8',
  );
  const resolved = resolver.resolve('./lib', path.join(pkgDir, 'placeholder.js'));
  assert.ok(resolved.endsWith('main.js'), 'main entry should be selected');
});

test('ModuleResolver supports aliases', () => {
  const resolver = new ModuleResolver({ basePath: tempRoot });
  const target = writeTemp('aliased/file.js', 'module.exports = "alias";');
  resolver.addAlias('@alias/file', target);
  const resolved = resolver.resolve('@alias/file', target);
  assert.strictEqual(resolved, target);
});

test('ModuleResolver searches moduleDirectories for bare specifiers', () => {
  const resolver = new ModuleResolver({ basePath: tempRoot });
  const modFile = writeTemp('node_modules/demo/index.js', 'module.exports = "demo";');
  const resolved = resolver.resolve('demo', modFile);
  assert.strictEqual(resolved, modFile);
});

// ---------- ModuleCache coverage ----------
test('ModuleCache stores and retrieves entries', () => {
  const cache = new ModuleCache();
  cache.set('/tmp/example.js', { value: 1 });
  assert.strictEqual(cache.has('/tmp/example.js'), true);
  assert.deepStrictEqual(cache.get('/tmp/example.js'), { value: 1 });
});

test('ModuleCache tracks loading lifecycle', () => {
  const cache = new ModuleCache();
  cache.startLoading('foo');
  assert.strictEqual(cache.isLoading('foo'), true);
  cache.finishLoading('foo');
  assert.strictEqual(cache.isLoading('foo'), false);
});

// ---------- CommonJS (ModuleLoader) ----------
test('ModuleLoader caches CommonJS requires', () => {
  const loader = new ModuleLoader();
  const file = writeTemp('cjs/cache.js', 'module.exports = { id: Math.random() };');
  const first = loader.require(file, file);
  const second = loader.require(file, file);
  assert.strictEqual(first, second);
});

test('ModuleLoader disallows native modules when flag is false', () => {
  const loader = new ModuleLoader({ allowNativeModules: false });
  const file = writeTemp('cjs/native.js', 'module.exports = 1;');
  assert.throws(() => loader.require(file, file), /not allowed/);
});

test('ModuleLoader loads JSON modules', () => {
  const loader = new ModuleLoader();
  const file = writeTemp('data/config.json', JSON.stringify({ enabled: true }));
  const result = loader.require(file, file);
  assert.deepStrictEqual(result, { enabled: true });
});

test('ModuleLoader supports aliases through addAlias', () => {
  const loader = new ModuleLoader();
  const file = writeTemp('alias/target.js', 'module.exports = "aliased-module";');
  loader.addAlias('@alias/module', file);
  const result = loader.require('@alias/module', file);
  assert.strictEqual(result, 'aliased-module');
});

test('ModuleLoader detects circular dependency via loading flag', () => {
  const loader = new ModuleLoader();
  const file = writeTemp('circular/a.js', 'module.exports = "a";');
  loader.getCache().startLoading(file);
  assert.throws(() => loader.require(file, file), /Circular dependency/);
  loader.getCache().finishLoading(file);
});

test('ModuleLoader resolves bare specifiers from moduleDirectories', () => {
  const loader = new ModuleLoader();
  writeTemp('node_modules/utilkit/index.js', 'module.exports = "utilkit";');
  const fromFile = writeTemp('app/main.js', 'module.exports = "main";');
  const result = loader.require('utilkit', fromFile);
  assert.strictEqual(result, 'utilkit');
});

// ---------- ES Modules (ESModuleLoader) ----------
test('ESModuleLoader imports default and named exports', async () => {
  const loader = new ESModuleLoader({ allowNativeModules: true });
  const file = writeTemp(
    'esm/basic.js',
    'export const name = "esm"; export default { ok: true };',
  );
  const module = await loader.import(file, file);
  assert.strictEqual(module.name, 'esm');
  assert.strictEqual(module.default.ok, true);
});

test('ESModuleLoader caches imports', async () => {
  const loader = new ESModuleLoader({ allowNativeModules: true });
  const file = writeTemp('esm/cache.js', 'export const nonce = Math.random();');
  const first = await loader.import(file, file);
  const second = await loader.import(file, file);
  assert.strictEqual(first, second);
});

test('ESModuleLoader supports import maps via setImportMap', async () => {
  const loader = new ESModuleLoader({ allowNativeModules: true });
  const target = writeTemp('esm/mapped.js', 'export default "mapped";');
  loader.setImportMap({ '@mapped': target });
  const mod = await loader.import('@mapped', target);
  assert.strictEqual(mod.default, 'mapped');
});

test('ESModuleLoader detects circular dependency using cache flag', async () => {
  const loader = new ESModuleLoader({ allowNativeModules: true });
  const file = writeTemp('esm/circular.js', 'export default 1;');
  loader.cache.startLoading(file);
  await assert.rejects(() => loader.import(file, file), /Circular dependency/);
  loader.cache.finishLoading(file);
});

test('ESModuleLoader disallows native modules when flag is false', async () => {
  const loader = new ESModuleLoader({ allowNativeModules: false });
  const file = writeTemp('esm/native.js', 'export default 1;');
  await assert.rejects(() => loader.import(file, file), /not allowed/);
});

test('ESModuleLoader keeps namespaces isolated for same export names', async () => {
  const loader = new ESModuleLoader({ allowNativeModules: true });
  const left = writeTemp('esm/left.js', 'export const value = "left";');
  const right = writeTemp('esm/right.js', 'export const value = "right";');
  const leftMod = await loader.import(left, left);
  const rightMod = await loader.import(right, right);
  assert.strictEqual(leftMod.value, 'left');
  assert.strictEqual(rightMod.value, 'right');
});

test('ESModuleLoader import map prevents namespace conflicts by aliasing', async () => {
  const loader = new ESModuleLoader({ allowNativeModules: true });
  const core = writeTemp('esm/core.js', 'export const version = 1;');
  const alt = writeTemp('esm/core-alt.js', 'export const version = 2;');
  loader.setImportMap({ '@core': core, '@core/alt': alt });
  const base = await loader.import('@core', core);
  const alternate = await loader.import('@core/alt', alt);
  assert.strictEqual(base.version, 1);
  assert.strictEqual(alternate.version, 2);
});

test('ESModuleLoader import map aliases resolve to same cache entry', async () => {
  const loader = new ESModuleLoader({ allowNativeModules: true });
  const target = writeTemp('esm/shared.js', 'export const id = Math.random();');
  loader.setImportMap({ '@one': target, '@two': target });
  const one = await loader.import('@one', target);
  const two = await loader.import('@two', target);
  assert.strictEqual(one, two);
});

// ---------- Integration scenarios ----------
test('CommonJS can require JSON and export composed namespace', () => {
  const loader = new ModuleLoader();
  writeTemp('combo/data.json', JSON.stringify({ flag: true }));
  const file = writeTemp(
    'combo/index.js',
    `const data = require('./data.json'); module.exports = { ok: data.flag };`,
  );
  const result = loader.require(file, file);
  assert.deepStrictEqual(result, { ok: true });
});

test('ModuleResolver throws for missing modules', () => {
  const resolver = new ModuleResolver({ basePath: tempRoot });
  assert.throws(() => resolver.resolve('./missing', tempRoot), /Cannot resolve module/);
});

async function run() {
  console.log('\nModule System Test Suite\n');
  let passed = 0;
  let failed = 0;

  for (const { name, fn } of tests) {
    try {
      await fn();
      passed++;
      console.log(`  PASS ${name}`);
    } catch (error) {
      failed++;
      console.log(`  FAIL ${name}: ${error.message}`);
    }
  }

  fs.rmSync(tempRoot, { recursive: true, force: true });

  console.log('\n==============================');
  console.log(`Total: ${tests.length}  Passed: ${passed}  Failed: ${failed}`);
  if (failed > 0) {
    process.exitCode = 1;
  }
}

if (require.main === module) {
  run();
}

module.exports = { tests };
