import { ForegroundChannel } from './foreground-channel';

describe('foreground-channel', () => {
    describe('ForegroundChannel', () => {
        function noop(): void { /* empty */ }

        class TestWorker {
            constructor(public arg: unknown) {
                // eslint-disable-next-line @typescript-eslint/no-this-alias
                worker = this;
            }
            addEventListener = jest.fn();
            removeEventListener = jest.fn();
            postMessage = jest.fn();
            terminate = jest.fn();
        }

        let worker: TestWorker | undefined;

        beforeEach(() => {
            Object.assign(global, { Worker: TestWorker });
        });

        afterEach(() => {
            Object.assign(global, { Worker: undefined });
            worker = undefined;
        });

        it('pass Worker instance as carrier', () => {
            const worker = new TestWorker('');

            const channel = new ForegroundChannel({
                worker: worker as unknown as Worker,
                connectionId: 1,
                handler: noop,
            });
            channel.send({ text: 'Hello World' });
            channel.flush();
            channel.dispose();

            expect(worker.addEventListener).toBeCalled();
            expect(worker.removeEventListener).toBeCalled();
            expect(worker.postMessage).toBeCalled();
            expect(worker.terminate).not.toBeCalled();
        });

        it('create Worker instance and destroy it', () => {
            const channel = new ForegroundChannel({
                worker: 'test-worker-url',
                connectionId: 1,
                handler: noop,
            });
            channel.send({ text: 'Hello World' });
            channel.flush();
            channel.dispose();

            expect(worker!.arg).toEqual('test-worker-url');
            expect(worker!.addEventListener).toBeCalled();
            expect(worker!.removeEventListener).toBeCalled();
            expect(worker!.postMessage).toBeCalled();
            expect(worker!.terminate).toBeCalled();
        });
    });
});
