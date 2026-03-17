import { Loader } from './loader';
import { httpRequest } from './http-request';

jest.mock('./http-request');

describe('loader', () => {
    describe('Loader', () => {
        const httpRequestMock = httpRequest as jest.Mock;

        afterEach(() => {
            httpRequestMock.mockRestore();
        });

        it('load', async () => {
            const loader = new Loader();
            httpRequestMock.mockReturnValueOnce({ task: Promise.resolve(100), cancel: jest.fn() });

            const task = loader.load('/test-url');

            expect(httpRequestMock).toBeCalledWith('/test-url', undefined);

            const result = await task;
            expect(result).toEqual(100);
        });

        it('load several times', async () => {
            const loader = new Loader();
            httpRequestMock.mockReturnValueOnce({ task: Promise.resolve(100), cancel: jest.fn() });
            httpRequestMock.mockReturnValueOnce({ task: Promise.resolve(200), cancel: jest.fn() });

            const task1 = loader.load('/test-url-1');
            const task2 = loader.load('/test-url-2');
            const task3 = loader.load('/test-url-2');
            const task4 = loader.load('/test-url-1');
            const task5 = loader.load('/test-url-1');

            expect(httpRequestMock).toBeCalledTimes(2);
            expect(httpRequestMock).toHaveBeenNthCalledWith(1, '/test-url-1', undefined);
            expect(httpRequestMock).toHaveBeenNthCalledWith(2, '/test-url-2', undefined);

            const results = await Promise.all([task1, task2, task3, task4, task5]);
            expect(results).toEqual([100, 200, 200, 100, 100]);
        });

        it('cancel', () => {
            const loader = new Loader();
            const cancel = jest.fn();
            httpRequestMock.mockReturnValueOnce({ task: Promise.resolve(0), cancel });

            const task = loader.load('/test-url');
            loader.cancel(task);

            expect(cancel).toBeCalledWith();
        });

        it('cancel several times', () => {
            const loader = new Loader();
            const cancel1 = jest.fn();
            const cancel2 = jest.fn();
            httpRequestMock.mockReturnValueOnce({ task: Promise.resolve(0), cancel: cancel1 });
            httpRequestMock.mockReturnValueOnce({ task: Promise.resolve(0), cancel: cancel2 });

            const task1 = loader.load('/test-url-1');
            loader.cancel(task1);
            loader.cancel(task1);

            const task2 = loader.load('/test-url-2');
            loader.cancel(task2);
            loader.cancel(task1);

            expect(cancel1).toBeCalledTimes(1);
            expect(cancel2).toBeCalledTimes(1);
        });

        it('do not abort request if there are tasks', async () => {
            const loader = new Loader();
            const cancel = jest.fn();
            httpRequestMock.mockReturnValueOnce({ task: Promise.resolve(10), cancel });

            const task1 = loader.load('/test-url');
            const task2 = loader.load('/test-url');
            const task3 = loader.load('/test-url');
            const task4 = loader.load('/test-url');

            loader.cancel(task2);
            loader.cancel(task3);

            const results = await Promise.all([task1, task4]);
            expect(results).toEqual([10, 10]);
            expect(cancel).toBeCalledTimes(0);
        });

        it('abort request if all tasks are canceled', () => {
            const loader = new Loader();
            const cancel = jest.fn();
            httpRequestMock.mockReturnValueOnce({ task: Promise.resolve(10), cancel });

            const task1 = loader.load('/test-url');
            const task2 = loader.load('/test-url');
            const task3 = loader.load('/test-url');
            const task4 = loader.load('/test-url');

            loader.cancel(task2);
            loader.cancel(task3);
            loader.cancel(task4);
            loader.cancel(task1);

            expect(cancel).toBeCalledTimes(1);
        });

        it('abort requests on dispose', () => {
            const loader = new Loader();
            const cancel1 = jest.fn();
            const cancel2 = jest.fn();
            httpRequestMock.mockReturnValueOnce({ task: Promise.resolve(0), cancel: cancel1 });
            httpRequestMock.mockReturnValueOnce({ task: Promise.resolve(0), cancel: cancel2 });

            void loader.load('/test-url-1');
            void loader.load('/test-url-2');
            void loader.load('/test-url-2');
            void loader.load('/test-url-1');
            void loader.load('/test-url-1');

            loader.dispose();

            expect(cancel1).toBeCalledWith();
            expect(cancel2).toBeCalledWith();
        });

        it('load several times sequentially', async () => {
            const loader = new Loader();
            httpRequestMock.mockReturnValueOnce({ task: Promise.resolve(100), cancel: jest.fn() });
            httpRequestMock.mockReturnValueOnce({ task: Promise.resolve(200), cancel: jest.fn() });
            httpRequestMock.mockReturnValueOnce({ task: Promise.resolve(300), cancel: jest.fn() });

            const result1 = await loader.load('/test-url');
            const result2 = await loader.load('/test-url');
            const result3 = await loader.load('/test-url');

            expect(result1).toEqual(100);
            expect(result2).toEqual(200);
            expect(result3).toEqual(300);
            expect(httpRequestMock).toBeCalledTimes(3);
            expect(httpRequestMock).toHaveBeenNthCalledWith(1, '/test-url', undefined);
            expect(httpRequestMock).toHaveBeenNthCalledWith(2, '/test-url', undefined);
            expect(httpRequestMock).toHaveBeenNthCalledWith(3, '/test-url', undefined);
        });
    });
});
