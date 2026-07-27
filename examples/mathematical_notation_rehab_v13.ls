// LUASCRIPT mathematical notation rehab V13: unit operators and matrix physics helpers

classify_load(z) =
  | magnitude(z) ≥ 8 → "matrix_load_high"
  | _ → "matrix_load_low"

main() =
  total_length = meters(2) + meters(3),
  resistance = volts(12) / amps(2),
  energy = watts(24) * seconds(2),
  acceleration = meters(10) / (seconds(2) ^ 2),
  transform = matrix([[2, 0, 0], [0, 3, 0], [0, 0, 4]]),
  displacement = matrix_vector(transform, [1, 2, 3]),
  transfer = matmul([[1, 2], [3, 4]], [[2, 0], [1, 2]]),
  system = [[2, 1], [1, 3]],
  solution = solve2(system, [8, 13]),
  force = lorentz_force(coulombs(2), [3, 0, 0], [0, 2, 0], [0, 0, 4]),
  load = series_impedance([impedance_R(5), impedance_L(60, 0.02)]),
  console.log(
    "math_rehab_v13",
    unit_value(total_length),
    unit_symbol(total_length),
    unit_value(resistance),
    unit_compatible(resistance, ohms(1)),
    unit_value(energy),
    unit_compatible(energy, joules(1)),
    unit_value(acceleration),
    displacement,
    transfer,
    abs(determinant2([[4, 7], [2, 6]]) - 10) < 0.001,
    abs(solution[0] - 2.2) < 0.001,
    abs(solution[1] - 3.6) < 0.001,
    trace(identity(3)),
    force,
    classify_load(load)
  )

main()
