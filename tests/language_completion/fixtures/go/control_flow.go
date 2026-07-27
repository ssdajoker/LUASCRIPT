package main

import "fmt"

func main() {
  total := 0
  for total < 5 {
    total = total + 1
  }
  if total == 5 {
    fmt.Println("go_control", "ready", total)
  } else {
    fmt.Println("go_control", "bad", total)
  }
}
