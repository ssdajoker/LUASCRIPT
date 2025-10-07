/**
 * @file Test suite for the ResolverAgent.
 * @author ssdajoker (Visionary)
 */

import { ResolverAgent, TernaryASTNode } from './resolver-agent';

// Mocking a simplified PatternProber for test isolation.
const mockProber = {
  probe: (source: string): TernaryASTNode => {
    // This mock simulates finding an ambiguous node.
    if (source === 'ambiguous_code') {
      return {
        type: 'Program', state: 1, source_text: '', children: [
          {
            type: 'BinaryExpression', state: 0, source_text: 'a + b',
            potential_interpretations: [
              { type: 'NumericAddition', confidence: 0.5 },
              { type: 'StringConcatenation', confidence: 0.5 },
            ],
            children: [],
          }
        ],
        potential_interpretations: [],
      };
    }
    // This mock simulates finding no ambiguous nodes.
    return { type: 'Program', state: 1, source_text: '', children: [], potential_interpretations: [] };
  }
};


describe('ResolverAgent', () => {

  it('should find an ambiguous node and return a ResolutionProposition for it', () => {
    // ARRANGE
    const agent = new ResolverAgent();
    const ambiguousAST = mockProber.probe('ambiguous_code');

    // ACT
    const report = agent.analyze(ambiguousAST);

    // ASSERT
    expect(report).toHaveLength(1);
    const proposition = report[0];
    expect(proposition.message).toContain('is ambiguous');
    expect(proposition.resolutions).toHaveLength(2);
    expect(proposition.ambiguousNode.type).toBe('BinaryExpression');
  });

  it('should return an empty report for a fully resolved T-AST', () => {
    // ARRANGE
    const agent = new ResolverAgent();
    const resolvedAST = mockProber.probe('resolved_code');

    // ACT
    const report = agent.analyze(resolvedAST);

    // ASSERT
    expect(report).toHaveLength(0);
  });
});