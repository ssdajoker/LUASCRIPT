repair {
  target lua {
    lower indexing using zero_based;
  }
}

verify {
  stdout "meta_repair_missing_runtime 7";
  lua_repair "indexing=zero_based";
}

let values = [7, 8, 9];
console.log("meta_repair_missing_runtime", values[0]);
