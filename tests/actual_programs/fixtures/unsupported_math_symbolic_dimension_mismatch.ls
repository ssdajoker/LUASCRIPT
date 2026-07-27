main() =
  V = sym("V", physics_dimensions("voltage")),
  I = sym("I", physics_dimensions("current")),
  impossible = V + I,
  console.log("dimension_mismatch", impossible)

main()
