/**
 * Tests for the SimpleParser and Tokenizer supporting if/else.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { SimpleParser } from './parser';

const sampleSource = `
let x = 10;
if (x > 5) {
  x = x + 1;
} else {
  x = x - 1;
}
`;

test('SimpleParser builds AST with if/else blocks', () => {
  const parser = new SimpleParser(sampleSource);
  const ast = parser.parseProgram();

  assert.equal(ast.type, 'Program');
  assert.equal(ast.children?.length, 2);

  const [declaration, ifStatement] = ast.children ?? [];
  assert.equal(declaration?.type, 'VariableDeclaration');
  assert.equal(ifStatement?.type, 'IfStatement');

  const [condition, consequent, alternate] = ifStatement?.children ?? [];
  assert.equal(condition?.type, 'BinaryExpression');
  assert.equal(consequent?.type, 'BlockStatement');
  assert.equal(alternate?.type, 'BlockStatement');

  assert.equal(ifStatement?.range?.start.line, 2);
  assert.equal(ifStatement?.range?.start.column, 0);
});

test('SimpleParser infers assignment semantics for auditor', () => {
  const parser = new SimpleParser('let status = "idle"; status = "running";');
  const ast = parser.parseProgram();

  assert.equal(ast.children?.length, 2);
  const assignment = ast.children?.[1];
  assert.equal(assignment?.type, 'ExpressionStatement');

  const assignNode = assignment?.children?.[0];
  assert.equal(assignNode?.semantic?.symbolName, 'status');
  assert.equal(assignNode?.semantic?.inferredType, 'string');
});
