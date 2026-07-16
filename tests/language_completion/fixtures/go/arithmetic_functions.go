package main

import "fmt"

func add(a int, b int) int {
  return a + b
}

func main() {
  total := add(7, 5)
  fmt.Println("go_arithmetic", total)
}
