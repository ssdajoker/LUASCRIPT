let smokeTotal = 0;
let i = 0;
while (i <= 10) {
  smokeTotal = smokeTotal + i;
  i = i + 1;
}
let smokeOk = smokeTotal === 55;

console.log("mirror_smoke", smokeTotal, smokeOk);
