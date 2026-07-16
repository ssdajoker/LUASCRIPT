meta profile portable_v1;

verify {
  stdout "meta_auto_continue 8";
  lua_policy "resolve.continue=label_goto";
  js_policy "resolve.continue=native_continue";
  python_policy "resolve.continue=native_continue";
  ls_policy "resolve.continue=native_continue";
}

let total = 0;

for (let value = 1; value < 6; value = value + 1) {
  if (value == 2) {
    continue;
  }
  if (value == 5) {
    break;
  }
  total = total + value;
}

console.log("meta_auto_continue", total);
