main() =
  s = sym("s", physics_dimensions("frequency")),
  R = sym("R", physics_dimensions("resistance")),
  C = sym("C", physics_dimensions("capacitance")),
  rc_low = rc_lowpass_transfer(s, R, C),
  response = frequency_response(rc_low, 42, 100),
  console.log("bad_frequency_response", response)

main()
