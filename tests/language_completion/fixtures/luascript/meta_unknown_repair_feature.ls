verify {
  diagnostic "Unsupported repair feature: coroutines";
}

repair {
  target lua {
    lower coroutines using packed_array;
  }
}

console.log("bad");
