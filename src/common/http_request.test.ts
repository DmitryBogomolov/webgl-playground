import { httpRequest } from './http_request';

describe('http_request', () => {
    describe('http request', () => {
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
            fetch.mockResolvedValue(stubResponse({ tag: 'test-data' }));
            const { task: response } = httpRequest('/test-url');

            expect(fetch).toBeCalledWith('/test-url', { signal: 'TEST_SIGNAL:0' });
            expect(controllers.length).toEqual(1);

            const result = await response;
            expect(result).toEqual({ tag: 'test-data' });
            expect(controllers[0].abort).toBeCalledTimes(0);
        });

        it('load several times', async () => {
            fetch.mockResolvedValueOnce(stubResponse(100));
            fetch.mockResolvedValueOnce(stubResponse(200));
            fetch.mockResolvedValueOnce(stubResponse(300));

            const response1 = httpRequest('/test-url-1');
            const response2 = httpRequest('/test-url-2');
            const response3 = httpRequest('/test-url-3');

            expect(fetch).toBeCalledTimes(3);
            expect(controllers.length).toEqual(3);
            expect(fetch).toHaveBeenNthCalledWith(1, '/test-url-1', { signal: 'TEST_SIGNAL:0' });
            expect(fetch).toHaveBeenNthCalledWith(2, '/test-url-2', { signal: 'TEST_SIGNAL:1' });
            expect(fetch).toHaveBeenNthCalledWith(3, '/test-url-3', { signal: 'TEST_SIGNAL:2' });

            const results = await Promise.all([response1.task, response2.task, response3.task]);
            expect(results).toEqual([100, 200, 300]);
            expect(controllers[0].abort).toBeCalledTimes(0);
            expect(controllers[1].abort).toBeCalledTimes(0);
            expect(controllers[2].abort).toBeCalledTimes(0);
        });

        it('cancel', () => {
            fetch.mockResolvedValue(stubResponse(0));

            const { cancel } = httpRequest('/test-url');
            cancel();

            expect(controllers[0].abort).toBeCalledWith();
        });

        it('cancel several times', () => {
            fetch.mockResolvedValue(stubResponse(0));

            const response1 = httpRequest('/test-url-1');
            response1.cancel();
            response1.cancel();

            const response2 = httpRequest('/test-url-2');
            response2.cancel();
            response1.cancel();

            expect(controllers[0].abort).toBeCalledWith();
            expect(controllers[1].abort).toBeCalledWith();
        });

        it('handle request error', async () => {
            fetch.mockRejectedValue(new Error('test-error'));

            const response = httpRequest('/test-url');

            await expect(response.task).rejects.toEqual(new Error('test-error'));
        });

        it('handle bad response', async () => {
            fetch.mockResolvedValue({ ...stubResponse(0), ok: false, statusText: 'test-error' });

            const response = httpRequest('/test-url');

            await expect(response.task).rejects.toEqual(new Error('/test-url: test-error'));
        });

        it('perform POST request', async () => {
            fetch.mockResolvedValue(stubResponse(100));

            const response = httpRequest('/test-url', { method: 'POST' });
            const result = await response.task;

            expect(result).toEqual(100);
            expect(fetch).toBeCalledWith('/test-url', { method: 'POST', signal: 'TEST_SIGNAL:0' });
        });

        it('receive binary response', async () => {
            fetch.mockResolvedValue(stubResponse('test buffer'));

            const response = httpRequest('/test-url', { contentType: 'binary' });
            const result = await response.task;

            expect(result).toEqual('test buffer');
        });

        it('receive text response', async () => {
            fetch.mockResolvedValue({
                ok: true,
                text: () => Promise.resolve('test text'),
            });

            const response = httpRequest('/test-url', { contentType: 'text' });
            const result = await response.task;

            expect(result).toEqual('test text');
        });

        it('receive json response', async () => {
            fetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve('test json'),
            });

            const response = httpRequest('/test-url', { contentType: 'json' });
            const result = await response.task;

            expect(result).toEqual('test json');
        });

        it('receive blob response', async () => {
            fetch.mockResolvedValue({
                ok: true,
                blob: () => Promise.resolve('test blob'),
            });

            const response = httpRequest('/test-url', { contentType: 'blob' });
            const result = await response.task;

            expect(result).toEqual('test blob');
        });
    });
});
