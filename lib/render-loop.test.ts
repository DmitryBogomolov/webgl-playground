import { RenderLoop } from './render-loop';
import './no-console-in-tests';

describe('render loop', () => {
    describe('RenderLoop', () => {
        /* eslint-disable no-undef */
        const requestAnimationFrame = global.requestAnimationFrame;
        const cancelAnimationFrame = global.cancelAnimationFrame;
        
        beforeEach(() => {
            global.requestAnimationFrame = jest.fn();
            global.cancelAnimationFrame = jest.fn();
        });

        afterEach(() => {
            global.requestAnimationFrame = requestAnimationFrame;
            global.cancelAnimationFrame = cancelAnimationFrame;
        });

        it('initially not running', () => {
            const loop = new RenderLoop();

            expect(loop.isRunning()).toBe(false);
        });

        it('start', () => {
            global.requestAnimationFrame.mockReturnValue(1);
            const loop = new RenderLoop();

            loop.start();

            expect(loop.isRunning()).toBe(true);
            expect(global.requestAnimationFrame).toBeCalledWith(expect.any(Function));
        });

        it('stop', () => {
            global.requestAnimationFrame.mockReturnValue(1);
            const loop = new RenderLoop();
            loop.start();

            loop.stop();

            expect(loop.isRunning()).toBe(false);
            expect(global.cancelAnimationFrame).toBeCalledWith(1);
        });

        it('invoke callback and request next frame', () => {
            global.requestAnimationFrame.mockReturnValue(1);
            const mock = jest.fn();
            const loop = new RenderLoop(mock);
            loop.start();

            global.requestAnimationFrame.mock.calls[0][0](10);
            global.requestAnimationFrame.mock.calls[0][0](25);
            global.requestAnimationFrame.mock.calls[0][0](70);

            expect(mock.mock.calls).toEqual([
                [0, 10],
                [15, 25],
                [45, 70],
            ]);
        });
    });
});
