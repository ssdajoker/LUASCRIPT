verify {
  diagnostic "Forbidden LUASCRIPT implicit profile assertion present: portable_semantics_v1";
  no_implicit_profile "portable_semantics_v1";
}

console.log("meta_implicit_profile_forbidden_present", 1);
