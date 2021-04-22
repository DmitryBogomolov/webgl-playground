import { Context } from './context';
import './no-console-in-tests';

describe('context', () => {
    describe('Context', () => {
        let container: HTMLElement;
        let canvas: HTMLCanvasElement;
        let ctx: WebGLRenderingContext;
        let vaoExt: OES_vertex_array_object;
        let getExtension: jest.Mock;
        let viewport: jest.Mock;
        let clearColor: jest.Mock;
        const { createElement } = document; // eslint-disable-line @typescript-eslint/unbound-method

        beforeEach(() => {
            container = document.createElement('div');
            canvas = document.createElement('canvas');
            vaoExt = {} as unknown as OES_vertex_array_object;
            getExtension = jest.fn().mockReturnValueOnce(vaoExt);
            viewport = jest.fn();
            clearColor = jest.fn();
            ctx = {
                getExtension,
                viewport,
                clearColor,
            } as unknown as WebGLRenderingContext;
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
