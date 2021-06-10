import { throttle } from './throttler';

describe('throttler', () => {
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
