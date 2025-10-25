/**
 * @file Provides utilities to convert ResolverAgent reports into editor diagnostics.
 */

import type { ResolutionProposition, TernaryASTNode } from '../agents/resolver-agent';

export type DiagnosticSeverity = 'info' | 'warning' | 'error';

export interface DiagnosticRange {
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}

export interface EditorDiagnostic {
  filePath: string;
  message: string;
  summary: string;
  hoverMessage: string;
  range: DiagnosticRange;
  severity: DiagnosticSeverity;
  source: string;
  code: string;
}

const DEFAULT_SEVERITY: DiagnosticSeverity = 'warning';
const DEFAULT_SOURCE = 'ResolverAgent';
const DEFAULT_CODE = 'RESOLVER_AMBIGUITY';

export function mapPropositionsToDiagnostics(filePath: string, propositions: ResolutionProposition[]): EditorDiagnostic[] {
  return propositions.map(proposition => {
    const node = proposition.ambiguousNode;
    const range = deriveRange(node);
    const hoverMessage = buildHoverMessage(proposition);

    return {
      filePath,
      message: proposition.message,
      summary: proposition.message,
      hoverMessage,
      range,
      severity: DEFAULT_SEVERITY,
      source: DEFAULT_SOURCE,
      code: DEFAULT_CODE,
    };
  });
}

function deriveRange(node: TernaryASTNode): DiagnosticRange {
  const length = node.source_text.length;
  const startLine = node.range?.start.line ?? 0;
  const startColumn = node.range?.start.column ?? 0;
  const endLine = node.range?.end.line ?? startLine;
  const endColumn = node.range?.end.column ?? startColumn + Math.max(length, 1);

  return { startLine, startColumn, endLine, endColumn };
}

function buildHoverMessage(proposition: ResolutionProposition): string {
  if (!proposition.resolutions.length) {
    return proposition.message;
  }

  const interpretationLines = proposition.resolutions
    .map(resolution => `• ${resolution.description} (confidence ${(resolution.confidence * 100).toFixed(1)}%)`)
    .join('\n');

  return `${proposition.message}\n\n${interpretationLines}`;
}
