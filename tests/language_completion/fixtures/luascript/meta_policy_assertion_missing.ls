verify {
  diagnostic "emitted luascript output missing verify luascript_contains text: adapt indexing using zero_based";
  ls_contains "adapt indexing using zero_based";
}

meta {
  target lua {
    adapt length using array_length_property;
  }
}

console.log("policy_missing", 1);
