import { onWindowResize, offWindowResize } from '../utils/resize-handler';
import { generateId } from '../utils/id-generator';
import { Logger } from '../utils/logger';
import { RenderFrameCallback, RenderLoop } from './render-loop';
import { Color, color, colorEq, isColor } from './color';
import { Vec2, ZERO2, vec2, isVec2, eq2 } from '../geometry/vec2';

const {
    COLOR_BUFFER_BIT, DEPTH_BUFFER_BIT, STENCIL_BUFFER_BIT,
    ARRAY_BUFFER, ELEMENT_ARRAY_BUFFER,
    TEXTURE_2D, TEXTURE0, UNPACK_FLIP_Y_WEBGL,
} = WebGLRenderingContext.prototype;

interface State {
    clearColor: Color;
    currentProgram: WebGLProgram | null;
    vertexArrayObject: WebGLVertexArrayObjectOES | null;
    arrayBuffer: WebGLBuffer | null;
    // ELEMENT_ARRAY_BUFFER is part of VAO state.
    // When bound VAO is changed bound element array buffer is changed as well. Hence state is dropped.
    elementArrayBuffers: { [key: number]: WebGLBuffer | null };
    textureUnit: number;
    boundTextures: { [key: number]: WebGLTexture | null };
    pixelStoreUnpackFlipYWebgl: boolean;
}

export enum BUFFER_MASK {
    COLOR = COLOR_BUFFER_BIT,
    DEPTH = DEPTH_BUFFER_BIT,
    STENCIL = STENCIL_BUFFER_BIT,
}

export class Runtime {
    private readonly _id = generateId('Runtime');
    private readonly _logger = new Logger(this._id);
    private readonly _canvas: HTMLCanvasElement;
    private readonly _renderLoop = new RenderLoop();
    private _size: Vec2 = ZERO2;
    private _canvasSize: Vec2 = ZERO2;
    private readonly _state: State;
    readonly gl: WebGLRenderingContext;
    readonly vaoExt: OES_vertex_array_object;

    private readonly _handleContextLost: EventListener = () => {
        this._logger.warn('context is lost');
    };

    private readonly _handleContextRestored: EventListener = () => {
        this._logger.warn('context is restored');
    };

    private readonly _handleWindowResize = (): void => {
        this.adjustViewport();
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
            vertexArrayObject: null,
            arrayBuffer: null,
            elementArrayBuffers: {
                [null as unknown as number]: null,
            },
            textureUnit: 0,
            boundTextures: {},
            pixelStoreUnpackFlipYWebgl: false,
        };
        this.adjustViewport();
        // TODO: Make it optional.
        onWindowResize(this._handleWindowResize);
    }

    dispose(): void {
        this._logger.log('dispose');
        this._renderLoop.cancel();
        this._canvas.removeEventListener('webglcontextlost', this._handleContextLost);
        this._canvas.removeEventListener('webglcontextrestored', this._handleContextRestored);
        offWindowResize(this._handleWindowResize);
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

    toCanvasPixels(pixels: number): number {
        return pixels * devicePixelRatio;
    }

    ndc2px({ x, y }: Vec2): Vec2 {
        return vec2(
            (x + 1) / 2 * this._size.x,
            (1 - y) / 2 * this._size.y,
        );
    }

    px2ndc({ x, y }: Vec2): Vec2 {
        return vec2(
            +x / this._size.x * 2 - 1,
            -y / this._size.y * 2 + 1,
        );
    }

    size(): Vec2 {
        return this._size;
    }

    setSize(size: Vec2): boolean {
        if (!isVec2(size)) {
            throw this._logger.error('set_size({0}): bad value', size);
        }
        const canvasSize = vec2((devicePixelRatio * size.x) | 0, (devicePixelRatio * size.y) | 0);
        if (eq2(this._size, size) && eq2(this._canvasSize, canvasSize)) {
            return false;
        }
        this._logger.log('set_size(width={0}, height={1})', size.x, size.y);
        // TODO: Provide "canvasResized" event.
        this._size = size;
        this._canvasSize = canvasSize;
        this._canvas.width = canvasSize.x;
        this._canvas.height = canvasSize.y;
        this.gl.viewport(0, 0, canvasSize.x, canvasSize.y);
        return true;
    }

    canvasSize(): Vec2 {
        return this._canvasSize;
    }

    adjustViewport(): void {
        if (this.setSize(vec2(this._canvas.clientWidth, this._canvas.clientHeight))) {
            this._renderLoop.update();
        }
    }

    clearBuffer(mask: BUFFER_MASK = BUFFER_MASK.COLOR): void {
        this._logger.log('clear_buffer({0}', mask);
        this.gl.clear(mask);
    }

    clearColor(): Color {
        return this._state.clearColor;
    }

    setClearColor(clearColor: Color): boolean {
        if (!isColor(clearColor)) {
            throw this._logger.error('set_clear_color({0}): bad value', clearColor);
        }
        if (colorEq(this._state.clearColor, clearColor)) {
            return false;
        }
        const { r, g, b, a } = clearColor;
        this._logger.log('set_clear_color({0}, {1}, {2}, {3})', r, g, b, a);
        this.gl.clearColor(r, g, b, a);
        this._state.clearColor = clearColor;
        return true;
    }

    depthColor(): Color {
        // TODO...
        return null as any;
    }

    setDepthColor(depthColor: Color): boolean {
        // TODO...
        return false;
    }

    stencilColor(): Color {
        // TODO...
        return null as any;
    }

    setStencilColor(stencilColor: Color): boolean {
        // TODO...
        return false;
    }

    onRender(callback: RenderFrameCallback): void {
        this._renderLoop.onRender(callback);
    }

    offRender(callback: RenderFrameCallback): void {
        this._renderLoop.offRender(callback);
    }

    requestRender(): void {
        this._renderLoop.update();
    }

    useProgram(program: WebGLProgram | null, id: string): void {
        if (this._state.currentProgram === program) {
            return;
        }
        this._logger.log('use_program({0})', program ? id : null);
        this.gl.useProgram(program);
        this._state.currentProgram = program;
    }

    bindVertexArrayObject(vertexArrayObject: WebGLVertexArrayObjectOES | null, id: string): void {
        if (this._state.vertexArrayObject === vertexArrayObject) {
            return;
        }
        this._logger.log('bind_vertex_array_object({0})', vertexArrayObject ? id : null);
        this.vaoExt.bindVertexArrayOES(vertexArrayObject);
        this._state.vertexArrayObject = vertexArrayObject;
    }

    bindArrayBuffer(buffer: WebGLBuffer | null, id: string): void {
        if (this._state.arrayBuffer === buffer) {
            return;
        }
        this._logger.log('bind_array_buffer({0})', buffer ? id : null);
        this.gl.bindBuffer(ARRAY_BUFFER, buffer);
        this._state.arrayBuffer = buffer;
    }

    bindElementArrayBuffer(buffer: WebGLBuffer | null, id: string): void {
        if (this._state.elementArrayBuffers[this._state.vertexArrayObject as number] === buffer) {
            return;
        }
        this._logger.log('bind_element_array_buffer({0})', buffer ? id : null);
        this.gl.bindBuffer(ELEMENT_ARRAY_BUFFER, buffer);
        this._state.elementArrayBuffers[this._state.vertexArrayObject as number] = buffer;
    }

    bindTexture(texture: WebGLTexture | null, id: string): void {
        if ((this._state.boundTextures[this._state.textureUnit] || null) === texture) {
            return;
        }
        this._logger.log('bind_texture({0})', texture ? id : null);
        this.gl.bindTexture(TEXTURE_2D, texture);
        this._state.boundTextures[this._state.textureUnit] = texture;
    }

    activeTexture(unit: number): void {
        if (this._state.textureUnit === unit) {
            return;
        }
        this._logger.log('active_texture({0})', unit);
        this.gl.activeTexture(TEXTURE0 + unit);
        this._state.textureUnit = unit;
    }

    pixelStoreUnpackFlipYWebgl(unpackFlipYWebgl: boolean): void {
        if (this._state.pixelStoreUnpackFlipYWebgl === unpackFlipYWebgl) {
            return;
        }
        this._logger.log('unpack_flip_y_webgl({0})', unpackFlipYWebgl);
        this.gl.pixelStorei(UNPACK_FLIP_Y_WEBGL, unpackFlipYWebgl);
        this._state.pixelStoreUnpackFlipYWebgl = unpackFlipYWebgl;
    }
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
