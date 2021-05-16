import { contextConstants } from './context-constants';
import { color, Color } from './color';
import { generateId, Logger } from './utils';

const {
    COLOR_BUFFER_BIT,
    COLOR_CLEAR_VALUE,
} = contextConstants;

function createCanvas(container: HTMLElement): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.display = 'inline-block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.border = 'none';
    canvas.style.backgroundColor = 'black';
    container.appendChild(canvas);
    return canvas;
}

function setCanvasSize(canvas: HTMLCanvasElement): void {
    canvas.width = (devicePixelRatio * canvas.clientWidth) >>> 0;
    canvas.height = (devicePixelRatio * canvas.clientHeight) >>> 0;
}

export class Runtime {
    private readonly _id = generateId('Runtime');
    private readonly _logger = new Logger(this._id);
    private readonly _canvas: HTMLCanvasElement;
    private readonly _isOwnCanvas: boolean;
    readonly gl: WebGLRenderingContext;
    readonly vaoExt: OES_vertex_array_object;

    constructor(element: HTMLElement) {
        this._logger.log('init');
        this._isOwnCanvas = !(element instanceof HTMLCanvasElement);
        this._canvas = this._isOwnCanvas ? createCanvas(element) : element as HTMLCanvasElement;
        this.gl = this._getContext();
        this.vaoExt = this._getVaoExt();
        this._canvas.addEventListener('webglcontextlost', this._handleContextLost);
        this._canvas.addEventListener('webglcontextrestored', this._handleContextRestored);
        this.adjustViewport();
    }

    dispose(): void {
        this._logger.log('dispose');
        this._canvas.removeEventListener('webglcontextlost', this._handleContextLost);
        this._canvas.removeEventListener('webglcontextrestored', this._handleContextRestored);
        if (this._isOwnCanvas) {
            this._canvas.remove();
        }
    }

    private _getContext(): WebGLRenderingContext {
        const context = this._canvas.getContext('webgl', {
            alpha: false,
            antialias: false,
            premultipliedAlpha: false,
        });
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

    private readonly _handleContextLost: EventListener = () => {
        this._logger.warn('context is lost');
    };

    private readonly _handleContextRestored: EventListener = () => {
        this._logger.warn('context is restored');
    };

    adjustViewport(): void {
        if (this._isOwnCanvas) {
            setCanvasSize(this._canvas);
        }
        this.gl.viewport(0, 0, this._canvas.width, this._canvas.height);
    }

    clearColor(): void {
        this._logger.log('clear_color');
        this.gl.clear(COLOR_BUFFER_BIT);
    }

    getClearColor(): Color {
        const [r, g, b, a] = this.gl.getParameter(COLOR_CLEAR_VALUE);
        return color(r, g, b, a);
    }

    setClearColor({ r, g, b, a }: Color): void {
        this._logger.log('set_clear_color({0}, {1}, {2}, {3})', r, g, b, a);
        this.gl.clearColor(r, g, b, a);
    }
}
