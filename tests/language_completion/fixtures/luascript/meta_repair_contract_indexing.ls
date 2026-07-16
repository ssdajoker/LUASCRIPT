repair {
  target lua {
    lower indexing using zero_based;
  }
  target python {
    lower indexing using zero_based;
  }
}

verify {
  stdout "meta_repair_index 7";
  lua_stdout "meta_repair_index 7";
  python_stdout "meta_repair_index 7";
  lua_repair "indexing=zero_based";
  python_repair "indexing=zero_based";
}

let values = [7, 8, 9];
console.log("meta_repair_index", values[0]);
