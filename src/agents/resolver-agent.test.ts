/**
 * @file Test suite for the ResolverAgent.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { ResolverAgent, TernaryASTNode } from './resolver-agent';

const mockProber = {
  probe: (source: string): TernaryASTNode => {
    if (source === 'ambiguous_code') {
      return {
        type: 'Program',
        state: 1,
        source_text: '',
        potential_interpretations: [],
        children: [
          {
            type: 'BinaryExpression',
            state: 0,
            source_text: 'a + b',
            potential_interpretations: [
              { type: 'NumericAddition', confidence: 0.5 },
              { type: 'StringConcatenation', confidence: 0.5 },
            ],
          },
        ],
      };
    }

    return {
      type: 'Program',
      state: 1,
      source_text: '',
      potential_interpretations: [],
      children: [],
    };
  },
};

test('ResolverAgent surfaces ambiguity nodes', () => {
  const agent = new ResolverAgent();
  const ambiguousAST = mockProber.probe('ambiguous_code');

  const report = agent.analyze(ambiguousAST);

  assert.equal(report.length, 1);
  const proposition = report[0];
  assert.match(proposition.message, /is ambiguous/);
  assert.equal(proposition.resolutions.length, 2);
  assert.equal(proposition.ambiguousNode.type, 'BinaryExpression');
});

test('ResolverAgent returns empty report when nothing is ambiguous', () => {
  const agent = new ResolverAgent();
  const resolvedAST = mockProber.probe('resolved_code');

  const report = agent.analyze(resolvedAST);

  assert.equal(report.length, 0);
});