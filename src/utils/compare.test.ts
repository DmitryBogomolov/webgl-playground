import { compareArrays, compareObjects } from './compare';

describe('compare', () => {
    describe('compareArrays', () => {
        it('compare arrays', () => {
            expect(compareArrays(null as unknown as [], null as unknown as [])).toEqual(true);
            expect(compareArrays(null as unknown as [], 1 as unknown as [])).toEqual(false);
            expect(compareArrays(1 as unknown as [], null as unknown as [])).toEqual(false);
            expect(compareArrays([], [])).toEqual(true);
            expect(compareArrays([], [1])).toEqual(false);
            expect(compareArrays([1], [])).toEqual(false);
            expect(compareArrays([2], [2])).toEqual(true);
            expect(compareArrays(['a', 2, null], ['a', 3, null])).toEqual(false);
            expect(compareArrays(['a', 2], ['a', 3, null])).toEqual(false);
            expect(compareArrays(['a', 2, null], ['a', null])).toEqual(false);
            expect(compareArrays(['a', 2, null], ['a', 2, null])).toEqual(true);
        });

        it('compare arrays with custom comparator', () => {
            const cmp1 = jest.fn().mockReturnValue(false);
            expect(compareArrays([1, null, 'test'], [1, null, 'test'], cmp1)).toEqual(false);
            expect(cmp1.mock.calls).toEqual([
                [1, 1],
            ]);

            const cmp2 = jest.fn().mockReturnValue(true);
            expect(compareArrays([2, 3, 4], [4, 5, 1], cmp2)).toEqual(true);
            expect(cmp2.mock.calls).toEqual([
                [2, 4],
                [3, 5],
                [4, 1],
            ]);
        });
    });

    describe('compareObjects', () => {
        it('compare objects', () => {
            expect(compareObjects(null as unknown as object, null as unknown as object)).toEqual(true);
            expect(compareObjects(1 as unknown as object, null as unknown as object)).toEqual(false);
            expect(compareObjects(null as unknown as object, 1 as unknown as object)).toEqual(false);
            expect(compareObjects({}, {})).toEqual(true);
            expect(compareObjects({ a: 1 }, { b: 'test' })).toEqual(false);
            expect(compareObjects({ b: 'test' }, { a: 1 })).toEqual(false);
            expect(compareObjects({ a: 1 }, { a: 1 })).toEqual(true);
            expect(compareObjects({ a: 1, b: 'test' }, { a: 1 })).toEqual(false);
            expect(compareObjects({ a: 1 }, { a: 1, b: 'test' })).toEqual(false);
            expect(compareObjects({ a: 1, b: 'test' }, { b: 'test', a: 1 })).toEqual(true);
        });

        it('compare objects with custom comparator', () => {
            const cmp1 = jest.fn().mockReturnValue(false);
            expect(compareObjects({ a: 1, b: 'test' }, { b: 'test', a: 1 }, cmp1)).toEqual(false);
            expect(cmp1.mock.calls).toEqual([
                [1, 1],
            ]);

            const cmp2 = jest.fn().mockReturnValue(true);
            expect(compareObjects({ a: 1, b: 'test1' }, { b: 'test2', a: 2 }, cmp2)).toEqual(true);
            expect(cmp2.mock.calls).toEqual([
                [1, 2],
                ['test1', 'test2'],
            ]);
        });
    });
});
