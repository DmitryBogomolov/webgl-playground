import { RenderLoop } from './render-loop';
import './no-console-in-tests';

describe('render loop', () => {
    describe('RenderLoop', () => {
        const _requestAnimationFrame = global.requestAnimationFrame;
        const _cancelAnimationFrame = global.cancelAnimationFrame;
        let mockRequestAnimationFrame: jest.Mock<number, [FrameRequestCallback]>;
        let mockCancelAnimationFrame: jest.Mock<void, [number]>;

        beforeEach(() => {
            global.requestAnimationFrame = mockRequestAnimationFrame = jest.fn<number, [FrameRequestCallback]>();
            global.cancelAnimationFrame = mockCancelAnimationFrame = jest.fn<void, [number]>();
        });

        afterEach(() => {
            global.requestAnimationFrame = _requestAnimationFrame;
            global.cancelAnimationFrame = _cancelAnimationFrame;
        });

        it('initially not running', () => {
            const loop = new RenderLoop(() => 0);

            expect(loop.isRunning()).toBe(false);
        });

        it('start', () => {
            mockRequestAnimationFrame.mockReturnValue(1);
            const loop = new RenderLoop(() => 0);

            loop.start();

            expect(loop.isRunning()).toBe(true);
            expect(mockRequestAnimationFrame).toBeCalledWith(expect.any(Function));
        });

        it('stop', () => {
            mockRequestAnimationFrame.mockReturnValue(1);
            const loop = new RenderLoop(() => 0);
            loop.start();

            loop.stop();

            expect(loop.isRunning()).toBe(false);
            expect(mockCancelAnimationFrame).toBeCalledWith(1);
        });

        it('invoke callback and request next frame', () => {
            mockRequestAnimationFrame.mockReturnValue(1);
            const mock = jest.fn();
            const loop = new RenderLoop(mock);
            loop.start();

            mockRequestAnimationFrame.mock.calls[0][0](10);
            mockRequestAnimationFrame.mock.calls[0][0](25);
            mockRequestAnimationFrame.mock.calls[0][0](70);

            expect(mock.mock.calls).toEqual([
                [0, 10],
                [15, 25],
                [45, 70],
            ]);
        });
    });
});
