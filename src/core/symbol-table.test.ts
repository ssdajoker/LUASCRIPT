/**
 * @file Test suite for the SymbolTable module.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { SymbolTable, InferredType } from './symbol-table';

test('SymbolTable defines and looks up symbols', () => {
  const table = new SymbolTable();
  const symbolName = 'x';
  const symbolType: InferredType = 'number';

  table.define(symbolName, symbolType);
  const foundSymbol = table.lookup(symbolName);

  assert.ok(foundSymbol, 'symbol should exist');
  assert.equal(foundSymbol?.name, symbolName);
  assert.equal(foundSymbol?.inferredType, symbolType);
});

test('SymbolTable returns undefined for unknown symbols', () => {
  const table = new SymbolTable();
  const foundSymbol = table.lookup('non_existent_variable');
  assert.equal(foundSymbol, undefined);
});

test('SymbolTable maintains observation history for each symbol', () => {
  const table = new SymbolTable();

  table.define('x', 'number', { sourceText: 'let x = 10;' });
  table.define('x', 'string', { sourceText: 'x = "hello";' });

  const history = table.getHistory('x');
  assert.equal(history.length, 2);
  assert.equal(history[0].inferredType, 'number');
  assert.equal(history[1].inferredType, 'string');
  assert.equal(history[0].source?.sourceText, 'let x = 10;');
});