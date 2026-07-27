local value = 3
local ok = not false and value >= 3
local neg = -value

if ok then
  print("boolean", neg)
else
  print("boolean", 0)
end
