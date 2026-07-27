main() =
  x = sym("x"),
  y = symbolic_func("tan", x),
  dy = symbolic_derivative(y, "x"),
  console.log("bad_derivative", dy)

main()
