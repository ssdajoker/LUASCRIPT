repair {
  target lua {
    lower indexing using zero_based;
    lower length using array_length_property;
    lower slicing using runtime_slice;
  }
}

verify {
  stdout "identity_repair b 4 bc";
  lua_stdout "identity_repair b 4 bc";
  lua_repair "indexing=zero_based";
  lua_repair "length=array_length_property";
  lua_repair "slicing=runtime_slice";
}

let word = "abcd";
let part = word.slice(1, 3);
console.log("identity_repair", word[1], word.length, part);
