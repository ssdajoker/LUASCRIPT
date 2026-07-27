const {spawnSync} = require('child_process');

function probe(command, args) {
  const result = spawnSync(command, args, {encoding: 'utf8', windowsHide: true});
  return {available: result.error == null && result.status === 0, output: `${result.stdout || ''}${result.stderr || ''}`.trim()};
}

const luajit = probe('luajit', ['-v']);
const lpeg = luajit.available ? probe('luajit', ['-e', "require('lpeg')"]) : {available: false, output: 'LuaJIT unavailable'};
const lua = probe('lua', ['-v']);

console.log(JSON.stringify({
  luajit: luajit.available ? 'available' : 'missing',
  lua: lua.available ? 'available' : 'missing',
  lpeg: lpeg.available ? 'available' : 'setup-blocked',
  nextStep: lpeg.available ? 'npm run clarity:dogfood:gaussian:verify' : 'Install LPEG for the active LuaJIT runtime, then rerun the Gaussian parser lane.'
}, null, 2));
