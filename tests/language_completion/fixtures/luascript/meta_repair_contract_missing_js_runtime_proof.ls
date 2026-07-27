verify {
  diagnostic "repair assertion for javascript requires verify js_stdout for runtime parity";
  js_repair "indexing=zero_based";
}

meta profile portable_semantics_v1;

let values = [4, 6];
console.log("js_repair_missing_runtime", values[0]);
