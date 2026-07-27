// LUASCRIPT mathematical notation rehab V17: EE frequency response helpers

within(value, low, high) = low <= value && value <= high

main() =
  R_value = 1000,
  C_value = 0.000001,
  L_value = 0.1,
  R_loss = 10,
  s = sym("s", physics_dimensions("frequency")),
  R = sym("R", physics_dimensions("resistance")),
  C = sym("C", physics_dimensions("capacitance")),
  L = sym("L", physics_dimensions("inductance")),
  rc_low = rc_lowpass_transfer(s, R, C),
  rc_high = rc_highpass_transfer(s, R, C),
  rl_low = rl_lowpass_transfer(s, L, R),
  rlc_z = rlc_series_impedance(s, R, L, C),
  rc_tau_ok = abs(rc_time_constant(R_value, C_value) - 0.001) < 0.000001,
  rl_tau_ok = abs(rl_time_constant(L_value, R_value) - 0.0001) < 0.000001,
  rc_cutoff = rc_cutoff_frequency(R_value, C_value),
  rl_cutoff = rl_cutoff_frequency(R_value, L_value),
  resonant = rlc_resonant_frequency(L_value, C_value),
  quality = rlc_quality_series(R_loss, L_value, C_value),
  bandwidth = rlc_bandwidth_series(R_loss, L_value),
  rc_low_response = frequency_response(rc_low, {R: R_value, C: C_value}, rc_cutoff),
  rc_high_response = frequency_response(rc_high, {R: R_value, C: C_value}, rc_cutoff),
  rl_low_response = frequency_response(rl_low, {R: R_value, L: L_value}, rl_cutoff),
  rlc_response = frequency_response(rlc_z, {R: R_loss, L: L_value, C: C_value}, resonant),
  console.log(
    "math_rehab_v17",
    rc_tau_ok,
    rl_tau_ok,
    within(rc_cutoff, 159, 160),
    within(rl_cutoff, 1591, 1592),
    within(resonant, 503, 504),
    within(quality, 31.6, 31.7),
    within(bandwidth, 15.9, 16),
    abs(response_magnitude(rc_low_response) - 0.70710678) < 0.001,
    abs(response_db(rc_low_response) + 3.0103) < 0.01,
    abs(response_phase(rc_low_response) + 45) < 0.1,
    abs(response_magnitude(rc_high_response) - 0.70710678) < 0.001,
    abs(response_phase(rc_high_response) - 45) < 0.1,
    abs(response_magnitude(rl_low_response) - 0.70710678) < 0.001,
    abs(response_phase(rl_low_response) + 45) < 0.1,
    abs(response_magnitude(rlc_response) - R_loss) < 0.001,
    abs(response_phase(rlc_response)) < 0.1,
    symbolic_format(rlc_z)
  )

main()
