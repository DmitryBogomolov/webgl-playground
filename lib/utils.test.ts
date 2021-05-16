import { generateDefaultIndexes, formatStr, throttle } from './utils';

describe('utils', () => {
    describe('generateDefaultIndexes', () => {
        it('create list', () => {
            expect(generateDefaultIndexes(8)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
        });
    });

    describe('formatStr', () => {
        function check(template: string, params: unknown[], expected: string): void {
            expect(formatStr(template, ...params)).toEqual(expected);
        }

        it('support no params', () => {
            check('hello', ['A'], 'hello');
        });

        it('support simple types', () => {
            check('hello {0}', ['A'], 'hello A');
            check('hello {0}', [1], 'hello 1');
            check('hello {0}', [true], 'hello true');
            check('hello {0}', [false], 'hello false');
            check('hello {0}', [null], 'hello null');
            check('hello {0}', [undefined], 'hello undefined');
        });

        it('support positions', () => {
            check('hello {0} {1}', ['A', 'B'], 'hello A B');
            check('hello {1} {0}', ['A', 'B'], 'hello B A');
            check('hello {0} {0}', ['A', 'B'], 'hello A A');
            check('hello {1} {1}', ['A', 'B'], 'hello B B');
        });

        it('support complex types', () => {
            check('hello {0}', [[1, 2, 3]], 'hello [1,2,3]');
            check('hello {0}', [{ a: 1, b: 2 }], 'hello {"a":1,"b":2}');
            check('hello {0}', [Symbol('1')], 'hello Symbol(1)');
        });
    });

    describe('throttle', () => {
        let spy: jest.SpyInstance;
        let now: number;

        beforeEach(() => {
            jest.useFakeTimers();
            now = Date.now();
            spy = jest.spyOn(Date, 'now').mockImplementation(() => now);
        });

        afterEach(() => {
            spy.mockRestore();
        });

        function advanceTime(timespan: number): void {
            jest.advanceTimersByTime(timespan);
            now += timespan;
        }

        it('call immediately on first call', () => {
            const stub = jest.fn();
            const func = throttle(stub, 4);

            func(1, 2);

            expect(stub.mock.calls).toEqual([[1, 2]]);

            advanceTime(5);

            expect(stub.mock.calls).toEqual([[1, 2]]);
        });

        it('skip sequential calls and perform last pending call', () => {
            const stub = jest.fn();
            const func = throttle(stub, 4);

            func(1, 2);
            func(3, 4, 5);
            func(6);
            func(7, 8);

            expect(stub.mock.calls).toEqual([[1, 2]]);

            advanceTime(5);

            expect(stub.mock.calls).toEqual([[1, 2], [7, 8]]);
        });

        it('call immediately on second call if enough time has passed', () => {
            const stub = jest.fn();
            const func = throttle(stub, 4);

            func(1, 2);
            advanceTime(5);
            func(3);

            expect(stub.mock.calls).toEqual([[1, 2], [3]]);
        });
    });
});
