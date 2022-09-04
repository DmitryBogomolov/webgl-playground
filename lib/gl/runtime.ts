import { BUFFER_MASK, DEPTH_FUNC, CULL_FACE, EXTENSION, RuntimeOptions } from './types/runtime';
import { Vec2 } from '../geometry/types/vec2';
import { Color } from './types/color';
import { GLValuesMap } from './types/gl-values-map';
import { GLHandleWrapper } from './types/gl-handle-wrapper';
import { FramebufferTarget } from './types/framebuffer-target';
import { EventProxy } from '../utils/types/event-emitter';
import { onWindowResize, offWindowResize } from '../utils/resize-handler';
import { generateId } from '../utils/id-generator';
import { EventEmitter } from '../utils/event-emitter';
import { Logger } from '../utils/logger';
import { RenderLoop } from './render-loop';
import { color, colorEq, isColor } from './color';
import { ZERO2, vec2, isVec2, eq2 } from '../geometry/vec2';

const GL_ARRAY_BUFFER = WebGLRenderingContext.prototype.ARRAY_BUFFER;
const GL_ELEMENT_ARRAY_BUFFER = WebGLRenderingContext.prototype.ELEMENT_ARRAY_BUFFER;
const GL_FRAMEBUFFER = WebGLRenderingContext.prototype.FRAMEBUFFER;
const GL_RENDERBUFFER = WebGLRenderingContext.prototype.RENDERBUFFER;
const GL_TEXTURE_2D = WebGLRenderingContext.prototype.TEXTURE_2D;
const GL_TEXTURE0 = WebGLRenderingContext.prototype.TEXTURE0;
const GL_UNPACK_FLIP_Y_WEBGL = WebGLRenderingContext.prototype.UNPACK_FLIP_Y_WEBGL;
const GL_DEPTH_TEST = WebGLRenderingContext.prototype.DEPTH_TEST;
const GL_CULL_FACE = WebGLRenderingContext.prototype.CULL_FACE;

interface State {
    viewportSize: Vec2;
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
    framebuffer: WebGLFramebuffer | null;
    targetFramebuffer: FramebufferTarget | null;
    renderbuffer: WebGLRenderbuffer | null;
}

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

const CULL_FACE_MAP: GLValuesMap<CULL_FACE> = {
    'back': WebGLRenderingContext.prototype.BACK,
    'front': WebGLRenderingContext.prototype.FRONT,
    'front_and_back': WebGLRenderingContext.prototype.FRONT_AND_BACK,
};

const EXTENSION_MAP: Readonly<Record<EXTENSION, string>> = {
    'element_index_uint': 'OES_element_index_uint',
};

const DEFAULT_OPTIONS: Required<RuntimeOptions> = {
    alpha: true,
    antialias: false,
    premultipliedAlpha: false,
    trackWindowResize: true,
    extensions: [],
};

export class Runtime {
    private readonly _id = generateId('Runtime');
    private readonly _logger = new Logger(this._id);
    private readonly _options: Required<RuntimeOptions>;
    private readonly _canvas: HTMLCanvasElement;
    private readonly _renderLoop = new RenderLoop();
    private _size: Vec2 = ZERO2;
    private _canvasSize: Vec2 = ZERO2;
    private readonly _sizeChanged = new EventEmitter((handler) => {
        // Immediately notify subscriber so that it may perform initial calculation.
        handler();
    });
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
        this._enableExtensions();
        this._canvas.addEventListener('webglcontextlost', this._handleContextLost);
        this._canvas.addEventListener('webglcontextrestored', this._handleContextRestored);

        // Initial state is formed according to specification.
        // These values could be queried with `gl.getParameter` but that would unnecessarily increase in startup time.
        this._state = {
            viewportSize: ZERO2,
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
            framebuffer: null,
            targetFramebuffer: null,
            renderbuffer: null,
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

    id(): string {
        return this._id;
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

    private _enableExtensions(): void {
        for (const ext of this._options.extensions) {
            const name = EXTENSION_MAP[ext];
            if (!name) {
                throw this._logger.error('extension {0}: bad value', ext);
            }
            const ret = this.gl.getExtension(name) as unknown;
            if (!ret) {
                throw this._logger.error('failed to get {0} extension', name);
            }
        }
    }

    private _updateViewport(size: Vec2): void {
        if (eq2(this._state.viewportSize, size)) {
            return;
        }
        this._logger.log('update_viewport({0}, {1})', size.x, size.y);
        this.gl.viewport(0, 0, size.x, size.y);
        this._state.viewportSize = size;
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
        if (this._state.targetFramebuffer === null) {
            this._updateViewport(this._canvasSize);
        }
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

    frameRendered(): EventProxy<[number, number]> {
        return this._renderLoop.frameRendered();
    }

    requestFrameRender(): void {
        this._renderLoop.update();
    }

    sizeChanged(): EventProxy {
        return this._sizeChanged;
    }

    useProgram(program: GLHandleWrapper<WebGLProgram> | null): void {
        const handle = unwrapGLHandle(program);
        if (this._state.currentProgram === handle) {
            return;
        }
        this._logger.log('use_program({0})', program ? program.id() : null);
        this.gl.useProgram(handle);
        this._state.currentProgram = handle;
    }

    bindVertexArrayObject(vertexArrayObject: GLHandleWrapper<WebGLVertexArrayObjectOES> | null): void {
        const handle = unwrapGLHandle(vertexArrayObject);
        if (this._state.vertexArrayObject === handle) {
            return;
        }
        this._logger.log('bind_vertex_array_object({0})', vertexArrayObject ? vertexArrayObject.id() : null);
        this.vaoExt.bindVertexArrayOES(handle);
        this._state.vertexArrayObject = handle;
    }

    bindArrayBuffer(buffer: GLHandleWrapper<WebGLBuffer> | null): void {
        const handle = unwrapGLHandle(buffer);
        if (this._state.arrayBuffer === buffer) {
            return;
        }
        this._logger.log('bind_array_buffer({0})', buffer ? buffer.id() : null);
        this.gl.bindBuffer(GL_ARRAY_BUFFER, handle);
        this._state.arrayBuffer = handle;
    }

    bindElementArrayBuffer(buffer: GLHandleWrapper<WebGLBuffer> | null): void {
        const handle = unwrapGLHandle(buffer);
        if (this._state.elementArrayBuffers[this._state.vertexArrayObject as number] === handle) {
            return;
        }
        this._logger.log('bind_element_array_buffer({0})', buffer ? buffer.id() : null);
        this.gl.bindBuffer(GL_ELEMENT_ARRAY_BUFFER, handle);
        this._state.elementArrayBuffers[this._state.vertexArrayObject as number] = handle;
    }

    bindTexture(texture: GLHandleWrapper<WebGLTexture> | null): void {
        const handle = unwrapGLHandle(texture);
        if ((this._state.boundTextures[this._state.textureUnit] || null) === handle) {
            return;
        }
        this._logger.log('bind_texture({0})', texture ? texture.id() : null);
        this.gl.bindTexture(GL_TEXTURE_2D, handle);
        this._state.boundTextures[this._state.textureUnit] = handle;
    }

    setTextureUnit(unit: number, texture: GLHandleWrapper<WebGLTexture> | null): void {
        const handle = unwrapGLHandle(texture);
        if ((this._state.boundTextures[unit] || null) === handle) {
            return;
        }
        if (this._state.textureUnit !== unit) {
            this._logger.log('set_texture_unit({0}, {1})', unit, texture ? texture.id() : null);
            this.gl.activeTexture(GL_TEXTURE0 + unit);
            this._state.textureUnit = unit;
        }
        this.bindTexture(texture);
    }

    pixelStoreUnpackFlipYWebgl(unpackFlipYWebgl: boolean): void {
        if (this._state.pixelStoreUnpackFlipYWebgl === unpackFlipYWebgl) {
            return;
        }
        this._logger.log('unpack_flip_y_webgl({0})', unpackFlipYWebgl);
        this.gl.pixelStorei(GL_UNPACK_FLIP_Y_WEBGL, unpackFlipYWebgl);
        this._state.pixelStoreUnpackFlipYWebgl = unpackFlipYWebgl;
    }

    bindFramebuffer(framebuffer: GLHandleWrapper<WebGLFramebuffer> | null): void {
        const handle = unwrapGLHandle(framebuffer);
        if (this._state.framebuffer === handle) {
            return;
        }
        this._logger.log('bind_framebuffer({0})', framebuffer ? framebuffer.id() : null);
        this.gl.bindFramebuffer(GL_FRAMEBUFFER, handle);
        this._state.framebuffer = handle;
    }

    getFramebuffer(): FramebufferTarget | null {
        return this._state.targetFramebuffer;
    }

    setFramebuffer(framebuffer: FramebufferTarget | null): void {
        if (this._state.targetFramebuffer === framebuffer) {
            return;
        }
        this._logger.log('set_framebuffer({0})', framebuffer ? framebuffer.id() : null);
        this.bindFramebuffer(framebuffer);
        this._updateViewport(framebuffer ? framebuffer.size() : this._canvasSize);
        this._state.targetFramebuffer = framebuffer;
    }

    bindRenderbuffer(renderbuffer: GLHandleWrapper<WebGLRenderbuffer> | null): void {
        const handle = unwrapGLHandle(renderbuffer);
        if (this._state.renderbuffer === handle) {
            return;
        }
        this._logger.log('bind_renderbuffer({0})', renderbuffer ? renderbuffer.id() : null);
        this.gl.bindRenderbuffer(GL_RENDERBUFFER, handle);
        this._state.renderbuffer = handle;
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

function unwrapGLHandle<T>(wrapper: GLHandleWrapper<T> | null): T | null {
    return wrapper ? wrapper.glHandle() : null;
}

class GLHandleWrapperImpl<T> implements GLHandleWrapper<T> {
    private readonly _id: string;
    private readonly _handle: T;

    constructor(id: string, handle: T) {
        this._id = id;
        this._handle = handle;
    }

    id(): string {
        return this._id;
    }

    glHandle(): T {
        return this._handle;
    }
}

export function wrap<T>(id: string, handle: T): GLHandleWrapper<T> {
    return new GLHandleWrapperImpl(id, handle);
}
