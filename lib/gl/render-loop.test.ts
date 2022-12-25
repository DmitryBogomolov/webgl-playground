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

        it('request frame when callback is added', () => {
            const loop = new RenderLoop();

            loop.frameRendered().on(() => 0);

            expect(mockRequestAnimationFrame.mock.calls).toEqual([
                [expect.any(Function)],
            ]);
        });

        it('do not request frame when callback is removed', () => {
            const loop = new RenderLoop();
            const func = (): number => 0;
            loop.frameRendered().on(func);
            triggerFrame(0);

            loop.frameRendered().off(func);

            expect(mockRequestAnimationFrame.mock.calls).toEqual([
                [expect.any(Function)],
            ]);
        });

        it('invoke callback', () => {
            const loop = new RenderLoop();
            const callback = jest.fn();
            loop.frameRendered().on(callback);

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
            const callback = jest.fn(() => {
                loop.update();
            });
            loop.frameRendered().on(callback);

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
            const callback = jest.fn();

            loop.frameRendered().on(callback);
            loop.frameRendered().on(callback);
            triggerFrame(10);
            expect(callback.mock.calls).toEqual([
                [0, 10],
                [0, 10],
            ]);

            loop.frameRendered().off(callback);
            triggerFrame(30);
            expect(callback.mock.calls).toEqual([
                [0, 10],
                [0, 10],
                [20, 30],
            ]);

            loop.frameRendered().off(callback);
            triggerFrame(70);
            expect(callback.mock.calls).toEqual([
                [0, 10],
                [0, 10],
                [20, 30],
            ]);
        });

        it('remove all callbacks', () => {
            const loop = new RenderLoop();
            const callback1 = jest.fn();
            const callback2 = jest.fn();
            loop.frameRendered().on(callback1);
            loop.frameRendered().on(callback2);

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
