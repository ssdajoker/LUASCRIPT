/**
 * @file Implements the SymbolTable for contextual memory.
 * @author ssdajoker (Visionary)
 */

export type InferredType = 'number' | 'string' | 'boolean' | 'ambiguous' | 'unknown';

export interface Symbol {
  name: string;
  inferredType: InferredType;
}

export class SymbolTable {
  private symbols: Map<string, Symbol> = new Map();

  public define(name: string, inferredType: InferredType): void {
    const symbol: Symbol = { name, inferredType };
    this.symbols.set(name, symbol);
  }

  public lookup(name: string): Symbol | undefined {
    return this.symbols.get(name);
  }
}