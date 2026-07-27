meta profile portable_v1;

verify {
  diagnostic "Forbidden LUASCRIPT profile assertion present: portable_v1";
  no_profile "portable_v1";
}

console.log("meta_profile_forbidden_present", 1);
