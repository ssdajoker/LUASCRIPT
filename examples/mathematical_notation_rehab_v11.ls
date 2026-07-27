// LUASCRIPT mathematical notation rehab V11: physics/EE vector calculus symbols

potential(r) = r[0]² + 2r[1]² + 3r[2]²

vector_field(r) = [r[0]², 2r[1], 3r[2]]

swirl_field(r) = [−r[1], r[0], 0]

classify_field(energy) =
  | energy ≥ 20 → "field_energy_high"
  | _ → "field_energy_low"

main() =
  E = [3, 4, 0],
  B = [0, 0, 2],
  power_density = E · E,
  poynting = E ⨯ B,
  dyadic = E ⊗ [1, 2],
  e_hat = unit(E),
  grad_phi = ∇(potential, [1, 2, 3]),
  flux_density = divergence(vector_field, [1, 2, 3]),
  circulation = curl(swirl_field, [2, 3, 0]),
  console.log(
    "math_rehab_v11",
    power_density,
    poynting,
    dyadic,
    abs(norm(E) - 5) < 0.001,
    abs(e_hat[0] - 0.6) < 0.001,
    abs(grad_phi[0] - 2) < 0.001,
    abs(grad_phi[1] - 8) < 0.001,
    abs(grad_phi[2] - 18) < 0.001,
    abs(flux_density - 7) < 0.001,
    abs(circulation[0]) < 0.001,
    abs(circulation[1]) < 0.001,
    abs(circulation[2] - 2) < 0.001,
    classify_field(power_density)
  )

main()
