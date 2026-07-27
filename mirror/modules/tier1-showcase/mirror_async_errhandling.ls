let status = "recover";
let result = "pending";
if (status === "recover") {
  result = "handled";
} else {
  result = "failed";
}
console.log("mirror_async_errhandling", result);
