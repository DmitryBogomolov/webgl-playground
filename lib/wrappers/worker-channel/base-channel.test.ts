import { BaseChannel } from './base-channel';

describe('base-channel', () => {
    class TestChannel<S = unknown, R = unknown> extends BaseChannel<S, R> { }

    function stubPort() {
        return {
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            start: jest.fn(),
            close: jest.fn(),
            postMessage: jest.fn(),
        };
    }

    describe('BaseChannel', () => {
        it('add and remove event listeners', () => {
            const port = stubPort();
            const channel = new TestChannel({
                carrier: port as unknown as MessagePort,
                connectionId: 102,
                handler: () => { },
            });

            expect(port.addEventListener.mock.calls).toEqual([
                ['message', expect.any(Function)],
            ]);
            expect(port.start.mock.calls).toEqual([
                [],
            ]);

            channel.dispose();

            expect(port.removeEventListener.mock.calls).toEqual([
                ['message', port.addEventListener.mock.calls[0][1]],
            ]);
            expect(port.close.mock.calls).toEqual([
                [],
            ]);
        });

        it('send messages after flush', () => {
            const port = stubPort();
            const channel = new TestChannel({
                carrier: port as unknown as MessagePort,
                connectionId: 102,
                handler: () => { },
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
            const port = stubPort();
            const channel = new TestChannel({
                carrier: port as unknown as MessagePort,
                connectionId: 102,
                sendBufferSize: 3,
                handler: () => { },
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
            const port = stubPort();
            const channel = new TestChannel({
                carrier: port as unknown as MessagePort,
                connectionId: 102,
                handler: () => { },
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
            const port = stubPort();
            const channel = new TestChannel({
                carrier: port as unknown as MessagePort,
                connectionId: 102,
                flushDelay: 25,
                handler: () => { },
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
            const port = stubPort();
            const channel = new TestChannel({
                carrier: port as unknown as MessagePort,
                connectionId: 102,
                handler: () => { },
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

        function emulateMessage<T>(port: ReturnType<typeof stubPort>, connectionId: number, orderId: number, messages: ReadonlyArray<T>): void {
            const batch = {
                connectionId,
                orderId,
                messages,
            };
            port.addEventListener.mock.calls[0][1]({ data: batch });
        }

        it('receive message', () => {
            const port = stubPort();
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
            const port = stubPort();
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
            port.addEventListener.mock.calls[0][1]({ tag: 'test' });

            expect(handle.mock.calls).toEqual([]);
        });

        it('throw error on bad messages', () => {
            const port = stubPort();
            const handle = jest.fn();
            new TestChannel({
                carrier: port as unknown as MessagePort,
                connectionId: 102,
                handler: handle,
            });

            expect(() => {
                port.addEventListener.mock.calls[0][1]({ data: { connectionId: 102 } });
            }).toThrow(/recv: bad message content$/);
            expect(() => {
                port.addEventListener.mock.calls[0][1]({ data: { connectionId: 102, items: [] } });
            }).toThrow(/recv: bad message content$/);
            expect(() => {
                port.addEventListener.mock.calls[0][1]({ data: { connectionId: 102, orderId: 1 } });
            }).toThrow(/recv: bad message content$/);
        });

        it('enforce order of received messages', () => {
            const port = stubPort();
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
            const port = stubPort();
            new TestChannel({
                carrier: port as unknown as MessagePort,
                connectionId: 102,
                handler: () => { },
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
            const port = stubPort();
            new TestChannel({
                carrier: port as unknown as MessagePort,
                connectionId: 102,
                handler: () => { },
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
