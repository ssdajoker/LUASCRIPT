// Test regex matching
const char = '<';
console.log('char:', char);
console.log('char code:', char.charCodeAt(0));
console.log('/[+\\-*/%&|^<>=!?:]/.test(char):', /[+\-*/%&|^<>=!?:]/.test(char));
console.log('/[{}()[\\];,.]/.test(char):', /[{}()[\];,.]/.test(char));
