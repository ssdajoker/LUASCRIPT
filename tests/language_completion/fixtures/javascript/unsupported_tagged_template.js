function tag(parts, value) {
  return parts[0] + value;
}

console.log(tag`tagged ${1}`);
