import { EventEmitter, eventOnce, eventWait } from './event-emitter';

describe('event-emitter', () => {
    describe('EventEmitter', () => {
        it('emit events', () => {
            const emitter = new EventEmitter<[number]>();
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
            const emitter = new EventEmitter<[number]>();
            const stub1 = jest.fn();
            const stub2 = jest.fn();
            emitter.on(stub1);
            emitter.on(stub2);

            emitter.emit(0);
            emitter.off(stub1);

            emitter.emit(1);
            emitter.off(stub2);

            emitter.emit(2);

            expect(stub1.mock.calls).toEqual([
                [0],
            ]);
            expect(stub2.mock.calls).toEqual([
                [0],
                [1],
            ]);
        });

        it('add or remove listeners twice', () => {
            const emitter = new EventEmitter<[number]>();
            const stub = jest.fn();
            emitter.on(stub);
            emitter.on(stub);

            emitter.emit(0);
            expect(stub.mock.calls).toEqual([
                [0],
                [0],
            ]);

            emitter.off(stub);
            emitter.emit(1);
            expect(stub.mock.calls).toEqual([
                [0],
                [0],
                [1],
            ]);

            emitter.off(stub);
            emitter.emit(2);
            expect(stub.mock.calls).toEqual([
                [0],
                [0],
                [1],
            ]);

            emitter.off(stub);
            emitter.off(stub);
        });

        it('remove all listeners', () => {
            const emitter = new EventEmitter<[number]>();
            const stub1 = jest.fn();
            const stub2 = jest.fn();
            const stub3 = jest.fn();

            emitter.on(stub1);
            emitter.on(stub2);
            emitter.on(stub3);

            emitter.emit(0);

            emitter.clear();

            emitter.emit(1);

            expect(stub1.mock.calls).toEqual([
                [0],
            ]);
            expect(stub2.mock.calls).toEqual([
                [0],
            ]);
            expect(stub3.mock.calls).toEqual([
                [0],
            ]);
        });

        it('use proxy', () => {
            const emitter = new EventEmitter<[number]>();
            const stub = jest.fn();
            emitter.proxy().on(stub);
            emitter.proxy().on(stub);

            emitter.emit(0);
            expect(stub.mock.calls).toEqual([
                [0],
                [0],
            ]);

            emitter.proxy().off(stub);
            emitter.emit(1);
            expect(stub.mock.calls).toEqual([
                [0],
                [0],
                [1],
            ]);

            emitter.proxy().off(stub);
            emitter.emit(2);
            expect(stub.mock.calls).toEqual([
                [0],
                [0],
                [1],
            ]);

            emitter.proxy().off(stub);
            emitter.proxy().off(stub);
        });

        it('add another handler in handler', () => {
            const emitter = new EventEmitter<[number]>();
            const stub = jest.fn();
            emitter.on(() => {
                emitter.on(stub);
            });

            emitter.emit(1);

            expect(stub.mock.calls).toEqual([]);
        });

        it('remove another handler in handler', () => {
            const emitter = new EventEmitter<[number]>();
            const stub = jest.fn();
            emitter.on(stub);
            emitter.on(() => {
                emitter.off(stub);
            });

            emitter.emit(1);

            expect(stub.mock.calls).toEqual([
                [1],
            ]);
        });

        it('emit in handler', () => {
            const emitter = new EventEmitter<[number]>();
            const stub = jest.fn();
            emitter.on(stub);
            emitter.on((x) => {
                if (x < 4) {
                    emitter.emit(x + 1);
                }
            });

            emitter.emit(1);

            expect(stub.mock.calls).toEqual([
                [1],
                [2],
                [3],
                [4],
            ]);
        });
    });

    describe('eventOnce', () => {
        it('call handler once', () => {
            const emitter = new EventEmitter<[number]>();
            const stub = jest.fn();
            eventOnce(emitter, stub);

            emitter.emit(1);
            emitter.emit(2);
            emitter.emit(3);

            expect(stub.mock.calls).toEqual([
                [1],
            ]);
        });

        it('cancel subscription', () => {
            const emitter = new EventEmitter<[number]>();
            const stub = jest.fn();
            const cancel = eventOnce(emitter, stub);

            cancel();
            emitter.emit(1);

            expect(stub.mock.calls).toEqual([]);
        });
    });

    describe('eventWait', () => {
        it('wait for event', async () => {
            const emitter = new EventEmitter<[number]>();

            setTimeout(() => {
                emitter.emit(3);
            }, 2);

            const data = await eventWait(emitter);
            expect(data).toEqual([3]);
        });
    });
});
