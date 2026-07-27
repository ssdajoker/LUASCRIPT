verify {
  diagnostic "repair assertion for luascript requires verify ls_stdout for runtime parity";
  ls_repair "indexing=zero_based";
}

meta profile portable_semantics_v1;

let values = [5, 8];
console.log("ls_repair_missing_runtime", values[0]);
