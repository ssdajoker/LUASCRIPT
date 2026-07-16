let items = [{ name: "alpha", value: 2 }, { name: "beta", value: 5 }];
let total = 0;
let last = "";

for (let item of items) {
  total = total + item.value;
  last = item.name;
}

console.log("mixed_arrays_objects", last, total);
