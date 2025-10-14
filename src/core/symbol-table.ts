/**
 * @file Implements the SymbolTable for contextual memory.
 * @author ssdajoker (Visionary)
 */

/**
 * Represents the inferred type of a symbol.
 * - `number`: A numeric value.
 * - `string`: A string value.
 * - `boolean`: A boolean value.
 * - `ambiguous`: The type could not be definitively determined between multiple possibilities.
 * - `unknown`: The type is completely unknown.
 */
export type InferredType = 'number' | 'string' | 'boolean' | 'ambiguous' | 'unknown';
/**
 * Additional metadata about where and how a symbol was observed.
 */
export interface SymbolSourceContext {
  nodeType?: string;
  sourceText?: string;
  location?: { line: number; column: number };
}

/**
 * A single observation of a symbol's inferred type and optional source context.
 */
export interface SymbolObservation {
  inferredType: InferredType;
  timestamp: number;
  source?: SymbolSourceContext;
}
export interface Symbol {
  /** The name of the symbol. */
  name: string;
  /** The inferred type of the symbol. */
  inferredType: InferredType;
  history: SymbolObservation[];
}

/**
 * Manages symbols for a given scope in the transpiled code.
 * This table stores information about variables, functions, and other identifiers.
 */
export class SymbolTable {
  private readonly symbols: Map<string, Symbol> = new Map();
  /**
   * Defines or updates a symbol in the table.
   * If a symbol with the same name already exists, a new observation is appended
   * and the current inferred type is updated.
   * @param name - The name of the symbol to define/update.
   * @param inferredType - The inferred type of the symbol.
   * @param source - Optional metadata about the symbol's source context.
   */
  public define(name: string, inferredType: InferredType, source?: SymbolSourceContext): void {
    const observation: SymbolObservation = { inferredType, source, timestamp: Date.now() };
    const existing = this.symbols.get(name);

    if (!existing) {
      this.symbols.set(name, {
        name,
        inferredType,
        history: [observation],
      });
      return;
    }

    existing.history.push(observation);
    existing.inferredType = inferredType;
  }

  /**
   * Looks up a symbol in the table by its name.
   * @param name - The name of the symbol to look up.
   * @returns The found symbol, or `undefined` if the symbol does not exist.
   */
  public lookup(name: string): Symbol | undefined {
    const symbol = this.symbols.get(name);
    return symbol ? { ...symbol, history: [...symbol.history] } : undefined;
  }

  public getHistory(name: string): SymbolObservation[] {
    const symbol = this.symbols.get(name);
    return symbol ? [...symbol.history] : [];
  }

  public getAllSymbols(): Symbol[] {
    return Array.from(this.symbols.values()).map(symbol => ({
      ...symbol,
      history: [...symbol.history],
    }));
  }

  public clear(): void {
    this.symbols.clear();
  }

  /** Returns true if a symbol by this name exists. */
  public has(name: string): boolean {
    return this.symbols.has(name);
  }

  /** Deletes a symbol by name; returns true if it existed. */
  public remove(name: string): boolean {
    return this.symbols.delete(name);
  }

  /**
   * Renames an existing symbol while preserving its observation history.
   * If the new name already exists, the histories are concatenated and the
   * inferredType of the destination takes precedence.
   * Returns true when a rename occurred.
   */
  public rename(oldName: string, newName: string): boolean {
    if (oldName === newName) return this.symbols.has(oldName);
    const from = this.symbols.get(oldName);
    if (!from) return false;
    const to = this.symbols.get(newName);
    if (!to) {
      this.symbols.set(newName, { ...from, name: newName, history: [...from.history] });
      this.symbols.delete(oldName);
      return true;
    }
    // Merge histories, keep destination inferredType
    const mergedHistory = [...to.history, ...from.history];
    this.symbols.set(newName, { ...to, history: mergedHistory });
    this.symbols.delete(oldName);
    return true;
  }

  /** Number of symbols tracked. */
  public size(): number {
    return this.symbols.size;
  }
}