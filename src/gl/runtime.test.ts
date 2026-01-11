import { Runtime, createRenderState } from './runtime';

describe('runtime', () => {
    describe('Runtime', () => {
        let container: HTMLElement;
        let canvas: HTMLCanvasElement;
        let ctx: WebGL2RenderingContext;
        let getExtension: jest.Mock;
        let viewport: jest.Mock;
        let enable: jest.Mock;
        let disable: jest.Mock;
        let clear: jest.Mock;
        let clearColor: jest.Mock;
        let pixelStorei: jest.Mock;
        let testResizeObserver: TestResizeObserver;
        let testRequestAnimationFrame: jest.Mock;
        // eslint-disable-next-line @typescript-eslint/unbound-method
        const { createElement } = document;
        const { ResizeObserver, devicePixelRatio, requestAnimationFrame } = globalThis;

        const {
            DEPTH_TEST,
            CULL_FACE,
            BLEND,
            UNPACK_FLIP_Y_WEBGL,
            COLOR_BUFFER_BIT, DEPTH_BUFFER_BIT, STENCIL_BUFFER_BIT,
        } = WebGL2RenderingContext.prototype;

        class TestResizeObserver {
            readonly callback: ResizeObserverCallback;
            element: unknown = null;
            constructor(func: ResizeObserverCallback) {
                this.callback = func;
                // eslint-disable-next-line @typescript-eslint/no-this-alias
                testResizeObserver = this;
            }
            observe(element: unknown): void {
                this.element = element;
            }
            disconnect(): void {
                this.element = 'disconnected';
            }
        }

        beforeEach(() => {
            container = document.createElement('div');
            canvas = document.createElement('canvas');
            Object.defineProperty(canvas, 'clientWidth', { value: 640, configurable: true });
            Object.defineProperty(canvas, 'clientHeight', { value: 480, configurable: true });
            getExtension = jest.fn();
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
            } as Partial<WebGL2RenderingContext> as WebGL2RenderingContext;
            canvas.getContext = jest.fn().mockReturnValueOnce(ctx);
            document.createElement = jest.fn().mockReturnValueOnce(canvas);
            // @ts-ignore Test environment.
            testResizeObserver = null;
            testRequestAnimationFrame = jest.fn();
            Object.assign(globalThis, {
                ResizeObserver: TestResizeObserver,
                devicePixelRatio: 4,
                requestAnimationFrame: testRequestAnimationFrame,
            });
        });

        afterEach(() => {
            document.createElement = createElement;
            Object.assign(globalThis, { ResizeObserver, devicePixelRatio, requestAnimationFrame });
            // @ts-ignore Test environment.
            testResizeObserver = null;
        });

        it('create runtime', () => {
            const runtime = new Runtime({ element: container });

            expect(runtime.canvas()).toEqual(canvas);
            expect(runtime.renderSize()).toEqual({ x: 0, y: 0 });
            expect(canvas.getContext as jest.Mock).toBeCalledWith(
                'webgl2',
                {
                    alpha: true,
                    antialias: false,
                    depth: true,
                    failIfMajorPerformanceCaveat: true,
                    premultipliedAlpha: false,
                    stencil: false,
                },
            );
            expect(testResizeObserver.element).toEqual(canvas);
        });

        it('resize / devicePixelContentBoxSize', () => {
            const renderSizeChanged = jest.fn();
            const runtime = new Runtime({ element: container });
            runtime.renderSizeChanged().on(renderSizeChanged);

            const entry: Pick<ResizeObserverEntry, 'devicePixelContentBoxSize'> = {
                devicePixelContentBoxSize: [{ inlineSize: 402, blockSize: 304 }],
            };
            testResizeObserver.callback(
                [entry as unknown as ResizeObserverEntry],
                null as unknown as ResizeObserver,
            );

            expect(runtime.renderSize()).toEqual({ x: 402, y: 304 });
            expect(canvas.width).toEqual(402);
            expect(canvas.height).toEqual(304);
            expect(renderSizeChanged).toBeCalledTimes(1);
            expect(testRequestAnimationFrame).toBeCalledTimes(1);
        });

        it('resize / contentBoxSize', () => {
            const renderSizeChanged = jest.fn();
            const runtime = new Runtime({ element: container });
            runtime.renderSizeChanged().on(renderSizeChanged);

            const entry: Pick<ResizeObserverEntry, 'contentBoxSize'> = {
                contentBoxSize: [{ inlineSize: 203, blockSize: 102 }],
            };

            testResizeObserver.callback(
                [entry as unknown as ResizeObserverEntry],
                null as unknown as ResizeObserver,
            );

            expect(runtime.renderSize()).toEqual({ x: 812, y: 408 });
            expect(canvas.width).toEqual(812);
            expect(canvas.height).toEqual(408);
            expect(renderSizeChanged).toBeCalledTimes(1);
            expect(testRequestAnimationFrame).toBeCalledTimes(1);
        });

        it('resize / contentRect', () => {
            const renderSizeChanged = jest.fn();
            const runtime = new Runtime({ element: container });
            runtime.renderSizeChanged().on(renderSizeChanged);

            const entry: Pick<ResizeObserverEntry, 'contentRect'> = {
                contentRect: { width: 203, height: 102 } as unknown as DOMRectReadOnly,
            };

            testResizeObserver.callback(
                [entry as unknown as ResizeObserverEntry],
                null as unknown as ResizeObserver,
            );

            expect(runtime.renderSize()).toEqual({ x: 812, y: 408 });
            expect(canvas.width).toEqual(812);
            expect(canvas.height).toEqual(408);
            expect(renderSizeChanged).toBeCalledTimes(1);
            expect(testRequestAnimationFrame).toBeCalledTimes(1);
        });

        it('return default state', () => {
            const runtime = new Runtime({ element: container });

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
            const runtime = new Runtime({ element: container });

            expect(runtime.setClearColor({ r: 0.5, g: 0, b: 0, a: 1 })).toEqual(true);
            expect(runtime.getClearColor()).toEqual({ r: 0.5, g: 0, b: 0, a: 1 });
            expect(runtime.setClearColor({ r: 0.5, g: 0, b: 0, a: 1 })).toEqual(false);
            expect(clearColor.mock.calls).toEqual([
                [0.5, 0, 0, 1],
            ]);
        });

        it('set flip y', () => {
            const runtime = new Runtime({ element: container });

            expect(runtime.setPixelStoreUnpackFlipYWebgl(true)).toEqual(true);
            expect(runtime.getPixelStoreUnpackFlipYWebgl()).toEqual(true);
            expect(runtime.setPixelStoreUnpackFlipYWebgl(true)).toEqual(false);
            expect(pixelStorei.mock.calls).toEqual([
                [UNPACK_FLIP_Y_WEBGL, true],
            ]);
        });

        it('set render state', () => {
            const runtime = new Runtime({ element: container });

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
            const runtime = new Runtime({ element: container });

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
            const runtime = new Runtime({ element: container });

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
