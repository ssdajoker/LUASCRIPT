/* eslint-env jest */

const { IRNode, NodeCategory, fromJsonHandlers } = require('../../src/ir/nodes');

describe('IRNode.fromJSON handler map', () => {
    test('includes a handler for every NodeCategory', () => {
        const missingHandlers = Object.values(NodeCategory).filter(
            kind => typeof fromJsonHandlers[kind] !== 'function'
        );

        expect(missingHandlers).toEqual([]);
    });

    test('throws a descriptive error when handler is missing', () => {
        expect(() => IRNode.fromJSON({ kind: 'NonExistentKind' }))
            .toThrow('No fromJSON handler registered for node kind: NonExistentKind');
    });
});
