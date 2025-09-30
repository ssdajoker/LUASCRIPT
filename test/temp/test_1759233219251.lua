-- LUASCRIPT Runtime Library Integration
local runtime = require('runtime.runtime')
local console = runtime.console
local name = "John";
local age = 25;
local message = "Name = " .. name .. ", Age = " .. age;
local isAdult = age >= 18 and name ~= "";
console.log(message);
console.log("Is adult:", isAdult);