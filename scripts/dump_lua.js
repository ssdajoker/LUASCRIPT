const { UnifiedLuaScript } = require('../src/unified_luascript');

(async () => {
  const sys = new UnifiedLuaScript();
  await sys.initializeComponents();

  const js = process.argv[2] === 'switch' ? `
(() => {
  function s(n){
    switch(n){
      case 1: return 'one';
      case 2: return 'two';
      default: return 'other';
    }
  }
  return { a: s(2), b: s(7) };
})()
` : `
(() => {
  const obj = {
    f: function(x){ return x + 1; },
    g: (y) => y * 2
  };
  function apply(cb, v){ return cb(v); }
  return { a: obj.f(1), b: obj.g(3), c: apply(obj.f, 5) };
})()
`;

  const result = await sys.transpile(js);
  console.log('--- LUA OUTPUT ---');
  console.log(result.code);
  sys.shutdown();
})();
