meta profile portable_v1;

verify {
  diagnostic "Missing LUASCRIPT profile assertion: portable_semantics_v1";
  profile "portable_semantics_v1";
}

console.log("meta_profile_assertion_missing", 1);
