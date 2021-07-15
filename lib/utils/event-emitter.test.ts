import { EventEmitter } from './event-emitter';

describe('event-emitter', () => {
    describe('EventEmitter', () => {
        it('emit events', () => {
            const emitter = new EventEmitter<number>();
            const stub1 = jest.fn();
            const stub2 = jest.fn();
            emitter.emit(0);

            emitter.on(stub1);
            emitter.emit(1);

            emitter.emit(2);

            emitter.on(stub2);
            emitter.emit(3);

            expect(stub1.mock.calls).toEqual([
                [1],
                [2],
                [3],
            ]);
            expect(stub2.mock.calls).toEqual([
                [3],
            ]);
        });

        it('cancel subscriptions', () => {
            const emitter = new EventEmitter<number>();
            const stub1 = jest.fn();
            const stub2 = jest.fn();
            const cancel1 = emitter.on(stub1);
            const cancel2 = emitter.on(stub2);

            emitter.emit(0);
            cancel1();

            emitter.emit(1);
            cancel2();

            emitter.emit(2);

            expect(stub1.mock.calls).toEqual([
                [0],
            ]);
            expect(stub2.mock.calls).toEqual([
                [0],
                [1],
            ]);
        });

        it('do not add or remove subscriptions twice', () => {
            const emitter = new EventEmitter<number>();
            const stub = jest.fn();
            const cancel1 = emitter.on(stub);
            const cancel2 = emitter.on(stub);

            emitter.emit(0);
            expect(stub.mock.calls).toEqual([
                [0],
            ]);

            cancel2();
            emitter.emit(1);
            expect(stub.mock.calls).toEqual([
                [0],
                [1],
            ]);

            cancel1();
            emitter.emit(2);
            expect(stub.mock.calls).toEqual([
                [0],
                [1],
            ]);

            cancel1();
            cancel2();
        });
    });
});
