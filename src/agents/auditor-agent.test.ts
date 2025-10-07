/**
 * @file Test suite for the AuditorAgent.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { AuditorAgent } from './auditor-agent';
import { SymbolTable } from '../core/symbol-table';
import type { TernaryASTNode } from './resolver-agent';

const createNode = (overrides: Partial<TernaryASTNode>): TernaryASTNode => ({
  type: 'Unknown',
  state: 1,
  source_text: overrides.source_text ?? 'unknown',
  potential_interpretations: overrides.potential_interpretations ?? [],
  children: overrides.children ?? [],
  semantic: overrides.semantic,
});

test('AuditorAgent flags contradictory symbol reassignments', () => {
  const agent = new AuditorAgent();
  const symbols = new SymbolTable();

  const ast: TernaryASTNode = {
    type: 'Program',
    state: 1,
    source_text: 'program',
    potential_interpretations: [],
    children: [
      createNode({
        type: 'VariableDeclaration',
        source_text: 'let x = 10;',
        semantic: { symbolName: 'x', inferredType: 'number' },
      }),
      createNode({
        type: 'AssignmentExpression',
        source_text: 'x = "hello";',
        semantic: { symbolName: 'x', inferredType: 'string' },
      }),
    ],
  };

  const findings = agent.audit(ast, symbols);

  assert.equal(findings.length, 1);
  assert.equal(findings[0].symbolName, 'x');
  assert.equal(findings[0].previousType, 'number');
  assert.equal(findings[0].conflictingType, 'string');
  assert.equal(findings[0].state, -1);
  assert.match(findings[0].message, /Symbol 'x'/);
});

test('AuditorAgent does not flag when encountering ambiguous information', () => {
  const agent = new AuditorAgent();
  const symbols = new SymbolTable();

  const ast: TernaryASTNode = {
    type: 'Program',
    state: 1,
    source_text: 'program',
    potential_interpretations: [],
    children: [
      createNode({
        type: 'VariableDeclaration',
        source_text: 'let value;',
        semantic: { symbolName: 'value', inferredType: 'unknown' },
      }),
      createNode({
        type: 'AssignmentExpression',
        source_text: 'value = maybe();',
        semantic: { symbolName: 'value', inferredType: 'ambiguous' },
      }),
    ],
  };

  const findings = agent.audit(ast, symbols);

  assert.equal(findings.length, 0);
});
