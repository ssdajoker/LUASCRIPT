def main
  puts "ruby_bool_loop"
  total = 0
  ready = true
  for i in 0..6
    if i == 1
      next
    end
    if i > 4
      break
    end
    if ready and i >= 2
      total = total + i
    end
  end
  puts total
end
