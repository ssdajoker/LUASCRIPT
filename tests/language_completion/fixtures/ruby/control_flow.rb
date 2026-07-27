def main
  count = 0
  total = 0
  while count < 5
    count = count + 1
    if count == 3
      next
    end
    total = total + count
  end
  puts "ruby_control"
  puts total
end
