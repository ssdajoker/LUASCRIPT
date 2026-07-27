function classify(value) {
  switch (value) {
    case 1:
      return "one";
    case 2:
      return value > 1 ? "two" : "low";
    default:
      return "many";
  }
}

console.log("ring3_switch_conditional", classify(1), classify(2), classify(5));
