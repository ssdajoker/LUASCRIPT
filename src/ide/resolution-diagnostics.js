/**
 * Adapter to transform ResolverAgent reports into VS Code style diagnostics.
 * This file mirrors the TypeScript implementation in resolution-diagnostics.ts.
 */

const DEFAULT_SEVERITY = 'warning';
const DEFAULT_SOURCE = 'ResolverAgent';
const DEFAULT_CODE = 'RESOLVER_AMBIGUITY';

function mapPropositionsToDiagnostics(filePath, propositions) {
  return propositions.map(proposition => {
    const node = proposition.ambiguousNode || {};
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

function deriveRange(node) {
  const sourceText = node.source_text || '';
  const length = sourceText.length;
  const start = (node.range && node.range.start) || { line: 0, column: 0 };
  const end = (node.range && node.range.end) || {
    line: start.line,
    column: start.column + Math.max(length, 1)
  };

  return {
    startLine: start.line,
    startColumn: start.column,
    endLine: end.line,
    endColumn: end.column
  };
}

function buildHoverMessage(proposition) {
  const resolutions = proposition.resolutions || [];
  if (!resolutions.length) {
    return proposition.message;
  }

  const interpretationLines = resolutions
    .map(resolution => {
      const confidence = typeof resolution.confidence === 'number'
        ? (resolution.confidence * 100).toFixed(1)
        : 'N/A';
      return `• ${resolution.description} (confidence ${confidence}%)`;
    })
    .join('\n');

  return `${proposition.message}\n\n${interpretationLines}`;
}

module.exports = {
  mapPropositionsToDiagnostics,
};
