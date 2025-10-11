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
 * Represents a symbol in the symbol table.
 */
export interface Symbol {
  /** The name of the symbol. */
  name: string;
  /** The inferred type of the symbol. */
  inferredType: InferredType;
}

/**
 * Manages symbols for a given scope in the transpiled code.
 * This table stores information about variables, functions, and other identifiers.
 */
export class SymbolTable {
  private symbols: Map<string, Symbol> = new Map();

  /**
   * Defines a new symbol in the table.
   * If a symbol with the same name already exists, it will be overwritten.
   * @param name - The name of the symbol to define.
   * @param inferredType - The inferred type of the symbol.
   */
  public define(name: string, inferredType: InferredType): void {
    const symbol: Symbol = { name, inferredType };
    this.symbols.set(name, symbol);
  }

  /**
   * Looks up a symbol in the table by its name.
   * @param name - The name of the symbol to look up.
   * @returns The found symbol, or `undefined` if the symbol does not exist.
   */
  public lookup(name: string): Symbol | undefined {
    return this.symbols.get(name);
  }
}