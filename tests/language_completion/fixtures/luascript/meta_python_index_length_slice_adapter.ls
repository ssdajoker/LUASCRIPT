verify {
  stdout "python_index_length_slice b 4 bc 8 9 8 2 10";
  python_stdout "python_index_length_slice b 4 bc 8 9 8 2 10";
  lua_stdout "python_index_length_slice b 4 bc 8 9 8 2 10";
  js_stdout "python_index_length_slice b 4 bc 8 9 8 2 10";
  ls_stdout "python_index_length_slice b 4 bc 8 9 8 2 10";
  lua_policy "adapters.indexing=zero_based";
  lua_policy "adapters.length=array_length_property";
  lua_policy "adapters.slicing=runtime_slice";
  lua_repair "indexing=zero_based";
  lua_repair "length=array_length_property";
  lua_repair "slicing=runtime_slice";
  python_policy "adapters.indexing=zero_based";
  python_policy "adapters.length=array_length_property";
  python_policy "adapters.slicing=runtime_slice";
  python_repair "indexing=zero_based";
  python_repair "length=array_length_property";
  python_repair "slicing=runtime_slice";
  ls_policy "adapters.indexing=zero_based";
  ls_policy "adapters.length=array_length_property";
  ls_policy "adapters.slicing=runtime_slice";
  python_contains "__ls_index";
  python_contains "__ls_set_index";
  python_contains "__ls_slice";
  python_contains "len(";
  python_not_contains ".length";
  python_not_contains ".slice";
  ls_contains "portable_semantics_v1";
}

meta profile portable_semantics_v1;

let values = [5, 7, 9, 11];
let word = "abcd";

values[1] = 8;
values[0] = values[0] + 5;

let char = word[1];
let wordLength = word.length;
let part = word.slice(1, 3);
let second = values[1];
let third = values[2];
let listPart = values.slice(1, 3);
let listFirst = listPart[0];
let listPartLength = listPart.length;
let first = values[0];

console.log("python_index_length_slice", char, wordLength, part, second, third, listFirst, listPartLength, first);
