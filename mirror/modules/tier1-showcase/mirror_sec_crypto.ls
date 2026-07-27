let bytes = [1, 2, 3];
let checksum = 0;
for (let byte of bytes) {
  checksum = checksum + byte;
}
console.log("mirror_sec_crypto", checksum);
