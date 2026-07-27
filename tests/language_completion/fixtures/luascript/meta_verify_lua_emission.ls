verify {
  stdout "verify_emit y 2";
  lua_contains "__ls_index(";
  lua_contains "__ls_length(";
  lua_not_contains "verify {";
  lua_not_contains "lua_contains";
}

meta {
  target lua {
    adapt indexing using zero_based;
    adapt length using array_length_property;
  }
}

let items = ["x", "y"];
console.log("verify_emit", items[1], items.length);
