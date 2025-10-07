/**
 * @file Test suite for resolution diagnostic mapping utilities.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { mapPropositionsToDiagnostics } from './resolution-diagnostics';
import type { ResolutionProposition, TernaryASTNode } from '../agents/resolver-agent';

const createNode = (overrides: Partial<TernaryASTNode>): TernaryASTNode => ({
  type: overrides.type ?? 'BinaryExpression',
  state: overrides.state ?? 0,
  source_text: overrides.source_text ?? 'a + b',
  potential_interpretations: overrides.potential_interpretations ?? [],
  children: overrides.children,
  semantic: overrides.semantic,
  range: overrides.range,
});

test('mapPropositionsToDiagnostics builds hover details with confidence levels', () => {
  const node = createNode({
    range: {
      start: { line: 2, column: 4 },
      end: { line: 2, column: 9 },
    },
  });

  const propositions: ResolutionProposition[] = [
    {
      ambiguousNode: node,
      message: "The expression 'a + b' of type 'BinaryExpression' is ambiguous.",
      resolutions: [
        { description: 'Resolve as NumericAddition', confidence: 0.7 },
        { description: 'Resolve as StringConcatenation', confidence: 0.3 },
      ],
    },
  ];

  const diagnostics = mapPropositionsToDiagnostics('example.ts', propositions);

  assert.equal(diagnostics.length, 1);
  const diagnostic = diagnostics[0];
  assert.equal(diagnostic.filePath, 'example.ts');
  assert.equal(diagnostic.severity, 'warning');
  assert.match(diagnostic.hoverMessage, /NumericAddition/);
  assert.equal(diagnostic.range.startLine, 2);
  assert.equal(diagnostic.range.startColumn, 4);
  assert.equal(diagnostic.range.endColumn, 9);
});

test('mapPropositionsToDiagnostics provides fallback range when none supplied', () => {
  const node = createNode({ range: undefined, source_text: 'foo' });
  const propositions: ResolutionProposition[] = [
    {
      ambiguousNode: node,
      message: 'Ambiguous expression',
      resolutions: [],
    },
  ];

  const [diagnostic] = mapPropositionsToDiagnostics('file.ts', propositions);

  assert.equal(diagnostic.range.startLine, 0);
  assert.equal(diagnostic.range.startColumn, 0);
  assert.equal(diagnostic.range.endColumn, 3);
  assert.equal(diagnostic.hoverMessage, 'Ambiguous expression');
});
