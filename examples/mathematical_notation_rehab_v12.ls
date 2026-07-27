// LUASCRIPT mathematical notation rehab V12: dimension-aware units and EE phasors

classify_impedance(z) =
  | magnitude(z) ≥ 10 → "impedance_high"
  | _ → "impedance_low"

main() =
  length_total = unit_add(meters(2), meters(3)),
  speed = unit_div(meters(10), seconds(2), "m/s"),
  supply = volts(12),
  current = amps(2),
  resistance = unit_div(supply, current, "Ω"),
  power = unit_mul(supply, current, "W"),
  z_R = impedance_R(10),
  z_L = impedance_L(60, 0.05),
  z_C = impedance_C(60, 0.001),
  z_series = series_impedance([z_R, z_L, z_C]),
  z_parallel = parallel_impedance([impedance_R(10), impedance_R(10)]),
  source = phasor(120, -30),
  console.log(
    "math_rehab_v12",
    unit_value(length_total),
    unit_symbol(length_total),
    unit_value(speed),
    unit_symbol(speed),
    unit_value(resistance),
    unit_symbol(resistance) == "Ω",
    unit_compatible(resistance, ohms(1)),
    unit_value(power),
    unit_symbol(power),
    abs(real_part(z_series) - 10) < 0.001,
    abs(imag_part(z_series) - 16.19697) < 0.01,
    abs(magnitude(z_parallel) - 5) < 0.001,
    abs(magnitude(source) - 120) < 0.001,
    abs(phase(source) + 30) < 0.001,
    abs(rms(169.7056) - 120) < 0.01,
    classify_impedance(z_series)
  )

main()
