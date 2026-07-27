interface Counter {
  label: string;
  value: number;
}

let counter: Counter = { label: "alpha", value: 4 };
counter.value = counter.value + 8;

console.log("ts_object", counter.label, counter.value);
