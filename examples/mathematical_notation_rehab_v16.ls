// LUASCRIPT mathematical notation rehab V16: symbolic calculus and EE transfer functions

main() =
  s = sym("s", physics_dimensions("frequency")),
  R = sym("R", physics_dimensions("resistance")),
  C = sym("C", physics_dimensions("capacitance")),
  L = sym("L", physics_dimensions("inductance")),
  t = sym("t", physics_dimensions("time")),
  x = sym("x", physics_dimensions("length")),
  theta = sym("theta"),
  motion = x * (t ^ 2),
  velocity_shape = symbolic_derivative(motion, "t"),
  trig_rate = symbolic_derivative(symbolic_sin(theta ^ 2), "theta"),
  rc_low = rc_lowpass_transfer(s, R, C),
  rc_high = rc_highpass_transfer(s, R, C),
  rl_low = rl_lowpass_transfer(s, L, R),
  zc = symbolic_impedance_C(s, C),
  zl = symbolic_impedance_L(s, L),
  divider = symbolic_voltage_divider(zc, R),
  substituted = symbolic_substitute(rc_low, {R: 1000, C: 0.000001}),
  console.log(
    "math_rehab_v16",
    symbolic_format(velocity_shape),
    symbolic_dimension_format(velocity_shape),
    symbolic_format(trig_rate),
    symbolic_format(rc_low),
    symbolic_format(rc_high),
    symbolic_format(rl_low),
    symbolic_format(zc),
    symbolic_dimension_format(zc),
    symbolic_format(zl),
    symbolic_dimension_format(zl),
    symbolic_format(divider),
    symbolic_format(substituted)
  )

main()
