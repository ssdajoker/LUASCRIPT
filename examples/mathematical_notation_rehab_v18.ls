// LUASCRIPT mathematical notation rehab V18: swept EE frequency response

within(value, low, high) = low <= value && value <= high

main() =
  R_value = 1000,
  C_value = 0.000001,
  s = sym("s", physics_dimensions("frequency")),
  R = sym("R", physics_dimensions("resistance")),
  C = sym("C", physics_dimensions("capacitance")),
  rc_low = rc_lowpass_transfer(s, R, C),
  rc_high = rc_highpass_transfer(s, R, C),
  cutoff = rc_cutoff_frequency(R_value, C_value),
  log_freqs = frequency_sweep(10, 100000, 5, "log"),
  linear_freqs = frequency_sweep(0.1, 0.5, 5, "linear"),
  low_sweep = frequency_response_sweep(rc_low, {R: R_value, C: C_value}, log_freqs),
  high_sweep = frequency_response_sweep(rc_high, {R: R_value, C: C_value}, log_freqs),
  cutoff_sweep = frequency_response_sweep(rc_low, {R: R_value, C: C_value}, [10, 100, cutoff, 1000, 10000]),
  low_mags = response_magnitudes(low_sweep),
  high_mags = response_magnitudes(high_sweep),
  low_db = response_db_values(low_sweep),
  low_phases = response_phases(low_sweep),
  low_trough = response_trough(low_sweep),
  high_peak = response_peak(high_sweep),
  nearest_cutoff = response_nearest(cutoff_sweep, cutoff * 1.04),
  cutoff_estimate = response_crossing_frequency(cutoff_sweep, -3.0102999566398),
  console.log(
    "math_rehab_v18",
    within(log_freqs[0], 9.9, 10.1),
    within(log_freqs[1], 99, 101),
    within(log_freqs[4], 99999, 100001),
    within(linear_freqs[2], 0.29, 0.31),
    response_is_monotonic_db(low_sweep, "decreasing"),
    response_is_monotonic_db(high_sweep, "increasing"),
    low_mags[0] > 0.99,
    low_mags[4] < 0.002,
    high_mags[0] < 0.07,
    high_mags[4] > 0.999,
    low_db[0] > -0.02,
    low_db[4] < -55,
    low_phases[0] < 0,
    response_frequency(low_trough) > 99999,
    response_frequency(high_peak) > 99999,
    abs(response_frequency(nearest_cutoff) - cutoff) < 0.001,
    within(cutoff_estimate, 159, 160)
  )

main()
