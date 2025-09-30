-- LUASCRIPT Runtime Library Integration
local runtime = require('runtime.runtime')
local console = runtime.console
local result = true or false;
local result2 = true and false;
console.log(result, result2);