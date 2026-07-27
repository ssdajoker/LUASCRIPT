// Native limit binders intentionally omit start values in V8.

main() =
  value = lim_{n=10→∞}((1 + 1/n)^n),
  console.log(value)

main()
