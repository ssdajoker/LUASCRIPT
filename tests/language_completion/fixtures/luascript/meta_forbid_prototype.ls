meta {
  target lua {
    forbid js.prototype;
  }
}

let proto = Thing.prototype;
console.log("bad_proto", proto);
