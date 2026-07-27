verify {
  diagnostic "async_unsupported";
}

meta profile portable_v1;

async function demo() {
  return 1;
}

console.log("meta_named_async", demo());
