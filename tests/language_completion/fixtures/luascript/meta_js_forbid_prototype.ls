meta {
  target javascript {
    forbid js.prototype;
  }
}

let proto = Thing.prototype;
console.log("bad_js_proto", proto);
