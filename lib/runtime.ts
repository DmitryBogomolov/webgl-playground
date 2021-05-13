import { colors, Color } from './color';
import { generateId, Logger } from './utils';

function createCanvas(container: HTMLElement): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.display = 'inline-block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.border = 'none';
    canvas.style.backgroundColor = 'black';
    container.appendChild(canvas);

    const width = Math.floor(devicePixelRatio * canvas.clientWidth);
    const height = Math.floor(devicePixelRatio * canvas.clientHeight);
    canvas.width = width;
    canvas.height = height;

    return canvas;
}

export class Runtime {
    private readonly _id = generateId('Runtime');
    private readonly _logger = new Logger(this._id);
    private readonly _canvas: HTMLCanvasElement;
    readonly gl: WebGLRenderingContext;
    readonly vaoExt: OES_vertex_array_object;

    constructor(container: HTMLElement) {
        this._logger.log('init');
        this._canvas = createCanvas(container);
        this.gl = this._getContext();
        this.vaoExt = this._getVaoExt();
        this._canvas.addEventListener('webglcontextlost', this._handleContextLost);
        this._canvas.addEventListener('webglcontextrestored', this._handleContextRestored);
        this._setup();
    }

    dispose(): void {
        this._logger.log('dispose');
        this._canvas.removeEventListener('webglcontextlost', this._handleContextLost);
        this._canvas.removeEventListener('webglcontextrestored', this._handleContextRestored);
        this._canvas.remove();
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
        this._logger.log('context is restored');
    };

    private _setup(): void {
        const gl = this.gl;
        const { r, g, b, a } = colors.BLACK;
        gl.viewport(0, 0, this._canvas.width, this._canvas.height);
        gl.clearColor(r, g, b, a);
    }

    clearColor(): void {
        const gl = this.gl;
        gl.clear(gl.COLOR_BUFFER_BIT);
    }

    setClearColor({ r, g, b, a }: Color): void {
        this._logger.log('set_clear_color({0}, {1}, {2}, {3})', r, g, b, a);
        this.gl.clearColor(r, g, b, a);
    }
}
