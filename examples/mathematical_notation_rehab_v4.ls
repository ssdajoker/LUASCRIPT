// LUASCRIPT mathematical notation rehab V4: complex unit and DFT helpers

π = 4 × atan(1)

main() =
  euler_zero = magnitude(ℯ^(π × i) + 1),
  spectrum = fft([1, 0, 0, 0]),
  recovered = inverse_fft(spectrum),
  console.log("math_rehab_v4", euler_zero < 0.000001, length(spectrum), real_part(recovered[0]))

main()
