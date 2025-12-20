/**
 * Pattern Lowering Tests
 * Tests for ArrayPattern, ObjectPattern, RestElement, AssignmentPattern
 */

const { IRLowerer } = require('../../src/ir/lowerer');
const { IRBuilder } = require('../../src/ir/builder');
const { NodeCategory } = require('../../src/ir/nodes');

describe('Pattern Lowering', () => {
    let builder, lowerer;

    beforeEach(() => {
        builder = new IRBuilder();
        lowerer = new IRLowerer(builder);
    });

    test('lowerArrayPattern: simple array destructuring', () => {
        // Simulate: const [a, b] = arr;
        const arrayPattern = {
            type: 'ArrayPattern',
            elements: [
                { type: 'Identifier', name: 'a' },
                { type: 'Identifier', name: 'b' }
            ]
        };

        const result = lowerer.lowerArrayPattern(arrayPattern);
        
        expect(result.kind).toBe(NodeCategory.ARRAY_PATTERN);
        expect(result.elements).toHaveLength(2);
    });

    test('lowerArrayPattern: with null elements (holes)', () => {
        // Simulate: const [a, , c] = arr;
        const arrayPattern = {
            type: 'ArrayPattern',
            elements: [
                { type: 'Identifier', name: 'a' },
                null, // hole
                { type: 'Identifier', name: 'c' }
            ]
        };

        const result = lowerer.lowerArrayPattern(arrayPattern);
        
        expect(result.kind).toBe(NodeCategory.ARRAY_PATTERN);
        expect(result.elements).toHaveLength(3);
        expect(result.elements[1]).toBeNull();
    });

    test('lowerRestElement: rest parameter', () => {
        // Simulate: const [...rest] = arr;
        const restElement = {
            type: 'RestElement',
            argument: { type: 'Identifier', name: 'rest' }
        };

        const result = lowerer.lowerRestElement(restElement);
        
        expect(result.kind).toBe(NodeCategory.REST_ELEMENT);
        expect(result.argument).toBeDefined();
    });

    test('lowerAssignmentPattern: default value', () => {
        // Simulate: const [a = 10] = arr;
        const assignmentPattern = {
            type: 'AssignmentPattern',
            left: { type: 'Identifier', name: 'a' },
            right: { type: 'Literal', value: 10 }
        };

        const result = lowerer.lowerAssignmentPattern(assignmentPattern);
        
        expect(result.kind).toBe(NodeCategory.ASSIGNMENT_PATTERN);
        expect(result.left).toBeDefined();
        expect(result.right).toBeDefined();
    });

    test('lowerObjectPattern: simple object destructuring', () => {
        // Simulate: const {x, y} = obj;
        const objectPattern = {
            type: 'ObjectPattern',
            properties: [
                {
                    type: 'Property',
                    key: { type: 'Identifier', name: 'x' },
                    value: { type: 'Identifier', name: 'x' },
                    kind: 'init',
                    shorthand: true
                },
                {
                    type: 'Property',
                    key: { type: 'Identifier', name: 'y' },
                    value: { type: 'Identifier', name: 'y' },
                    kind: 'init',
                    shorthand: true
                }
            ]
        };

        const result = lowerer.lowerObjectPattern(objectPattern);
        
        expect(result.kind).toBe(NodeCategory.OBJECT_PATTERN);
        expect(result.properties).toHaveLength(2);
    });

    test('lowerArrayPattern: nested patterns', () => {
        // Simulate: const [[a, b], c] = arr;
        const arrayPattern = {
            type: 'ArrayPattern',
            elements: [
                {
                    type: 'ArrayPattern',
                    elements: [
                        { type: 'Identifier', name: 'a' },
                        { type: 'Identifier', name: 'b' }
                    ]
                },
                { type: 'Identifier', name: 'c' }
            ]
        };

        const result = lowerer.lowerArrayPattern(arrayPattern);
        
        expect(result.kind).toBe(NodeCategory.ARRAY_PATTERN);
        expect(result.elements).toHaveLength(2);
        // First element should be another ArrayPattern
        expect(typeof result.elements[0]).toBe('string'); // It's an ID reference
    });

    test('Pattern roundtrip: toJSON and fromJSON', () => {
        const { IRNode, ArrayPattern, ObjectPattern, RestElement, AssignmentPattern } = require('../../src/ir/nodes');
        
        // Create pattern nodes
        const arrayPattern = new ArrayPattern(['node_0', 'node_1']);
        const objectPattern = new ObjectPattern(['node_2', 'node_3']);
        const restElement = new RestElement('node_4');
        const assignmentPattern = new AssignmentPattern('node_5', 'node_6');
        
        // Serialize
        const arrayJSON = arrayPattern.toJSON();
        const objectJSON = objectPattern.toJSON();
        const restJSON = restElement.toJSON();
        const assignmentJSON = assignmentPattern.toJSON();
        
        // Deserialize
        const arrayRestored = IRNode.fromJSON(arrayJSON);
        const objectRestored = IRNode.fromJSON(objectJSON);
        const restRestored = IRNode.fromJSON(restJSON);
        const assignmentRestored = IRNode.fromJSON(assignmentJSON);
        
        // Verify
        expect(arrayRestored.kind).toBe(NodeCategory.ARRAY_PATTERN);
        expect(arrayRestored.elements).toEqual(['node_0', 'node_1']);
        
        expect(objectRestored.kind).toBe(NodeCategory.OBJECT_PATTERN);
        expect(objectRestored.properties).toEqual(['node_2', 'node_3']);
        
        expect(restRestored.kind).toBe(NodeCategory.REST_ELEMENT);
        expect(restRestored.argument).toBe('node_4');
        
        expect(assignmentRestored.kind).toBe(NodeCategory.ASSIGNMENT_PATTERN);
        expect(assignmentRestored.left).toBe('node_5');
        expect(assignmentRestored.right).toBe('node_6');
    });
});
