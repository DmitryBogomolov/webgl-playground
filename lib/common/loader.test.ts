import { Loader } from './loader';

describe('loader', () => {
    describe('Loader', () => {
        let fetch: jest.SpyInstance;
        const _fetch = global.fetch;
        const _AbortController = global.AbortController;

        interface StubController {
            readonly signal: string;
            readonly abort: jest.Mock;
        }
        let controllers: StubController[];

        beforeEach(() => {
            fetch = jest.fn();
            function AbortController(): StubController {
                const controller: StubController = {
                    signal: `TEST_SIGNAL:${controllers.length}`,
                    abort: jest.fn(),
                };
                controllers.push(controller);
                return controller;
            }
            Object.assign(global, {
                fetch,
                AbortController,
            });
            controllers = [];
        });

        afterEach(() => {
            Object.assign(global, {
                fetch: _fetch,
                AbortController: _AbortController,
            });
        });

        function stubResponse(data: unknown): Response {
            return {
                ok: true,
                arrayBuffer: () => Promise.resolve(data),
            } as unknown as Response;
        }

        it('load', async () => {
            const loader = new Loader();
            fetch.mockResolvedValue(stubResponse({ tag: 'test-data' }));

            const task = loader.load('/test-url');

            expect(fetch).toBeCalledWith('/test-url', { method: 'GET', signal: 'TEST_SIGNAL:0' });
            expect(controllers.length).toEqual(1);

            const result = await task;
            expect(result).toEqual({ tag: 'test-data' });
            expect(controllers[0].abort).toBeCalledTimes(0);
        });

        it('load several times', async () => {
            const loader = new Loader();
            fetch.mockResolvedValueOnce(stubResponse(100));
            fetch.mockResolvedValueOnce(stubResponse(200));

            const task1 = loader.load('/test-url-1');
            const task2 = loader.load('/test-url-2');
            const task3 = loader.load('/test-url-2');
            const task4 = loader.load('/test-url-1');
            const task5 = loader.load('/test-url-1');

            expect(fetch).toBeCalledTimes(2);
            expect(controllers.length).toEqual(2);
            expect(fetch).toHaveBeenNthCalledWith(1, '/test-url-1', { method: 'GET', signal: 'TEST_SIGNAL:0' });
            expect(fetch).toHaveBeenNthCalledWith(2, '/test-url-2', { method: 'GET', signal: 'TEST_SIGNAL:1' });

            const results = await Promise.all([task1, task2, task3, task4, task5]);
            expect(results).toEqual([100, 200, 200, 100, 100]);
            expect(controllers[0].abort).toBeCalledTimes(0);
            expect(controllers[1].abort).toBeCalledTimes(0);
        });

        it('cancel', () => {
            const loader = new Loader();
            fetch.mockResolvedValue(stubResponse(0));

            const task = loader.load('/test-url');
            loader.cancel(task);

            expect(controllers[0].abort).toBeCalledWith();
        });

        it('cancel several times', () => {
            const loader = new Loader();
            fetch.mockResolvedValue(stubResponse(0));

            const task1 = loader.load('/test-url-1');
            loader.cancel(task1);
            loader.cancel(task1);

            const task2 = loader.load('/test-url-2');
            loader.cancel(task2);
            loader.cancel(task1);

            expect(controllers[0].abort).toBeCalledWith();
            expect(controllers[1].abort).toBeCalledWith();
        });

        it('do not abort request if there are tasks', async () => {
            const loader = new Loader();
            fetch.mockResolvedValue(stubResponse(10));

            const task1 = loader.load('/test-url');
            const task2 = loader.load('/test-url');
            const task3 = loader.load('/test-url');
            const task4 = loader.load('/test-url');

            loader.cancel(task2);
            loader.cancel(task3);

            const results = await Promise.all([task1, task4]);
            expect(results).toEqual([10, 10]);
            expect(controllers[0].abort).toBeCalledTimes(0);
        });

        it('abort request if all tasks are canceled', () => {
            const loader = new Loader();
            fetch.mockResolvedValue(stubResponse(10));

            const task1 = loader.load('/test-url');
            const task2 = loader.load('/test-url');
            const task3 = loader.load('/test-url');
            const task4 = loader.load('/test-url');

            loader.cancel(task2);
            loader.cancel(task3);
            loader.cancel(task4);
            loader.cancel(task1);

            expect(controllers[0].abort).toBeCalledTimes(1);
        });

        it('abort requests on dispose', () => {
            const loader = new Loader();
            fetch.mockResolvedValue(stubResponse(0));

            void loader.load('/test-url-1');
            void loader.load('/test-url-2');
            void loader.load('/test-url-2');
            void loader.load('/test-url-1');
            void loader.load('/test-url-1');

            loader.dispose();

            expect(controllers[0].abort).toBeCalledWith();
            expect(controllers[1].abort).toBeCalledWith();
        });

        it('load several times sequentially', async () => {
            const loader = new Loader();
            fetch.mockResolvedValueOnce(stubResponse(100));
            fetch.mockResolvedValueOnce(stubResponse(200));
            fetch.mockResolvedValueOnce(stubResponse(300));

            const result1 = await loader.load('/test-url');
            const result2 = await loader.load('/test-url');
            const result3 = await loader.load('/test-url');

            expect(result1).toEqual(100);
            expect(result2).toEqual(200);
            expect(result3).toEqual(300);
            expect(fetch).toBeCalledTimes(3);
            expect(controllers.length).toEqual(3);
            expect(fetch).toHaveBeenNthCalledWith(1, '/test-url', { method: 'GET', signal: 'TEST_SIGNAL:0' });
            expect(fetch).toHaveBeenNthCalledWith(2, '/test-url', { method: 'GET', signal: 'TEST_SIGNAL:1' });
            expect(fetch).toHaveBeenNthCalledWith(3, '/test-url', { method: 'GET', signal: 'TEST_SIGNAL:2' });
        });

        it('handle request error', async () => {
            const loader = new Loader();
            fetch.mockRejectedValue(new Error('test-error'));

            await expect(() => loader.load('/test-url')).rejects.toEqual(new Error('test-error'));
        });

        it('handle bad response', async () => {
            const loader = new Loader();
            const response = { ...stubResponse(0), ok: false, statusText: 'test-error' };
            fetch.mockResolvedValue(response);

            await expect(() => loader.load('/test-url')).rejects.toEqual(new Error('/test-url: test-error'));
        });

        it('perform POST request', async () => {
            const loader = new Loader();
            fetch.mockResolvedValue(stubResponse(100));

            const result = await loader.load('/test-url', { method: 'POST' });

            expect(result).toEqual(100);
            expect(fetch).toBeCalledWith('/test-url', { method: 'POST', signal: 'TEST_SIGNAL:0' });
        });

        it('receive binary response', async () => {
            const loader = new Loader();
            fetch.mockResolvedValue(stubResponse('test buffer'));

            const result = await loader.load('/test-url', { responseType: 'binary' });

            expect(result).toEqual('test buffer');
        });

        it('receive text response', async () => {
            const loader = new Loader();
            fetch.mockResolvedValue({
                ok: true,
                text: () => Promise.resolve('test text'),
            });

            const result = await loader.load('/test-url', { responseType: 'text' });

            expect(result).toEqual('test text');
        });

        it('receive json response', async () => {
            const loader = new Loader();
            fetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve('test json'),
            });

            const result = await loader.load('/test-url', { responseType: 'json' });

            expect(result).toEqual('test json');
        });

        it('receive blob response', async () => {
            const loader = new Loader();
            fetch.mockResolvedValue({
                ok: true,
                blob: () => Promise.resolve('test blob'),
            });

            const result = await loader.load('/test-url', { responseType: 'blob' });

            expect(result).toEqual('test blob');
        });
    });
});
