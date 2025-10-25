/**
 * @file Implements the AuditorAgent responsible for contradiction detection.
 */

import { SymbolTable } from '../core/symbol-table';
import type { InferredType } from '../core/symbol-table';
import type { TernaryASTNode } from './resolver-agent';

export interface AuditFinding {
  node: TernaryASTNode;
  symbolName: string;
  previousType: InferredType;
  conflictingType: InferredType;
  message: string;
  state: -1;
}

export class AuditorAgent {
  public audit(rootNode: TernaryASTNode, symbolTable: SymbolTable = new SymbolTable()): AuditFinding[] {
    const findings: AuditFinding[] = [];
    this.traverse(rootNode, symbolTable, findings);
    return findings;
  }

  private traverse(node: TernaryASTNode, symbolTable: SymbolTable, findings: AuditFinding[]): void {
    this.evaluateNode(node, symbolTable, findings);

    for (const child of node.children ?? []) {
      this.traverse(child, symbolTable, findings);
    }
  }

  private evaluateNode(node: TernaryASTNode, symbolTable: SymbolTable, findings: AuditFinding[]): void {
    const symbolName = node.semantic?.symbolName;
    const inferredType = node.semantic?.inferredType;

    if (!symbolName || !inferredType) {
      return;
    }

    const previous = symbolTable.lookup(symbolName);
    if (previous && this.isContradiction(previous.inferredType, inferredType)) {
      findings.push({
        node,
        symbolName,
        previousType: previous.inferredType,
        conflictingType: inferredType,
        message: this.composeMessage(symbolName, previous.inferredType, inferredType, node.source_text),
        state: -1,
      });
    }

    symbolTable.define(symbolName, inferredType, {
      nodeType: node.type,
      sourceText: node.source_text,
    });
  }

  private isContradiction(previous: InferredType, next: InferredType): boolean {
    if (!this.isConcrete(previous) || !this.isConcrete(next)) {
      return false;
    }

    return previous !== next;
  }

  private isConcrete(type: InferredType): boolean {
    return type !== 'ambiguous' && type !== 'unknown';
  }

  private composeMessage(symbol: string, previous: InferredType, next: InferredType, sourceText: string): string {
    return `Symbol '${symbol}' changed from ${previous} to ${next}, indicating a contradiction at '${sourceText}'.`;
  }
}
