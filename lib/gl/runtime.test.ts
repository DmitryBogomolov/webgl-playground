import { Runtime, createRenderState } from './runtime';

jest.mock('../utils/logger');

describe('runtime', () => {
    describe('Runtime', () => {
        let container: HTMLElement;
        let canvas: HTMLCanvasElement;
        let ctx: WebGLRenderingContext;
        let vaoExt: OES_vertex_array_object;
        let getExtension: jest.Mock;
        let viewport: jest.Mock;
        let enable: jest.Mock;
        let disable: jest.Mock;
        let clearColor: jest.Mock;
        let pixelStorei: jest.Mock;
        const { createElement } = document; // eslint-disable-line @typescript-eslint/unbound-method

        const {
            DEPTH_TEST,
            CULL_FACE,
            BLEND,
            UNPACK_FLIP_Y_WEBGL,
        } = WebGLRenderingContext.prototype;

        beforeEach(() => {
            container = document.createElement('div');
            canvas = document.createElement('canvas');
            vaoExt = { tag: 'VAO' } as unknown as OES_vertex_array_object;
            getExtension = jest.fn()
                .mockReturnValueOnce(vaoExt)
                .mockReturnValueOnce({ tag: 'U32INDEX' });
            viewport = jest.fn();
            enable = jest.fn();
            disable = jest.fn();
            clearColor = jest.fn();
            pixelStorei = jest.fn();
            ctx = {
                getExtension,
                viewport,
                enable,
                disable,
                clearColor,
                pixelStorei,
            } as Partial<WebGLRenderingContext> as WebGLRenderingContext;
            canvas.getContext = jest.fn().mockReturnValueOnce(ctx);
            document.createElement = jest.fn().mockReturnValueOnce(canvas);
        });

        afterEach(() => {
            document.createElement = createElement;
        });

        it('create runtime', () => {
            new Runtime(container);
        });

        it('default state', () => {
            const runtime = new Runtime(container);

            expect(runtime.getClearColor()).toEqual({ r: 0, g: 0, b: 0, a: 0 });
            expect(runtime.getClearDepth()).toEqual(1);
            expect(runtime.getClearStencil()).toEqual(0);

            expect(runtime.getPixelStoreUnpackFlipYWebgl()).toEqual(false);
            expect(runtime.getPixelStoreUnpackPremultiplyAlphaWebgl()).toEqual(false);

            expect(runtime.getDepthTest()).toEqual(false);
            expect(runtime.getDepthMask()).toEqual(true);
            expect(runtime.getDepthFunc()).toEqual('less');

            expect(runtime.getStencilTest()).toEqual(false);
            expect(runtime.getStencilMask()).toEqual(0x7FFFFFFF);
            expect(runtime.getStencilFunc()).toEqual({ func: 'always', ref: 0, mask: 0x7FFFFFFF });
            expect(runtime.getStencilOp()).toEqual({ fail: 'keep', zfail: 'keep', zpass: 'keep' });

            expect(runtime.getCulling()).toEqual(false);
            expect(runtime.getCullFace()).toEqual('back');

            expect(runtime.getBlending()).toEqual(false);
            expect(runtime.getBlendFunc()).toEqual('one|zero');
        });

        it('set clear color', () => {
            const runtime = new Runtime(container);

            expect(runtime.setClearColor({ r: 0.5, g: 0, b: 0, a: 1 })).toEqual(true);
            expect(runtime.getClearColor()).toEqual({ r: 0.5, g: 0, b: 0, a: 1 });
            expect(runtime.setClearColor({ r: 0.5, g: 0, b: 0, a: 1 })).toEqual(false);
            expect(clearColor.mock.calls).toEqual([
                [0.5, 0, 0, 1],
            ]);
        });

        it('set flip y', () => {
            const runtime = new Runtime(container);

            expect(runtime.setPixelStoreUnpackFlipYWebgl(true)).toEqual(true);
            expect(runtime.getPixelStoreUnpackFlipYWebgl()).toEqual(true);
            expect(runtime.setPixelStoreUnpackFlipYWebgl(true)).toEqual(false);
            expect(pixelStorei.mock.calls).toEqual([
                [UNPACK_FLIP_Y_WEBGL, true],
            ]);
        });

        it('set render state', () => {
            const runtime = new Runtime(container);

            const state1 = createRenderState({ depthTest: true, culling: true, blending: true });
            expect(runtime.setRenderState(state1)).toEqual(true);
            expect(runtime.getDepthTest()).toEqual(true);
            expect(runtime.getCulling()).toEqual(true);
            expect(runtime.getBlending()).toEqual(true);
            const state2 = createRenderState({ depthTest: true, culling: true, blending: true });
            expect(runtime.setRenderState(state2)).toEqual(false);
            expect(enable.mock.calls).toEqual([
                [DEPTH_TEST],
                [CULL_FACE],
                [BLEND],
            ]);
        });

        it('set render state complex', () => {
            const runtime = new Runtime(container);

            const state1 = createRenderState({ depthTest: true, culling: true, blending: true });
            expect(runtime.setRenderState(state1)).toEqual(true);
            expect(runtime.getDepthTest()).toEqual(true);
            expect(runtime.getCulling()).toEqual(true);
            expect(runtime.getBlending()).toEqual(true);
            const state2 = createRenderState({ culling: true });
            expect(runtime.setRenderState(state2)).toEqual(true);
            expect(runtime.getDepthTest()).toEqual(false);
            expect(runtime.getCulling()).toEqual(true);
            expect(runtime.getBlending()).toEqual(false);

            expect(enable.mock.calls).toEqual([
                [DEPTH_TEST],
                [CULL_FACE],
                [BLEND],
            ]);
            expect(disable.mock.calls).toEqual([
                [DEPTH_TEST],
                [BLEND],
            ]);
        });
    });
});
