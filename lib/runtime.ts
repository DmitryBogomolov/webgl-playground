import { handleWindowResize } from './utils/resize-handler';
import { CancelSubscriptionCallback } from './utils/cancel-subscription-callback';
import { generateId } from './utils/id-generator';
import { Logger } from './utils/logger';
import { RenderFrameCallback, RenderLoop } from './render-loop';
import { color, Color } from './color';
import { vec2, Vec2 } from './geometry/vec2';

const {
    COLOR_BUFFER_BIT,
    COLOR_CLEAR_VALUE,
} = WebGLRenderingContext.prototype;

interface State {
    clearColor: Color;
    currentProgram: WebGLProgram | null;
}

export class Runtime {
    private readonly _id = generateId('Runtime');
    private readonly _logger = new Logger(this._id);
    private readonly _canvas: HTMLCanvasElement;
    private readonly _renderLoop = new RenderLoop();
    private readonly _disposeResizeHandler: CancelSubscriptionCallback;
    private _canvasSize: Vec2 = { x: 0, y: 0 };
    private readonly _state: State;
    readonly gl: WebGLRenderingContext;
    readonly vaoExt: OES_vertex_array_object;

    private readonly _handleContextLost: EventListener = () => {
        this._logger.warn('context is lost');
    };

    private readonly _handleContextRestored: EventListener = () => {
        this._logger.warn('context is restored');
    };

    constructor(element: HTMLElement) {
        this._logger.log('init');
        this._canvas = element instanceof HTMLCanvasElement ? element : createCanvas(element);
        this.gl = this._getContext();
        this.vaoExt = this._getVaoExt();
        this._canvas.addEventListener('webglcontextlost', this._handleContextLost);
        this._canvas.addEventListener('webglcontextrestored', this._handleContextRestored);
        // Initial state is formed according to specification.
        // These values could be queried with `gl.getParameter` but that would unnecessarily increase in startup time.
        this._state = {
            clearColor: color(0, 0, 0, 0),
            currentProgram: null,
        };
        this.adjustViewport();
        this._disposeResizeHandler = handleWindowResize(() => {
            this.adjustViewport();
        });
    }

    dispose(): void {
        this._logger.log('dispose');
        this._renderLoop.cancel();
        this._canvas.removeEventListener('webglcontextlost', this._handleContextLost);
        this._canvas.removeEventListener('webglcontextrestored', this._handleContextRestored);
        this._disposeResizeHandler();
        if (isOwnCanvas(this._canvas)) {
            this._canvas.remove();
        }
    }

    private _getContext(): WebGLRenderingContext {
        const context = this._canvas.getContext('webgl', CONTEXT_OPTIONS);
        if (!context) {
            throw this._logger.error('failed to get webgl context');
        }
        return context;
    }

    private _getVaoExt(): OES_vertex_array_object {
        const ext = this.gl.getExtension('OES_vertex_array_object');
        if (!ext) {
            throw this._logger.error('failed to get OES_vertex_array_object extension');
        }
        return ext;
    }

    canvas(): HTMLCanvasElement {
        return this._canvas;
    }

    canvasSize(): Vec2 {
        return this._canvasSize;
    }

    toCanvasPixels(pixels: number): number {
        return pixels * devicePixelRatio;
    }

    ndc2px({ x, y }: Vec2): Vec2 {
        return vec2(
            (x + 1) / 2 * this._canvasSize.x / devicePixelRatio,
            (1 - y) / 2 * this._canvasSize.y / devicePixelRatio,
        );
    }

    px2ndc({ x, y }: Vec2): Vec2 {
        return vec2(
            +x * devicePixelRatio / this._canvasSize.x * 2 - 1,
            -y * devicePixelRatio / this._canvasSize.y * 2 + 1,
        );
    }

    adjustViewport(): void {
        const width = (devicePixelRatio * this._canvas.clientWidth) | 0;
        const height = (devicePixelRatio * this._canvas.clientHeight) | 0;
        if (this._canvasSize.x === width && this._canvasSize.y === height) {
            return;
        }
        this._canvasSize = { x: width, y: height };
        this._canvas.width = width;
        this._canvas.height = height;
        this.gl.viewport(0, 0, width, height);
        this._renderLoop.update();
    }

    clearColorBuffer(): void {
        this._logger.log('clear_color_buffer');
        this.gl.clear(COLOR_BUFFER_BIT);
    }

    clearColor(): Color {
        return this._state.clearColor;
    }

    setClearColor(clearColor: Color): void {
        if (this._state.clearColor === clearColor) {
            return;
        }
        const { r, g, b, a } = clearColor;
        this._logger.log('set_clear_color({0}, {1}, {2}, {3})', r, g, b, a);
        this.gl.clearColor(r, g, b, a);
        // Actual gl state is queried (rather than just use `clearColor` argument)
        // because `gl.clearColor` somehow processes its argument (e.g. `(r, g, b)` becomes `(r, g, b, 1)`).
        this._state.clearColor = readClearColor(this.gl);
    }

    useProgram(program: WebGLProgram | null, id: string): void {
        if (this._state.currentProgram === program) {
            return;
        }
        this._logger.log('use_program({0})', id);
        this.gl.useProgram(program);
        this._state.currentProgram = program;
    }

    onRender(callback: RenderFrameCallback): CancelSubscriptionCallback {
        return this._renderLoop.onRender(callback);
    }

    requestRender(): void {
        this._renderLoop.update();
    }
}

function readClearColor(gl: WebGLRenderingContext): Color {
    const [r, g, b, a] = gl.getParameter(COLOR_CLEAR_VALUE) as Float32Array;
    return color(r, g, b, a);
}

const CANVAS_TAG = Symbol('CanvasTag');

const CONTEXT_OPTIONS: WebGLContextAttributes = {
    alpha: true,
    antialias: false,
    premultipliedAlpha: false,
};

function createCanvas(container: HTMLElement): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.display = 'inline-block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.border = 'none';
    canvas.style.backgroundColor = 'none';
    container.appendChild(canvas);
    // @ts-ignore Tag canvas.
    canvas[CANVAS_TAG] = true;
    return canvas;
}

function isOwnCanvas(canvas: HTMLCanvasElement): boolean {
    return CANVAS_TAG in canvas;
}
