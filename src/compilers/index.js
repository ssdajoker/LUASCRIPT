
/**
 * LUASCRIPT Compilers Main Export
 */

const { JSToIRCompiler } = require('./js-to-ir');
const { LuaToIRCompiler } = require('./lua-to-ir');
const { IRToJSGenerator } = require('./ir-to-js');
const { IRToLuaGenerator } = require('./ir-to-lua');

module.exports = {
    JSToIRCompiler,
    LuaToIRCompiler,
    IRToJSGenerator,
    IRToLuaGenerator
};
