function step(value) { return value + 1; }
let state = 0;
let ticks = 0;
while (ticks < 3) {
  state = step(state);
  ticks = ticks + 1;
}
console.log("mirror_async_coroutines", state);
