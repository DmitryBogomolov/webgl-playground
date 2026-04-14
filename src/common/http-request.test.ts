import { httpRequest } from './http-request';

describe('http-request', () => {
    describe('http request', () => {
        let fetch: jest.SpyInstance;
        const _fetch = global.fetch;
        const _AbortController = global.AbortController;

        interface StubController {
            readonly signal: unknown;
            readonly abort: jest.Mock;
        }
        let controllers: StubController[];

        beforeEach(() => {
            fetch = jest.fn();
            function AbortController(): StubController {
                const controller: StubController = {
                    signal: {
                        throwIfAborted: jest.fn(),
                    },
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

            expect(controllers.length).toEqual(1);
            expect(fetch).toHaveBeenCalledWith('/test-url', { signal: controllers[0].signal });

            const result = await response;
            expect(result).toEqual({ tag: 'test-data' });
            expect(controllers[0].abort).toHaveBeenCalledTimes(0);
        });

        it('load several times', async () => {
            fetch.mockResolvedValueOnce(stubResponse(100));
            fetch.mockResolvedValueOnce(stubResponse(200));
            fetch.mockResolvedValueOnce(stubResponse(300));

            const response1 = httpRequest('/test-url-1');
            const response2 = httpRequest('/test-url-2');
            const response3 = httpRequest('/test-url-3');

            expect(fetch).toHaveBeenCalledTimes(3);
            expect(controllers.length).toEqual(3);
            expect(fetch).toHaveBeenNthCalledWith(1, '/test-url-1', { signal: controllers[0].signal });
            expect(fetch).toHaveBeenNthCalledWith(2, '/test-url-2', { signal: controllers[1].signal });
            expect(fetch).toHaveBeenNthCalledWith(3, '/test-url-3', { signal: controllers[2].signal });

            const results = await Promise.all([response1.task, response2.task, response3.task]);
            expect(results).toEqual([100, 200, 300]);
            expect(controllers[0].abort).toHaveBeenCalledTimes(0);
            expect(controllers[1].abort).toHaveBeenCalledTimes(0);
            expect(controllers[2].abort).toHaveBeenCalledTimes(0);
        });

        it('cancel', () => {
            fetch.mockResolvedValue(stubResponse(0));

            const { cancel } = httpRequest('/test-url');
            cancel();

            expect(controllers[0].abort).toHaveBeenCalledWith();
        });

        it('cancel several times', () => {
            fetch.mockResolvedValue(stubResponse(0));

            const response1 = httpRequest('/test-url-1');
            response1.cancel();
            response1.cancel();

            const response2 = httpRequest('/test-url-2');
            response2.cancel();
            response1.cancel();

            expect(controllers[0].abort).toHaveBeenCalledWith();
            expect(controllers[1].abort).toHaveBeenCalledWith();
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
            expect(fetch).toHaveBeenCalledWith('/test-url', { method: 'POST', signal: controllers[0].signal });
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
