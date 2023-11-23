import { RenderLoop } from './render-loop';

describe('render loop', () => {
    describe('RenderLoop', () => {
        let mockRequestAnimationFrame: jest.SpyInstance<number, [FrameRequestCallback]>;
        let mockCancelAnimationFrame: jest.SpyInstance<void, [number]>;

        beforeEach(() => {
            mockRequestAnimationFrame = jest.spyOn(global, 'requestAnimationFrame').mockImplementation();
            mockCancelAnimationFrame = jest.spyOn(global, 'cancelAnimationFrame').mockImplementation();
            mockRequestAnimationFrame.mockReturnValueOnce(1);
        });

        afterEach(() => {
            mockRequestAnimationFrame.mockRestore();
            mockCancelAnimationFrame.mockRestore();
        });

        function triggerFrame(time: number): void {
            const { calls } = mockRequestAnimationFrame.mock;
            calls[calls.length - 1][0](time);
        }

        it('do not request frame immediately', () => {
            new RenderLoop();

            expect(mockRequestAnimationFrame.mock.calls).toEqual([]);
        });

        it('request frame', () => {
            const loop = new RenderLoop();

            loop.update();

            expect(mockRequestAnimationFrame.mock.calls).toEqual([
                [expect.any(Function)],
            ]);
        });

        it('do not duplicate frame request', () => {
            const loop = new RenderLoop();

            loop.update();
            loop.update();
            loop.update();

            expect(mockRequestAnimationFrame.mock.calls).toEqual([
                [expect.any(Function)],
            ]);
        });

        it('cancel frame request', () => {
            const loop = new RenderLoop();

            loop.update();
            loop.cancel();

            expect(mockCancelAnimationFrame.mock.calls).toEqual([
                [1],
            ]);
        });

        it('invoke callback', () => {
            const loop = new RenderLoop();
            loop.update();
            const callback = jest.fn();
            loop.frameRequested().on(callback);

            triggerFrame(10);
            triggerFrame(25);
            triggerFrame(70);

            expect(callback.mock.calls).toEqual([
                [0, 10],
                [15, 25],
                [45, 70],
            ]);
        });

        it('allow to request frame from callback', () => {
            mockRequestAnimationFrame.mockReturnValueOnce(2);
            mockRequestAnimationFrame.mockReturnValueOnce(3);
            const loop = new RenderLoop();
            loop.update();
            const callback = jest.fn(() => {
                loop.update();
            });
            loop.frameRequested().on(callback);

            expect(mockRequestAnimationFrame.mock.calls).toEqual([
                [expect.any(Function)],
            ]);
            triggerFrame(10);
            expect(callback.mock.calls).toEqual([
                [0, 10],
            ]);

            expect(mockRequestAnimationFrame.mock.calls).toEqual([
                [expect.any(Function)],
                [expect.any(Function)],
            ]);
            triggerFrame(30);
            expect(callback.mock.calls).toEqual([
                [0, 10],
                [20, 30],
            ]);

            expect(mockRequestAnimationFrame.mock.calls).toEqual([
                [expect.any(Function)],
                [expect.any(Function)],
                [expect.any(Function)],
            ]);
            triggerFrame(70);
            expect(callback.mock.calls).toEqual([
                [0, 10],
                [20, 30],
                [40, 70],
            ]);
        });

        it('add or remove callbacks twice', () => {
            const loop = new RenderLoop();
            loop.update();
            const callback = jest.fn();

            loop.frameRequested().on(callback);
            loop.frameRequested().on(callback);
            triggerFrame(10);
            expect(callback.mock.calls).toEqual([
                [0, 10],
                [0, 10],
            ]);

            loop.frameRequested().off(callback);
            triggerFrame(30);
            expect(callback.mock.calls).toEqual([
                [0, 10],
                [0, 10],
                [20, 30],
            ]);

            loop.frameRequested().off(callback);
            triggerFrame(70);
            expect(callback.mock.calls).toEqual([
                [0, 10],
                [0, 10],
                [20, 30],
            ]);
        });

        it('remove all callbacks', () => {
            const loop = new RenderLoop();
            loop.update();
            const callback1 = jest.fn();
            const callback2 = jest.fn();
            loop.frameRequested().on(callback1);
            loop.frameRequested().on(callback2);

            triggerFrame(10);
            loop.clearCallbacks();
            triggerFrame(40);

            expect(callback1.mock.calls).toEqual([
                [0, 10],
            ]);
            expect(callback2.mock.calls).toEqual([
                [0, 10],
            ]);
        });
    });
});
