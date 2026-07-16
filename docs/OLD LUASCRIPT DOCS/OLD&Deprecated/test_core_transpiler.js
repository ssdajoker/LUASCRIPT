const esprima = require('esprima');

// Simulate the isStringNode method
function isStringNode(node) {
    return node.type === 'Literal' && typeof node.value === 'string';
}

// Simulate the getLuaOperator method
function getLuaOperator(operator, isLeftString = false, isRightString = false) {
    if (operator === '+' && (isLeftString || isRightString)) {
        return '..';
    }
    switch (operator) {
        case '===':
            return '==';
        case '!==':
        case '!=':
            return '~=';
        case '&&':
            return 'and';
        case '||':
            return 'or';
        default:
            return operator;
    }
}

// Test cases
const testCases = [
    { code: '"Hello, " + name', description: 'String literal + identifier' },
    { code: 'name + "!"', description: 'Identifier + string literal' },
    { code: 'a + b', description: 'Identifier + identifier (ambiguous)' },
    { code: '5 + 3', description: 'Number + number' },
    { code: '"Hello" + " " + "World"', description: 'String + string + string' },
];

console.log("Testing core_transpiler logic:\n");

for (const testCase of testCases) {
    console.log(`Test: ${testCase.description}`);
    console.log(`  Code: ${testCase.code}`);
    
    try {
        const ast = esprima.parseScript(testCase.code);
        const expr = ast.body[0].expression;
        
        if (expr.type === 'BinaryExpression') {
            const isLeft = isStringNode(expr.left);
            const isRight = isStringNode(expr.right);
            const operator = getLuaOperator(expr.operator, isLeft, isRight);
            
            console.log(`  Left is string? ${isLeft}`);
            console.log(`  Right is string? ${isRight}`);
            console.log(`  Operator: ${operator}`);
            console.log(`  ✓ Result: Uses '${operator}'`);
        }
    } catch (err) {
        console.log(`  ✗ Error: ${err.message}`);
    }
    console.log();
}
