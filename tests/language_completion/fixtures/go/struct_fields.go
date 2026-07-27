package main

import "fmt"

type Point struct {
  x int
  y int
}

func main() {
  point := Point{3, 4}
  point.x = point.x + 2
  fmt.Println("go_struct", point.x, point.y)
}
