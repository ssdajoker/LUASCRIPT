// LUASCRIPT mathematical notation rehab V14: symbolic physics formula seed

main() =
  m = sym("m"),
  a = sym("a"),
  force_formula = physics_formula("newton2"),
  simplified_mass = symbolic_simplify((m * 1) + 0),
  evaluated_work = symbolic_evaluate((m * a) + 2, {m: 3, a: 4}),
  ohm_formula = physics_formula("ohm"),
  solved_current = solve_linear(formula_equation(ohm_formula), "I"),
  current_value = symbolic_evaluate(solved_current, {V: 12, R: 6}),
  lorentz_formula = physics_formula("lorentz_force"),
  gauss_formula = physics_formula("gauss_electric"),
  poynting_formula = physics_formula("poynting"),
  poynting_symbol = symbolic_cross(sym("E"), sym("H")),
  console.log(
    "math_rehab_v14",
    formula_name(force_formula),
    formula_render(force_formula),
    symbolic_format(simplified_mass),
    evaluated_work,
    formula_render(ohm_formula),
    symbolic_format(solved_current),
    current_value,
    formula_render(lorentz_formula),
    formula_render(gauss_formula),
    formula_render(poynting_formula),
    symbolic_format(poynting_symbol)
  )

main()
