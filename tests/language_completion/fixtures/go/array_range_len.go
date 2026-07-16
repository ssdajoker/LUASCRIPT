package main

import "fmt"

func main() {
  values := []int{1, 2, 3, 4}
  total := 0
  for _, value := range values {
    total = total + value
  }
  fmt.Println("go_array", total, len(values))
}
