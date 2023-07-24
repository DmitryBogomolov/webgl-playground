import { memoize } from './memoizer';

describe('memoizer', () => {
    describe('memoize', () => {
        it('memoize function', () => {
            const func = jest.fn();
            const target = memoize(func);

            func.mockReturnValue(0);
            expect(target()).toEqual(0);
            expect(target()).toEqual(0);
            expect(func.mock.calls).toEqual([
                [],
            ]);

            func.mockReturnValue(1);
            expect(target(1, 2)).toEqual(1);
            expect(target(1, 2)).toEqual(1);
            expect(target(1, 2)).toEqual(1);
            expect(func.mock.calls).toEqual([
                [],
                [1, 2],
            ]);

            func.mockReturnValue(2);
            expect(target()).toEqual(2);
            expect(target()).toEqual(2);
            expect(func.mock.calls).toEqual([
                [],
                [1, 2],
                [],
            ]);

            func.mockReturnValue(3);
            expect(target(1, 2)).toEqual(3);
            expect(func.mock.calls).toEqual([
                [],
                [1, 2],
                [],
                [1, 2],
            ]);

            func.mockReturnValue(4);
            expect(target(1)).toEqual(4);
            expect(target(1)).toEqual(4);
            expect(func.mock.calls).toEqual([
                [],
                [1, 2],
                [],
                [1, 2],
                [1],
            ]);
        });

        it('memoize with custom comparator', () => {
            const func = jest.fn();
            const cmp = jest.fn();
            const target = memoize(func, cmp);

            func.mockReturnValue(1);
            expect(target()).toEqual(1);
            expect(func.mock.calls).toEqual([
                [],
            ]);
            expect(cmp.mock.calls).toEqual([]);

            cmp.mockReturnValue(true);
            expect(target()).toEqual(1);
            expect(func.mock.calls).toEqual([
                [],
            ]);
            expect(cmp.mock.calls).toEqual([
                [[], []],
            ]);

            expect(target(1)).toEqual(1);
            expect(func.mock.calls).toEqual([
                [],
            ]);
            expect(cmp.mock.calls).toEqual([
                [[], []],
                [[], [1]],
            ]);

            func.mockReturnValue(2);
            cmp.mockReturnValue(false);
            expect(target('a', 'b')).toEqual(2);
            expect(func.mock.calls).toEqual([
                [],
                ['a', 'b'],
            ]);
            expect(cmp.mock.calls).toEqual([
                [[], []],
                [[], [1]],
                [[], ['a', 'b']],
            ]);

            func.mockReturnValue(3);
            expect(target('a', 'b', 'c')).toEqual(3);
            expect(func.mock.calls).toEqual([
                [],
                ['a', 'b'],
                ['a', 'b', 'c'],
            ]);
            expect(cmp.mock.calls).toEqual([
                [[], []],
                [[], [1]],
                [[], ['a', 'b']],
                [['a', 'b'], ['a', 'b', 'c']],
            ]);

            cmp.mockReturnValue(true);
            expect(target(1, 2)).toEqual(3);
            expect(target(1, 2, 3)).toEqual(3);
            expect(func.mock.calls).toEqual([
                [],
                ['a', 'b'],
                ['a', 'b', 'c'],
            ]);
            expect(cmp.mock.calls).toEqual([
                [[], []],
                [[], [1]],
                [[], ['a', 'b']],
                [['a', 'b'], ['a', 'b', 'c']],
                [['a', 'b', 'c'], [1, 2]],
                [['a', 'b', 'c'], [1, 2, 3]],
            ]);
        });
    });
});
