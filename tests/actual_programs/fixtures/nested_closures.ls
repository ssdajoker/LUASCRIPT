function makeAdder(base) {
  return (value) => base + value;
}

let addFive = makeAdder(5);

console.log("nested_closure", addFive(7));
