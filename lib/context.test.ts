import { Context } from './context';
import './no-console-in-tests';

describe('context', () => {
    describe('Context', () => {
        /** @type {HTMLElement} */
        let container;
        /** @type {HTMLCanvasElement} */
        let canvas;
        /** @type {WebGLRenderingContext} */
        let ctx;
        /** @type {OES_vertex_array_object} */
        let vaoExt;
        const createElement = document.createElement;

        beforeEach(() => {
            container = document.createElement('div');
            canvas = document.createElement('canvas');
            vaoExt = {};
            ctx = {
                getExtension: jest.fn().mockReturnValueOnce(vaoExt),
                viewport: jest.fn(),
                clearColor: jest.fn(),
            };
            canvas.getContext = jest.fn().mockReturnValueOnce(ctx);
            document.createElement = jest.fn().mockReturnValueOnce(canvas);
        });

        afterEach(() => {
            document.createElement = createElement;
        });

        it('has context, vaoExt, canvas', () => {
            const context = new Context(container);
            
            expect(context.handle()).toEqual(ctx);
            expect(context.vaoExt()).toEqual(vaoExt);
            expect(context.canvas()).toEqual(canvas);
        });

        it('setup canvas', () => {
            new Context(container);

            expect(canvas.parentElement).toEqual(container);
            expect(canvas.style.width).toEqual('100%');
            expect(canvas.style.height).toEqual('100%');
        });
    });
});
