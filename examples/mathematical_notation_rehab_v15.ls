// LUASCRIPT mathematical notation rehab V15: dimension-aware symbolic circuit systems

main() =
  voltage_dims = physics_dimensions("voltage"),
  current_dims = physics_dimensions("current"),
  resistance_dims = physics_dimensions("resistance"),
  power_dims = physics_dimensions("power"),
  V = sym("V", voltage_dims),
  I = sym("I", current_dims),
  R = sym("R", resistance_dims),
  P = sym("P", power_dims),
  ohm_eq = equation(V, I * R),
  power_eq = equation(P, V * I),
  solution = solve_linear_system([ohm_eq, power_eq], ["V", "P"]),
  solved_voltage = symbolic_assert_dimensions(solution_get(solution, "V"), voltage_dims),
  solved_power = symbolic_assert_dimensions(solution_get(solution, "P"), power_dims),
  voltage_value = symbolic_evaluate(solved_voltage, {I: 2, R: 6}),
  power_value = symbolic_evaluate(solved_power, {I: 2, R: 6}),
  console.log(
    "math_rehab_v15",
    symbolic_format(ohm_eq),
    symbolic_format(power_eq),
    symbolic_format(solved_voltage),
    symbolic_dimension_format(solved_voltage),
    symbolic_format(solved_power),
    symbolic_dimension_format(solved_power),
    voltage_value,
    power_value,
    solution_format(solution, ["V", "P"])
  )

main()
