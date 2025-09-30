-- LUASCRIPT Runtime Library Integration
local runtime = require('runtime.runtime')
local console = runtime.console
local function greet(name)
    local greeting = "Hello, " .. name .. "!";
    console.log(greeting);
    return greeting;
end
greet("World");