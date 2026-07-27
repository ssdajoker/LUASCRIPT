let config = { enabled: true, limit: 3 };
let total = 0;

while (total < config.limit) {
  total = total + 1;
}

console.log("object_loop_state", config.enabled, total);
