const { RubyParser } = require('./src/parsers/ruby_parser');

const p = new RubyParser();
const code = 'x = 10';
console.log('Tokenizing:', code);

// Manual tokenize to debug
const lines = code.split("\n");
const tokens = [];
for (let line of lines) {
  line = line.replace(/#.*$/, "");
  console.log('Line:', JSON.stringify(line));
  
  const tokenPatterns = [
    { type: "KEYWORD", pattern: /\b(def|end|class|if|elsif|else|unless|while|until|for|in|do|return|yield|break|next|case|when|then|begin|rescue|ensure|module|puts|print|require|super|self|true|false|nil|and|or|not)\b/gi },
    { type: "OPERATOR", pattern: /===|==|!=|<=|>=|<=>|&&|\|\||\.\.|\*\*|[+\-*/%&|^<>=!~]+/ },
    { type: "IDENTIFIER", pattern: /[a-zA-Z_]\w*/ },
    { type: "NUMBER", pattern: /\d+(\.\d+)?/ },
    { type: "STRING", pattern: /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/ },
    { type: "PUNCTUATION", pattern: /[(){}[\],;:.]/ },
    { type: "WHITESPACE", pattern: /\s+/ },
  ];
  
  let pos = 0;
  while (pos < line.length) {
    console.log(`  pos=${pos}, char='${line[pos]}', rest='${line.substring(pos)}'`);
    let matched = false;

    for (const { type, pattern } of tokenPatterns) {
      const regex = new RegExp(`^${pattern.source}`, "i");
      const match = line.slice(pos).match(regex);

      if (match) {
        console.log(`    MATCH: ${type} '${match[0]}'`);
        if (type !== "WHITESPACE" && type !== "COMMENT") {
          tokens.push({
            type,
            value: match[0],
            position: pos,
          });
        }
        pos += match[0].length;
        matched = true;
        break;
      }
    }

    if (!matched) {
      console.log(`    NO MATCH, skipping 1 char`);
      pos++;
    }
  }
}

console.log('\nTokens:', tokens.map(t => `${t.type}:${t.value}`).join(' '));

