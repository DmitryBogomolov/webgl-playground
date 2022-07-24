import { Runtime } from './runtime';

describe('runtime', () => {
    describe('Runtime', () => {
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
            vaoExt = { tag: 'VAO' } as unknown as OES_vertex_array_object;
            getExtension = jest.fn()
                .mockReturnValueOnce(vaoExt)
                .mockReturnValueOnce({ tag: 'U32INDEX' });
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

        it('create runtime', () => {
            new Runtime(container);
        });
    });
});
