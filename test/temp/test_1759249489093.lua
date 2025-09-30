-- LUASCRIPT Runtime Library Integration
local runtime = require('runtime.runtime')
local console = runtime.console
local isEqual = (5 == 5);
local isNotEqual = (5 ~= 3);
console.log(isEqual, isNotEqual);