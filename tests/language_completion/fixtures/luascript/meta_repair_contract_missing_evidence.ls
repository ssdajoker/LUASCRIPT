verify {
  diagnostic "emitted luascript output missing verify luascript_contains text: lower indexing using zero_based";
  ls_contains "lower indexing using zero_based";
}

let values = [5, 6];
console.log("meta_repair_missing", values[0]);
