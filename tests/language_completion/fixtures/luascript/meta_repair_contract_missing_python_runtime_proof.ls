verify {
  diagnostic "repair assertion for python requires verify python_stdout for runtime parity";
  python_repair "indexing=zero_based";
}

meta profile portable_semantics_v1;

let values = [7, 9];
console.log("python_repair_missing_runtime", values[0]);
