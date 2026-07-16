function classify(value: number): string {
  if (value > 6) {
    return "big";
  }
  return "small";
}

console.log("ts_branch", classify(7), classify(3));
