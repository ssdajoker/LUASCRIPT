/**
 * @file Test suite for the SymbolTable module.
 * @author ssdajoker (Visionary)
 */

import { SymbolTable, InferredType } from './symbol-table';

describe('SymbolTable', () => {
  let table: SymbolTable;

  beforeEach(() => {
    table = new SymbolTable();
  });

  it('should be able to define and look up a symbol', () => {
    const symbolName = 'x';
    const symbolType: InferredType = 'number';
    table.define(symbolName, symbolType);
    const foundSymbol = table.lookup(symbolName);
    expect(foundSymbol).toBeDefined();
    if (foundSymbol) {
      expect(foundSymbol.name).toBe(symbolName);
      expect(foundSymbol.inferredType).toBe(symbolType);
    }
  });

  it('should return undefined for a symbol that does not exist', () => {
    const foundSymbol = table.lookup('non_existent_variable');
    expect(foundSymbol).toBeUndefined();
  });
});/**