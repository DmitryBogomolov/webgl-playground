import { onWindowResize, offWindowResize } from '../utils/resize-handler';
import { generateId } from '../utils/id-generator';
import { EventEmitter } from '../utils/event-emitter';
import { Logger } from '../utils/logger';
import { GLValuesMap } from './gl-values-map';
import { RenderFrameCallback, RenderLoop } from './render-loop';
import { Color, color, colorEq, isColor } from './color';
import { Vec2, ZERO2, vec2, isVec2, eq2 } from '../geometry/vec2';

const GL_ARRAY_BUFFER = WebGLRenderingContext.prototype.ARRAY_BUFFER;
const GL_ELEMENT_ARRAY_BUFFER = WebGLRenderingContext.prototype.ELEMENT_ARRAY_BUFFER;
const GL_TEXTURE_2D = WebGLRenderingContext.prototype.TEXTURE_2D;
const GL_TEXTURE0 = WebGLRenderingContext.prototype.TEXTURE0;
const GL_UNPACK_FLIP_Y_WEBGL = WebGLRenderingContext.prototype.UNPACK_FLIP_Y_WEBGL;
const GL_DEPTH_TEST = WebGLRenderingContext.prototype.DEPTH_TEST;
const GL_CULL_FACE = WebGLRenderingContext.prototype.CULL_FACE;

interface State {
    clearColor: Color;
    clearDepth: number;
    clearStencil: number;
    depthTest: boolean;
    depthFunc: DEPTH_FUNC;
    culling: boolean;
    cullFace: CULL_FACE;
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

export type BUFFER_MASK = (
    | 'color' | 'depth' | 'stencil'
    | 'color|depth' | 'color|stencil' | 'depth|stencil'
    | 'color|depth|stencil'
);
const BUFFER_MASK_MAP: GLValuesMap<BUFFER_MASK> = {
    'color': WebGLRenderingContext.prototype.COLOR_BUFFER_BIT,
    'depth': WebGLRenderingContext.prototype.DEPTH_BUFFER_BIT,
    'stencil': WebGLRenderingContext.prototype.STENCIL_BUFFER_BIT,
    'color|depth': (
        WebGLRenderingContext.prototype.COLOR_BUFFER_BIT
        | WebGLRenderingContext.prototype.DEPTH_BUFFER_BIT
    ),
    'color|stencil': (
        WebGLRenderingContext.prototype.COLOR_BUFFER_BIT
        | WebGLRenderingContext.prototype.STENCIL_BUFFER_BIT
    ),
    'depth|stencil': (
        WebGLRenderingContext.prototype.DEPTH_BUFFER_BIT
        | WebGLRenderingContext.prototype.STENCIL_BUFFER_BIT
    ),
    'color|depth|stencil': (
        WebGLRenderingContext.prototype.COLOR_BUFFER_BIT
        | WebGLRenderingContext.prototype.DEPTH_BUFFER_BIT
        | WebGLRenderingContext.prototype.STENCIL_BUFFER_BIT
    ),
};

export type DEPTH_FUNC = (
    'never' | 'less' | 'lequal' | 'greater' | 'gequal' | 'equal' | 'notequal' | 'always'
);
const DEPTH_FUNC_MAP: GLValuesMap<DEPTH_FUNC> = {
    'never': WebGLRenderingContext.prototype.NEVER,
    'less': WebGLRenderingContext.prototype.LESS,
    'lequal': WebGLRenderingContext.prototype.LEQUAL,
    'greater': WebGLRenderingContext.prototype.GREATER,
    'gequal': WebGLRenderingContext.prototype.GEQUAL,
    'equal': WebGLRenderingContext.prototype.EQUAL,
    'notequal': WebGLRenderingContext.prototype.NOTEQUAL,
    'always': WebGLRenderingContext.prototype.ALWAYS,
};

export type CULL_FACE = (
    'back' | 'front' | 'front_and_back'
);
const CULL_FACE_MAP: GLValuesMap<CULL_FACE> = {
    'back': WebGLRenderingContext.prototype.BACK,
    'front': WebGLRenderingContext.prototype.FRONT,
    'front_and_back': WebGLRenderingContext.prototype.FRONT_AND_BACK,
};

export interface RuntimeOptions {
    alpha?: boolean,
    antialias?: boolean,
    premultipliedAlpha?: boolean,
    trackWindowResize?: boolean,
}
const DEFAULT_OPTIONS: Required<RuntimeOptions> = {
    alpha: true,
    antialias: false,
    premultipliedAlpha: false,
    trackWindowResize: true,
};

export class Runtime {
    private readonly _id = generateId('Runtime');
    private readonly _logger = new Logger(this._id);
    private readonly _options: Required<RuntimeOptions>;
    private readonly _canvas: HTMLCanvasElement;
    private readonly _renderLoop = new RenderLoop();
    private _size: Vec2 = ZERO2;
    private _canvasSize: Vec2 = ZERO2;
    private readonly _sizeChanged = new EventEmitter();
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

    constructor(element: HTMLElement, options?: RuntimeOptions) {
        this._options = { ...DEFAULT_OPTIONS, ...options };
        this._logger.log('init');
        this._canvas = element instanceof HTMLCanvasElement ? element : createCanvas(element);
        this.gl = this._getContext();
        this.vaoExt = this._getVaoExt();
        this._getU32IndexExt();
        this._canvas.addEventListener('webglcontextlost', this._handleContextLost);
        this._canvas.addEventListener('webglcontextrestored', this._handleContextRestored);
        // Initial state is formed according to specification.
        // These values could be queried with `gl.getParameter` but that would unnecessarily increase in startup time.
        this._state = {
            clearColor: color(0, 0, 0, 0),
            clearDepth: 1,
            clearStencil: 0,
            depthTest: false,
            depthFunc: 'less',
            culling: false,
            cullFace: 'back',
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
        if (this._options.trackWindowResize) {
            onWindowResize(this._handleWindowResize);
        }
    }

    dispose(): void {
        this._logger.log('dispose');
        this._renderLoop.cancel();
        this._canvas.removeEventListener('webglcontextlost', this._handleContextLost);
        this._canvas.removeEventListener('webglcontextrestored', this._handleContextRestored);
        if (this._options.trackWindowResize) {
            offWindowResize(this._handleWindowResize);
        }
        if (isOwnCanvas(this._canvas)) {
            this._canvas.remove();
        }
    }

    private _getContext(): WebGLRenderingContext {
        const context = this._canvas.getContext('webgl', this._options as WebGLContextAttributes);
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

    private _getU32IndexExt(): void {
        const ext = this.gl.getExtension('OES_element_index_uint');
        if (!ext) {
            throw this._logger.error('failed to get OES_element_index_uint extension');
        }
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
        this._size = size;
        this._canvasSize = canvasSize;
        this._canvas.width = canvasSize.x;
        this._canvas.height = canvasSize.y;
        this._sizeChanged.emit();
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

    clearBuffer(mask: BUFFER_MASK = 'color'): void {
        const value = BUFFER_MASK_MAP[mask];
        this._logger.log('clear_buffer({0})', mask);
        this.gl.clear(value);
    }

    getClearColor(): Color {
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

    getClearDepth(): number {
        return this._state.clearDepth;
    }

    setClearDepth(clearDepth: number): boolean {
        if (!(0 <= clearDepth && clearDepth <= 1)) {
            throw this._logger.error('set_clear_depth({0}): bad value', clearDepth);
        }
        if (this._state.clearDepth === clearDepth) {
            return false;
        }
        this._logger.log('set_clear_depth({0})', clearDepth);
        this.gl.clearDepth(clearDepth);
        this._state.clearDepth = Number(clearDepth);
        return true;
    }

    getClearStencil(): number {
        return this._state.clearStencil;
    }

    setClearStencil(clearStencil: number): boolean {
        if (!(0 <= clearStencil && clearStencil <= 1)) {
            throw this._logger.error('set_clear_stencil({0}): bad value', clearStencil);
        }
        if (this._state.clearStencil === clearStencil) {
            return false;
        }
        this._logger.log('set_clear_stencil({0})', clearStencil);
        this.gl.clearStencil(clearStencil);
        this._state.clearStencil = Number(clearStencil);
        return true;
    }

    getDepthTest(): boolean {
        return this._state.depthTest;
    }

    setDepthTest(depthTest: boolean): boolean {
        if (this._state.depthTest === depthTest) {
            return false;
        }
        this._logger.log('set_depth_test({0})', depthTest);
        if (depthTest) {
            this.gl.enable(GL_DEPTH_TEST);
        } else {
            this.gl.disable(GL_DEPTH_TEST);
        }
        this._state.depthTest = Boolean(depthTest);
        return true;
    }

    getDepthFunc(): DEPTH_FUNC {
        return this._state.depthFunc;
    }

    setDepthFunc(depthFunc: DEPTH_FUNC): boolean {
        const value = DEPTH_FUNC_MAP[depthFunc];
        if (!value) {
            throw this._logger.error('set_depth_func({0}): bad value', depthFunc);
        }
        if (this._state.depthFunc === depthFunc) {
            return false;
        }
        this._logger.log('set_depth_func({0})', depthFunc);
        this.gl.depthFunc(value);
        this._state.depthFunc = depthFunc;
        return true;
    }

    getCulling(): boolean {
        return this._state.culling;
    }

    setCulling(culling: boolean): boolean {
        if (this._state.culling === culling) {
            return false;
        }
        this._logger.log('set_culling({0})', culling);
        if (culling) {
            this.gl.enable(GL_CULL_FACE);
        } else {
            this.gl.disable(GL_CULL_FACE);
        }
        this._state.culling = Boolean(culling);
        return true;
    }

    getCullFace(): CULL_FACE {
        return this._state.cullFace;
    }

    setCullFace(cullFace: CULL_FACE): boolean {
        const value = CULL_FACE_MAP[cullFace];
        if (!value) {
            throw this._logger.error('set_cull_face({0}): bad value', cullFace);
        }
        if (this._state.cullFace === cullFace) {
            return false;
        }
        this._logger.log('set_cull_face({0})', cullFace);
        this.gl.cullFace(value);
        this._state.cullFace = cullFace;
        return true;
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

    onSizeChanged(callback: () => void): void {
        this._sizeChanged.on(callback);
        // Immediately notify subscriber so that it may perform initial calculation.
        callback();
    }

    offSizeChanged(callback: () => void): void {
        this._sizeChanged.off(callback);
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
        this.gl.bindBuffer(GL_ARRAY_BUFFER, buffer);
        this._state.arrayBuffer = buffer;
    }

    bindElementArrayBuffer(buffer: WebGLBuffer | null, id: string): void {
        if (this._state.elementArrayBuffers[this._state.vertexArrayObject as number] === buffer) {
            return;
        }
        this._logger.log('bind_element_array_buffer({0})', buffer ? id : null);
        this.gl.bindBuffer(GL_ELEMENT_ARRAY_BUFFER, buffer);
        this._state.elementArrayBuffers[this._state.vertexArrayObject as number] = buffer;
    }

    bindTexture(texture: WebGLTexture | null, id: string): void {
        if ((this._state.boundTextures[this._state.textureUnit] || null) === texture) {
            return;
        }
        this._logger.log('bind_texture({0})', texture ? id : null);
        this.gl.bindTexture(GL_TEXTURE_2D, texture);
        this._state.boundTextures[this._state.textureUnit] = texture;
    }

    activeTexture(unit: number): void {
        if (this._state.textureUnit === unit) {
            return;
        }
        this._logger.log('active_texture({0})', unit);
        this.gl.activeTexture(GL_TEXTURE0 + unit);
        this._state.textureUnit = unit;
    }

    pixelStoreUnpackFlipYWebgl(unpackFlipYWebgl: boolean): void {
        if (this._state.pixelStoreUnpackFlipYWebgl === unpackFlipYWebgl) {
            return;
        }
        this._logger.log('unpack_flip_y_webgl({0})', unpackFlipYWebgl);
        this.gl.pixelStorei(GL_UNPACK_FLIP_Y_WEBGL, unpackFlipYWebgl);
        this._state.pixelStoreUnpackFlipYWebgl = unpackFlipYWebgl;
    }
}

const CANVAS_TAG = Symbol('CanvasTag');

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
