import { BaseChannel } from './base-channel';

describe('base-channel', () => {
    function noop(): void { /* empty */ }

    class TestChannel<S, R> extends BaseChannel<S, R> { }

    class StubMessagePort {
        listener!: (arg: unknown) => void;
        addEventListener(_name: string, listener: () => void): void {
            this.listener = listener;
        }
        removeEventListener(): void { /* empty */ }
        start(): void { /* empty */ }
        close(): void { /* empty */ }
        postMessage = jest.fn();
    }

    describe('BaseChannel', () => {
        it('add and remove event listeners', () => {
            const port = new StubMessagePort();
            const addEventListener = jest.spyOn(port, 'addEventListener');
            const removeEventListener = jest.spyOn(port, 'removeEventListener');
            const start = jest.spyOn(port, 'start');
            const close = jest.spyOn(port, 'close');

            const channel = new TestChannel({
                carrier: port as unknown as MessagePort,
                connectionId: 102,
                handler: noop,
            });

            expect(addEventListener.mock.calls).toEqual([
                ['message', expect.any(Function)],
            ]);
            expect(start.mock.calls).toEqual([
                [],
            ]);

            channel.dispose();

            expect(removeEventListener.mock.calls).toEqual([
                ['message', expect.any(Function)],
            ]);
            expect(close.mock.calls).toEqual([
                [],
            ]);
        });

        it('send messages after flush', () => {
            const port = new StubMessagePort();
            const channel = new TestChannel({
                carrier: port as unknown as MessagePort,
                connectionId: 102,
                handler: noop,
            });

            channel.send({ text: 'Hello World', i: 1 });
            expect(port.postMessage.mock.calls).toEqual([]);

            channel.send({ text: 'Hello World', i: 2 });
            expect(port.postMessage.mock.calls).toEqual([]);

            channel.flush();
            expect(port.postMessage.mock.calls).toEqual([
                [
                    {
                        connectionId: 102,
                        orderId: 1,
                        messages: [
                            { text: 'Hello World', i: 1 },
                            { text: 'Hello World', i: 2 },
                        ],
                    },
                    [],
                ],
            ]);
        });

        it('send messages when buffer is full', () => {
            const port = new StubMessagePort();
            const channel = new TestChannel({
                carrier: port as unknown as MessagePort,
                connectionId: 102,
                sendBufferSize: 3,
                handler: noop,
            });

            channel.send({ text: 'Hello World', i: 1 });
            channel.send({ text: 'Hello World', i: 2 });
            channel.send({ text: 'Hello World', i: 3 });
            expect(port.postMessage.mock.calls).toEqual([]);

            channel.send({ text: 'Hello World', i: 4 });
            expect(port.postMessage.mock.calls).toEqual([
                [
                    {
                        connectionId: 102,
                        orderId: 1,
                        messages: [
                            { text: 'Hello World', i: 1 },
                            { text: 'Hello World', i: 2 },
                            { text: 'Hello World', i: 3 },
                            { text: 'Hello World', i: 4 },
                        ],
                    },
                    [],
                ],
            ]);
        });

        it('send messages immediately', () => {
            const port = new StubMessagePort();
            const channel = new TestChannel({
                carrier: port as unknown as MessagePort,
                connectionId: 102,
                handler: noop,
            });

            channel.send({ text: 'Hello World', i: 1 }, { immediate: true });
            expect(port.postMessage.mock.calls).toEqual([
                [
                    {
                        connectionId: 102,
                        orderId: 1,
                        messages: [
                            { text: 'Hello World', i: 1 },
                        ],
                    },
                    [],
                ],
            ]);
        });

        it('send messages after delay', () => {
            jest.useFakeTimers();
            const port = new StubMessagePort();
            const channel = new TestChannel({
                carrier: port as unknown as MessagePort,
                connectionId: 102,
                flushDelay: 25,
                handler: noop,
            });

            channel.send({ text: 'Hello World', i: 1 });
            expect(port.postMessage.mock.calls).toEqual([]);

            jest.advanceTimersByTime(10);
            channel.send({ text: 'Hello World', i: 2 });
            expect(port.postMessage.mock.calls).toEqual([]);

            jest.advanceTimersByTime(5);
            channel.send({ text: 'Hello World', i: 3 });
            expect(port.postMessage.mock.calls).toEqual([]);

            jest.advanceTimersByTime(10);
            expect(port.postMessage.mock.calls).toEqual([
                [
                    {
                        connectionId: 102,
                        orderId: 1,
                        messages: [
                            { text: 'Hello World', i: 1 },
                            { text: 'Hello World', i: 2 },
                            { text: 'Hello World', i: 3 },
                        ],
                    },
                    [],
                ],
            ]);
        });

        it('send transferrables', () => {
            const port = new StubMessagePort();
            const channel = new TestChannel({
                carrier: port as unknown as MessagePort,
                connectionId: 102,
                handler: noop,
            });
            const aBuffer = new ArrayBuffer(1);
            const bBuffer = new ArrayBuffer(1);

            channel.send({ text: 'Hello World', i: 1 }, { transferables: [aBuffer, bBuffer] });
            channel.send({ text: 'Hello World', i: 2 }, { transferables: [aBuffer] });
            channel.send({ text: 'Hello World', i: 3 }, { transferables: [bBuffer] });
            channel.flush();

            expect(port.postMessage.mock.calls).toEqual([
                [
                    {
                        connectionId: 102,
                        orderId: 1,
                        messages: [
                            { text: 'Hello World', i: 1 },
                            { text: 'Hello World', i: 2 },
                            { text: 'Hello World', i: 3 },
                        ],
                    },
                    [aBuffer, bBuffer, aBuffer, bBuffer],
                ],
            ]);
        });

        function emulateMessage<T>(
            port: StubMessagePort, connectionId: number, orderId: number, messages: ReadonlyArray<T>,
        ): void {
            const batch = {
                connectionId,
                orderId,
                messages,
            };
            port.listener({ data: batch });
        }

        it('receive message', () => {
            const port = new StubMessagePort();
            const handle = jest.fn();
            new TestChannel({
                carrier: port as unknown as MessagePort,
                connectionId: 102,
                handler: handle,
            });

            emulateMessage(port, 102, 1, [
                { text: 'Hello World', i: 1 },
                { text: 'Hello World', i: 2 },
            ]);

            expect(handle.mock.calls).toEqual([
                [{ text: 'Hello World', i: 1 }],
                [{ text: 'Hello World', i: 2 }],
            ]);
        });

        it('ignore unknown messages', () => {
            const port = new StubMessagePort();
            const handle = jest.fn();
            new TestChannel({
                carrier: port as unknown as MessagePort,
                connectionId: 102,
                handler: handle,
            });

            emulateMessage(port, 101, 1, [
                { text: 'Hello World', i: 1 },
                { text: 'Hello World', i: 2 },
            ]);
            port.listener({ tag: 'test' });

            expect(handle.mock.calls).toEqual([]);
        });

        it('throw error on bad messages', () => {
            const port = new StubMessagePort();
            const handle = jest.fn();
            new TestChannel({
                carrier: port as unknown as MessagePort,
                connectionId: 102,
                handler: handle,
            });

            expect(() => {
                port.listener({ data: { connectionId: 102 } });
            }).toThrow(/recv: bad message content$/);
            expect(() => {
                port.listener({ data: { connectionId: 102, items: [] } });
            }).toThrow(/recv: bad message content$/);
            expect(() => {
                port.listener({ data: { connectionId: 102, orderId: 1 } });
            }).toThrow(/recv: bad message content$/);
        });

        it('enforce order of received messages', () => {
            const port = new StubMessagePort();
            const handle = jest.fn();
            new TestChannel({
                carrier: port as unknown as MessagePort,
                connectionId: 102,
                handler: handle,
            });

            emulateMessage(port, 102, 4, [{ text: 'Hello World', i: 4 }]);
            emulateMessage(port, 102, 2, [{ text: 'Hello World', i: 2 }]);
            expect(handle.mock.calls).toEqual([]);

            emulateMessage(port, 102, 1, [{ text: 'Hello World', i: 1 }]);
            expect(handle.mock.calls).toEqual([
                [{ text: 'Hello World', i: 1 }],
                [{ text: 'Hello World', i: 2 }],
            ]);
            handle.mockClear();

            emulateMessage(port, 102, 3, [{ text: 'Hello World', i: 3 }]);
            expect(handle.mock.calls).toEqual([
                [{ text: 'Hello World', i: 3 }],
                [{ text: 'Hello World', i: 4 }],
            ]);
            handle.mockClear();

            emulateMessage(port, 102, 5, [{ text: 'Hello World', i: 5 }]);
            expect(handle.mock.calls).toEqual([
                [{ text: 'Hello World', i: 5 }],
            ]);
            handle.mockClear();

            emulateMessage(port, 102, 8, [{ text: 'Hello World', i: 8 }]);
            emulateMessage(port, 102, 7, [{ text: 'Hello World', i: 7 }]);
            emulateMessage(port, 102, 6, [{ text: 'Hello World', i: 6 }]);
            expect(handle.mock.calls).toEqual([
                [{ text: 'Hello World', i: 6 }],
                [{ text: 'Hello World', i: 7 }],
                [{ text: 'Hello World', i: 8 }],
            ]);
            handle.mockClear();
        });

        it('throw error if order id is duplicated', () => {
            const port = new StubMessagePort();
            new TestChannel({
                carrier: port as unknown as MessagePort,
                connectionId: 102,
                handler: noop,
                recvQueueSize: 2,
            });

            emulateMessage(port, 102, 1, [{ text: 'Hello World', i: 1 }]);
            expect(() => {
                emulateMessage(port, 102, 1, [{ text: 'Hello World', i: 1 }]);
            }).toThrow(/recv: duplicate order id: 1$/);

            emulateMessage(port, 102, 2, [{ text: 'Hello World', i: 2 }]);
            expect(() => {
                emulateMessage(port, 102, 1, [{ text: 'Hello World', i: 1 }]);
            }).toThrow(/recv: duplicate order id: 1$/);

            emulateMessage(port, 102, 4, [{ text: 'Hello World', i: 4 }]);
            expect(() => {
                emulateMessage(port, 102, 4, [{ text: 'Hello World', i: 4 }]);
            }).toThrow(/recv: duplicate order id: 4$/);
        });

        it('throw error if too many unordered messages', () => {
            const port = new StubMessagePort();
            new TestChannel({
                carrier: port as unknown as MessagePort,
                connectionId: 102,
                handler: noop,
                recvQueueSize: 2,
            });

            emulateMessage(port, 102, 2, [{ text: 'Hello World', i: 2 }]);
            emulateMessage(port, 102, 3, [{ text: 'Hello World', i: 3 }]);
            expect(() => {
                emulateMessage(port, 102, 4, [{ text: 'Hello World', i: 4 }]);
            }).toThrow(/recv: queue is too long$/);
        });
    });
});
