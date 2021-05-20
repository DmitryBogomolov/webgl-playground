import { RenderLoop } from './render-loop';

describe('render loop', () => {
    describe('RenderLoop', () => {
        let mockRequestAnimationFrame: jest.SpyInstance<number, [FrameRequestCallback]>;
        let mockCancelAnimationFrame: jest.SpyInstance<void, [number]>;

        beforeEach(() => {
            mockRequestAnimationFrame = jest.spyOn(global, 'requestAnimationFrame').mockImplementation();
            mockCancelAnimationFrame = jest.spyOn(global, 'cancelAnimationFrame').mockImplementation();
        });

        afterEach(() => {
            mockRequestAnimationFrame.mockRestore();
            mockCancelAnimationFrame.mockRestore();
        });

        it('do not invoke callback immediately', () => {
            const mock = jest.fn();
            new RenderLoop(mock);

            expect(mock.mock.calls).toEqual([]);
        });

        it('make frame request', () => {
            mockRequestAnimationFrame.mockReturnValueOnce(1);
            const loop = new RenderLoop(() => 0);

            loop.update();

            expect(mockRequestAnimationFrame.mock.calls).toEqual([
                [expect.any(Function)],
            ]);
        });

        it('do not duplicate frame request', () => {
            mockRequestAnimationFrame.mockReturnValueOnce(1);
            const loop = new RenderLoop(() => 0);

            loop.update();
            loop.update();
            loop.update();

            expect(mockRequestAnimationFrame.mock.calls).toEqual([
                [expect.any(Function)],
            ]);
        });

        it('cancel frame request', () => {
            mockRequestAnimationFrame.mockReturnValueOnce(1);
            const loop = new RenderLoop(() => 0);

            loop.update();
            loop.cancel();

            expect(mockCancelAnimationFrame.mock.calls).toEqual([
                [1],
            ]);
        });

        it('invoke callback', () => {
            mockRequestAnimationFrame.mockReturnValue(1);
            const callback = jest.fn();
            const loop = new RenderLoop(callback);
            loop.update();
            const func = mockRequestAnimationFrame.mock.calls[0][0];

            func(10);
            func(25);
            func(70);

            expect(callback.mock.calls).toEqual([
                [0, 10],
                [15, 25],
                [45, 70],
            ]);
        });
    });
});
