import { memoize } from './memoizer';

describe('memoizer', () => {
    describe('memoize', () => {
        it('memoize function', () => {
            const func = jest.fn()
                .mockReturnValueOnce(1)
                .mockReturnValueOnce(2)
                .mockReturnValueOnce(3)
                .mockReturnValueOnce(4);
            const target = memoize(func);

            expect(target(1, 2)).toEqual(1);
            expect(target(1, 2)).toEqual(1);
            expect(target(1, 2)).toEqual(1);
            expect(func.mock.calls).toEqual([
                [1, 2],
            ]);

            expect(target()).toEqual(2);
            expect(target()).toEqual(2);
            expect(func.mock.calls).toEqual([
                [1, 2],
                [],
            ]);

            expect(target(1, 2)).toEqual(3);
            expect(target(1)).toEqual(4);
            expect(target(1)).toEqual(4);
            expect(func.mock.calls).toEqual([
                [1, 2],
                [],
                [1, 2],
                [1],
            ]);
        });
    });
});
