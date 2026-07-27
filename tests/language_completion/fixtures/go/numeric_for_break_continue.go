package main

import "fmt"

func main() {
  total := 0
  for value := 1; value < 7; value = value + 1 {
    if value == 2 {
      continue
    }
    if value == 6 {
      break
    }
    total = total + value
  }
  fmt.Println("go_loop", total)
}
