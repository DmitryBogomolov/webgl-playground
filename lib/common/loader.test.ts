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
            // @ts-ignore No fetch in global.
            global.fetch = fetch;
            global.AbortController = function () {
                const controller: StubController = {
                    signal: `TEST_SIGNAL:${controllers.length}`,
                    abort: jest.fn(),
                };
                controllers.push(controller);
                return controller;
            } as unknown as { new(): AbortController };
            controllers = [];
        });

        afterEach(() => {
            // @ts-ignore No fetch in global.
            global.fetch = _fetch;
            global.AbortController = _AbortController;
        });

        it('load', async () => {
            const loader = new Loader();
            const response = {
                ok: true,
                arrayBuffer: () => Promise.resolve({ tag: 'TEST' }),
            };
            fetch.mockResolvedValue(response);

            const task = loader.load('/test-url');

            expect(fetch).toBeCalledWith('/test-url', { method: 'GET', signal: 'TEST_SIGNAL:0' });
            expect(controllers.length).toEqual(1);

            const data = await task;

            expect(data).toEqual({ tag: 'TEST' });
            expect(controllers[0].abort).not.toBeCalled();
        });

        it('cancel', () => {
            const loader = new Loader();
            const response = {
                ok: true,
                arrayBuffer: () => Promise.resolve({ tag: 'TEST' }),
            };
            fetch.mockResolvedValue(response);

            const task = loader.load('/test-url');
            loader.cancel(task);

            expect(controllers[0].abort).toBeCalledWith();
        });
    });
});
