/**
 * @file Implements the ResolverAgent, our first intelligent entity.
 * @author ssdajoker (Visionary)
 */

import type { InferredType } from '../core/symbol-table';

// Note: You will need to create or import these types from your existing files.
// This is a placeholder structure.
export interface NodeSemanticInfo {
  symbolName?: string;
  inferredType?: InferredType;
}

export interface SourcePosition {
  line: number;
  column: number;
}

export interface SourceRange {
  start: SourcePosition;
  end: SourcePosition;
}

export interface TernaryASTNode {
  type: string;
  state: number; // 0 for ambiguous, 1 for certain, -1 for contradiction
  source_text: string;
  potential_interpretations: { type: string; confidence: number }[];
  children?: TernaryASTNode[];
  semantic?: NodeSemanticInfo;
  range?: SourceRange;
}

export interface ResolutionProposition {
  ambiguousNode: TernaryASTNode;
  message: string;
  resolutions: {
    description: string;
    confidence: number;
  }[];
}

export class ResolverAgent {
  public analyze(rootNode: TernaryASTNode): ResolutionProposition[] {
    const report: ResolutionProposition[] = [];
    this.traverse(rootNode, report);
    return report;
  }

  private traverse(node: TernaryASTNode, report: ResolutionProposition[]): void {
    if (node.state === 0 && node.potential_interpretations.length > 0) {
      report.push(this.createProposition(node));
    }
    for (const child of node.children ?? []) {
      this.traverse(child, report);
    }
  }

  private createProposition(node: TernaryASTNode): ResolutionProposition {
    return {
      ambiguousNode: node,
      message: `The expression '${node.source_text}' of type '${node.type}' is ambiguous.`,
      resolutions: node.potential_interpretations.map(interp => ({
        description: `Resolve as ${interp.type}`,
        confidence: interp.confidence,
      })),
    };
  }
}