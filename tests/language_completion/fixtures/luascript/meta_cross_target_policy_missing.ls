verify {
  diagnostic "emitted luascript output missing verify luascript_contains text: target javascript";
  ls_contains "target javascript";
}

meta {
  target python {
    requires python.print;
  }
}

console.log("missing_js_policy", 1);
