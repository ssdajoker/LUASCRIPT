-- LUASCRIPT Runtime Library Integration
local runtime = require('runtime.runtime')
local console = runtime.console
local JSON = runtime.JSON
local Math = runtime.Math

local message = "Hello" .. " " .. "World";
console.log(message);