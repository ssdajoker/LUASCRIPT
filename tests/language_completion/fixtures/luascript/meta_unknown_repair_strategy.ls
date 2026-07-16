verify {
  diagnostic "Unsupported repair strategy for indexing: one_based";
}

repair {
  target lua {
    lower indexing using one_based;
  }
}

console.log("bad");
