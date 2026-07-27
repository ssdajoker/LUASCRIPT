local values = {3, 5, 7}
local total = 0
local last = 0

for index, value in ipairs(values) do
  total = total + value
  last = index
end

print("ipairs", total, last)
