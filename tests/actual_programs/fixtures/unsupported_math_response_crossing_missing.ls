main() =
  s = sym("s", physics_dimensions("frequency")),
  R = sym("R", physics_dimensions("resistance")),
  C = sym("C", physics_dimensions("capacitance")),
  rc_low = rc_lowpass_transfer(s, R, C),
  responses = frequency_response_sweep(rc_low, {R: 1000, C: 0.000001}, [10, 20, 30]),
  crossing = response_crossing_frequency(responses, -80),
  console.log("bad_crossing", crossing)

main()
