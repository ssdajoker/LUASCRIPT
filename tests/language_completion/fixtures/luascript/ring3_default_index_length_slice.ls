let values = [5, 7, 9, 11];
let word = "abcd";

values[1] = 8;
values[0] = values[0] + 5;

let char = word[1];
let wordLength = word.length;
let part = word.slice(1, 3);
let second = values[1];
let third = values[2];
let listPart = values.slice(1, 3);
let listFirst = listPart[0];
let listPartLength = listPart.length;
let first = values[0];

console.log("ring3_default", char, wordLength, part, second, third, listFirst, listPartLength, first);
