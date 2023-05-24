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
        let clear: jest.Mock;
        let clearColor: jest.Mock;
        let pixelStorei: jest.Mock;
        // eslint-disable-next-line @typescript-eslint/unbound-method
        const { createElement } = document;

        const {
            DEPTH_TEST,
            CULL_FACE,
            BLEND,
            UNPACK_FLIP_Y_WEBGL,
            COLOR_BUFFER_BIT, DEPTH_BUFFER_BIT, STENCIL_BUFFER_BIT,
        } = WebGLRenderingContext.prototype;

        beforeEach(() => {
            container = document.createElement('div');
            canvas = document.createElement('canvas');
            Object.defineProperty(canvas, 'clientWidth', { value: 640, configurable: true });
            Object.defineProperty(canvas, 'clientHeight', { value: 480, configurable: true });
            vaoExt = { tag: 'VAO' } as unknown as OES_vertex_array_object;
            getExtension = jest.fn()
                .mockReturnValueOnce(vaoExt)
                .mockReturnValueOnce({ tag: 'U32INDEX' });
            viewport = jest.fn();
            enable = jest.fn();
            disable = jest.fn();
            clear = jest.fn();
            clearColor = jest.fn();
            pixelStorei = jest.fn();
            ctx = {
                getExtension,
                viewport,
                enable,
                disable,
                clear,
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

        it('return sizes', () => {
            const runtime = new Runtime(container);

            expect(runtime.canvas()).toEqual(canvas);
            expect(runtime.size()).toEqual({ x: 640, y: 480 });
            expect(runtime.canvasSize()).toEqual({ x: 640, y: 480 });
            expect(canvas.width).toEqual(640);
            expect(canvas.height).toEqual(480);
            expect(viewport.mock.calls).toEqual([
                [0, 0, 640, 480],
            ]);
        });

        it('return sizes with dpr', () => {
            const saved = devicePixelRatio;
            try {
                // eslint-disable-next-line no-global-assign
                devicePixelRatio = 2;
                const runtime = new Runtime(container);

                expect(runtime.size()).toEqual({ x: 640, y: 480 });
                expect(runtime.canvasSize()).toEqual({ x: 1280, y: 960 });
                expect(canvas.width).toEqual(1280);
                expect(canvas.height).toEqual(960);
                expect(viewport.mock.calls).toEqual([
                    [0, 0, 1280, 960],
                ]);

            } finally {
                // eslint-disable-next-line no-global-assign
                devicePixelRatio = saved;
            }
        });

        it('notify size on subscription', () => {
            const runtime = new Runtime(container);
            const handleSizeChanged = jest.fn();
            runtime.sizeChanged().on(handleSizeChanged);

            expect(handleSizeChanged.mock.calls).toEqual([
                [],
            ]);
        });

        it('update size', () => {
            const runtime = new Runtime(container);
            const handleSizeChanged = jest.fn();
            runtime.sizeChanged().on(handleSizeChanged);
            viewport.mockClear();
            handleSizeChanged.mockClear();

            expect(runtime.setSize({ x: 800, y: 600 })).toEqual(true);

            expect(runtime.size()).toEqual({ x: 800, y: 600 });
            expect(runtime.canvasSize()).toEqual({ x: 800, y: 600 });
            expect(canvas.width).toEqual(800);
            expect(canvas.height).toEqual(600);
            expect(viewport.mock.calls).toEqual([
                [0, 0, 800, 600],
            ]);
            expect(handleSizeChanged.mock.calls).toEqual([
                [],
            ]);

            expect(runtime.setSize({ x: 800, y: 600 })).toEqual(false);
            expect(viewport.mock.calls).toEqual([
                [0, 0, 800, 600],
            ]);
            expect(handleSizeChanged.mock.calls).toEqual([
                [],
            ]);
        });

        it('adjust viewport', () => {
            const runtime = new Runtime(container);
            const handleSizeChanged = jest.fn();
            const handleFrameRendered = jest.fn();
            runtime.sizeChanged().on(handleSizeChanged);
            runtime.frameRendered().on(handleFrameRendered);
            viewport.mockClear();
            handleSizeChanged.mockClear();
            Object.defineProperty(canvas, 'clientWidth', { value: 200 });
            Object.defineProperty(canvas, 'clientHeight', { value: 100 });

            runtime.adjustViewport();

            expect(runtime.size()).toEqual({ x: 200, y: 100 });
            expect(runtime.canvasSize()).toEqual({ x: 200, y: 100 });
            expect(canvas.width).toEqual(200);
            expect(canvas.height).toEqual(100);
            expect(viewport.mock.calls).toEqual([
                [0, 0, 200, 100],
            ]);
            expect(handleSizeChanged.mock.calls).toEqual([
                [],
            ]);

            runtime.adjustViewport();
            expect(viewport.mock.calls).toEqual([
                [0, 0, 200, 100],
            ]);
            expect(handleSizeChanged.mock.calls).toEqual([
                [],
            ]);
        });

        it('return default state', () => {
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

        it('clear buffer', () => {
            const runtime = new Runtime(container);

            runtime.clearBuffer();
            runtime.clearBuffer('color|depth');
            runtime.clearBuffer('depth|stencil');
            runtime.clearBuffer('color|depth|stencil');

            expect(clear.mock.calls).toEqual([
                [COLOR_BUFFER_BIT],
                [COLOR_BUFFER_BIT | DEPTH_BUFFER_BIT],
                [DEPTH_BUFFER_BIT | STENCIL_BUFFER_BIT],
                [COLOR_BUFFER_BIT | DEPTH_BUFFER_BIT | STENCIL_BUFFER_BIT],
            ]);
        });
    });
});
