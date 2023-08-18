import type {
    RuntimeParams,
    READ_PIXELS_FORMAT, ReadPixelsOptions,
    EXTENSION,
    UNPACK_COLORSPACE_CONVERSION,
    RuntimeOptions,
} from './runtime.types';
import type {
    BUFFER_MASK,
    DEPTH_FUNC,
    StencilFuncState, StencilOpState,
    CULL_FACE,
    BLEND_FUNC,
    RenderState,
} from './render-state.types';
import type { Vec2 } from '../geometry/vec2.types';
import type { Color } from '../common/color.types';
import type { GLValuesMap } from './gl-values-map.types';
import type { Mapping } from '../common/mapping.types';
import type { GLHandleWrapper } from './gl-handle-wrapper.types';
import type { RenderTarget } from './render-target.types';
import type { Logger } from '../common/logger.types';
import type { EventProxy } from '../common/event-emitter.types';
import { BaseObject } from './base-object';
import { LoggerImpl, RootLogger } from '../common/logger';
import { onWindowResize, offWindowResize } from '../utils/resize-handler';
import { toStr } from '../utils/string-formatter';
import { EventEmitter } from '../common/event-emitter';
import { RenderLoop } from './render-loop';
import { makeRenderState, applyRenderState, isRenderState } from './render-state';
import { ZERO2, vec2, isVec2, eq2, clone2 } from '../geometry/vec2';
import { color, isColor, colorEq } from '../common/color';

const WebGL = WebGLRenderingContext.prototype;

const GL_ARRAY_BUFFER = WebGL.ARRAY_BUFFER;
const GL_ELEMENT_ARRAY_BUFFER = WebGL.ELEMENT_ARRAY_BUFFER;
const GL_FRAMEBUFFER = WebGL.FRAMEBUFFER;
const GL_RENDERBUFFER = WebGL.RENDERBUFFER;
const GL_TEXTURE_2D = WebGL.TEXTURE_2D;
const GL_TEXTURE_CUBE_MAP = WebGL.TEXTURE_CUBE_MAP;
const GL_TEXTURE0 = WebGL.TEXTURE0;
const GL_UNPACK_FLIP_Y_WEBGL = WebGL.UNPACK_FLIP_Y_WEBGL;
const GL_UNPACK_PREMULTIPLY_ALPHA_WEBGL = WebGL.UNPACK_PREMULTIPLY_ALPHA_WEBGL;
const GL_UNPACK_COLORSPACE_CONVERSION_WEBGL = WebGL.UNPACK_COLORSPACE_CONVERSION_WEBGL;

interface BindingsState {
    currentProgram: WebGLProgram | null;
    vertexArrayObject: WebGLVertexArrayObjectOES | null;
    arrayBuffer: WebGLBuffer | null;
    // ELEMENT_ARRAY_BUFFER is part of VAO state.
    // When bound VAO is changed bound element array buffer is changed as well. Hence state is dropped.
    elementArrayBuffers: { [key: number]: WebGLBuffer | null };
    textureUnit: number;
    boundTextures: { [key: number]: WebGLTexture | null };
    boundCubeTextures: { [key: number]: WebGLTexture | null };
    framebuffer: WebGLFramebuffer | null;
    renderbuffer: WebGLRenderbuffer | null;
}

interface ClearState {
    clearColor: Color;
    clearDepth: number;
    clearStencil: number;
}

interface PixelStoreState {
    pixelStoreUnpackFlipYWebgl: boolean;
    pixelStoreUnpackPremultiplyAlphaWebgl: boolean;
    pixelStoreUnpackColorSpaceConversionWebgl: UNPACK_COLORSPACE_CONVERSION;
}

const BUFFER_MASK_MAP: GLValuesMap<BUFFER_MASK> = {
    'color': WebGL.COLOR_BUFFER_BIT,
    'depth': WebGL.DEPTH_BUFFER_BIT,
    'stencil': WebGL.STENCIL_BUFFER_BIT,
    'color|depth': (WebGL.COLOR_BUFFER_BIT | WebGL.DEPTH_BUFFER_BIT),
    'color|stencil': (WebGL.COLOR_BUFFER_BIT | WebGL.STENCIL_BUFFER_BIT),
    'depth|stencil': (WebGL.DEPTH_BUFFER_BIT | WebGL.STENCIL_BUFFER_BIT),
    'color|depth|stencil': (WebGL.COLOR_BUFFER_BIT | WebGL.DEPTH_BUFFER_BIT | WebGL.STENCIL_BUFFER_BIT),
};

const UNPACK_COLORSPACE_CONVERSION_MAP: GLValuesMap<UNPACK_COLORSPACE_CONVERSION> = {
    'none': WebGL.NONE,
    'browser_default': WebGL.BROWSER_DEFAULT_WEBGL,
};

const READ_PIXELS_FORMAT_MAP: GLValuesMap<READ_PIXELS_FORMAT> = {
    'alpha': WebGL.ALPHA,
    'rgb': WebGL.RGB,
    'rgba': WebGL.RGBA,
};

const READ_PIXELS_TYPE_MAP: GLValuesMap<READ_PIXELS_FORMAT> = {
    'alpha': WebGL.UNSIGNED_BYTE,
    'rgb': WebGL.UNSIGNED_BYTE,
    'rgba': WebGL.UNSIGNED_BYTE,
};

const DEFAULT_READ_PIXELS_FORMAT: READ_PIXELS_FORMAT = 'rgba';

const EXTENSION_MAP: Mapping<EXTENSION, string> = {
    'element_index_uint': 'OES_element_index_uint',
    'depth_texture': 'WEBGL_depth_texture',
};

const DEFAULT_CONTEXT_ATTRIBUTES: WebGLContextAttributes = {
    alpha: true,
    depth: true,
    stencil: false,
    antialias: false,
    premultipliedAlpha: false,
    failIfMajorPerformanceCaveat: true,
};

const DEFAULT_RUNTIME_OPTIONS: Required<RuntimeOptions> = {
    trackWindowResize: true,
    extensions: [],
    contextAttributes: DEFAULT_CONTEXT_ATTRIBUTES,
};

export class Runtime extends BaseObject {
    private readonly _options: Required<RuntimeOptions>;
    private readonly _canvas: HTMLCanvasElement;
    private readonly _renderLoop = new RenderLoop();
    private readonly _defaultRenderTarget;
    private readonly _bindingsState: BindingsState;
    private readonly _clearState: ClearState;
    private readonly _pixelStoreState: PixelStoreState;
    private readonly _renderState: RenderState;
    private readonly _gl: WebGLRenderingContext;
    private readonly _vaoExt: OES_vertex_array_object;
    private _viewportSize: Vec2 = clone2(ZERO2);
    private _size: Vec2 = clone2(ZERO2);
    private _canvasSize: Vec2 = clone2(ZERO2);
    private _renderTarget: RenderTarget | null = null;

    private readonly _contextLost = new EventEmitter();
    private readonly _contextRestored = new EventEmitter();

    private readonly _sizeChanged = new EventEmitter((handler) => {
        // Immediately notify subscriber so that it may perform initial calculation.
        // TODO: Remove it. From the user perspective it looks weird.
        handler();
    });

    private readonly _handleContextLost: EventListener = () => {
        this._logWarn('context is lost');
        this._contextLost.emit();
    };

    private readonly _handleContextRestored: EventListener = () => {
        this._logWarn('context is restored');
        this._contextRestored.emit();
    };

    private readonly _handleWindowResize = (): void => {
        this.adjustViewport();
    };

    constructor(params: RuntimeParams) {
        super({ ...params, logger: new RootLogger('') });
        // @ts-ignore Override.
        this._logger = new RootLogger(this._id);
        this._options = { ...DEFAULT_RUNTIME_OPTIONS, ...params.options };
        this._logInfo('init');
        this._canvas = params.element instanceof HTMLCanvasElement ? params.element : createCanvas(params.element);
        this._gl = this._getContext();
        this._vaoExt = this._getVaoExt();
        this._enableExtensions();
        this._canvas.addEventListener('webglcontextlost', this._handleContextLost);
        this._canvas.addEventListener('webglcontextrestored', this._handleContextRestored);
        this._defaultRenderTarget = new DefaultRenderTarget(this, params.tag);
        this._bindingsState = getDefaultBindingsState();
        this._clearState = getDefaultClearState();
        this._pixelStoreState = getDefaultPixelStoreState();
        this._renderState = makeRenderState({}, this._logger);
        this.adjustViewport();
        if (this._options.trackWindowResize) {
            onWindowResize(this._handleWindowResize);
        }
    }

    dispose(): void {
        this._logInfo('dispose');
        this._renderLoop.cancel();
        this._renderLoop.clearCallbacks();
        this._sizeChanged.clear();
        this._contextLost.clear();
        this._contextRestored.clear();
        this._canvas.removeEventListener('webglcontextlost', this._handleContextLost);
        this._canvas.removeEventListener('webglcontextrestored', this._handleContextRestored);
        if (this._options.trackWindowResize) {
            offWindowResize(this._handleWindowResize);
        }
        if (isOwnCanvas(this._canvas)) {
            this._canvas.remove();
        }
        this._disposeBindings();
        this._loseContext();
        this._dispose();
    }

    private _disposeBindings(): void {
        this.bindVertexArrayObject(null);
        this.bindArrayBuffer(null);
        this.bindElementArrayBuffer(null);
        this.useProgram(null);
        this.bindFramebuffer(null);
        this.bindRenderbuffer(null);
        for (const [unit] of Object.entries(this._bindingsState.boundTextures)) {
            this.setTextureUnit(Number(unit), null);
        }
        for (const [unit] of Object.entries(this._bindingsState.boundCubeTextures)) {
            this.setCubeTextureUnit(Number(unit), null);
        }
    }

    gl(): WebGLRenderingContext {
        return this._gl;
    }

    vaoExt(): OES_vertex_array_object {
        return this._vaoExt;
    }

    logSilent(silent: boolean): void {
        (this._logger as RootLogger).setSilent(silent);
    }

    private _getContext(): WebGLRenderingContext {
        const context = this._canvas.getContext('webgl',
            { ...DEFAULT_CONTEXT_ATTRIBUTES, ...this._options.contextAttributes });
        if (!context) {
            throw this._logError('failed to get webgl context');
        }
        return context;
    }

    private _loseContext(): void {
        const ext = this._gl.getExtension('WEBGL_lose_context');
        if (!ext) {
            throw this._logError('failed to get WEBGL_lose_context extension');
        }
        ext.loseContext();
    }

    private _getVaoExt(): OES_vertex_array_object {
        const ext = this._gl.getExtension('OES_vertex_array_object');
        if (!ext) {
            throw this._logError('failed to get OES_vertex_array_object extension');
        }
        return ext;
    }

    private _enableExtensions(): void {
        for (const ext of this._options.extensions) {
            const name = EXTENSION_MAP[ext];
            if (!name) {
                throw this._logError(`extension ${ext}: bad value`);
            }
            const ret = this._gl.getExtension(name) as unknown;
            if (!ret) {
                throw this._logError(`failed to get ${name} extension`);
            }
        }
    }

    private _updateViewport(size: Vec2): void {
        if (eq2(this._viewportSize, size)) {
            return;
        }
        this._logInfo(`update_viewport(${size.x}, ${size.y})`);
        this._gl.viewport(0, 0, size.x, size.y);
        this._viewportSize = clone2(size);
    }

    canvas(): HTMLCanvasElement {
        return this._canvas;
    }

    size(): Vec2 {
        return this._size;
    }

    setSize(size: Vec2): boolean {
        if (!isVec2(size)) {
            throw this._logError(`set_size(${size}): bad value`);
        }
        if (eq2(this._size, size)) {
            return false;
        }
        this._logInfo(`set_size(width=${size.x}, height=${size.y})`);
        this._size = clone2(size);
        this._canvasSize = vec2((devicePixelRatio * size.x) | 0, (devicePixelRatio * size.y) | 0);
        this._canvas.width = this._canvasSize.x;
        this._canvas.height = this._canvasSize.y;
        this._sizeChanged.emit();
        if (this._renderTarget === null) {
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
        this._logInfo(`clear_buffer(${mask})`);
        this._gl.clear(value);
    }

    setRenderState(state: Readonly<RenderState>): boolean {
        if (!isRenderState(state)) {
            throw this._logError(`set_render_state(${toStr(state)}): bad value`);
        }
        return applyRenderState(this._renderState, state, this._gl, this._logger);
    }

    getClearColor(): Color {
        return this._clearState.clearColor;
    }

    setClearColor(clearColor: Color): boolean {
        if (!isColor(clearColor)) {
            throw this._logError(`set_clear_color(${clearColor}): bad value`);
        }
        if (colorEq(this._clearState.clearColor, clearColor)) {
            return false;
        }
        const { r, g, b, a } = clearColor;
        this._logInfo(`set_clear_color(${r}, ${g}, ${b}, ${a})`);
        this._gl.clearColor(r, g, b, a);
        this._clearState.clearColor = color(r, g, b, a);
        return true;
    }

    getClearDepth(): number {
        return this._clearState.clearDepth;
    }

    setClearDepth(clearDepth: number): boolean {
        if (!(0 <= clearDepth && clearDepth <= 1)) {
            throw this._logError(`set_clear_depth(${clearDepth}): bad value`);
        }
        if (this._clearState.clearDepth === clearDepth) {
            return false;
        }
        this._logInfo(`set_clear_depth(${clearDepth})`);
        this._gl.clearDepth(Number(clearDepth));
        this._clearState.clearDepth = Number(clearDepth);
        return true;
    }

    getClearStencil(): number {
        return this._clearState.clearStencil;
    }

    setClearStencil(clearStencil: number): boolean {
        if (!(0 <= clearStencil && clearStencil <= 1)) {
            throw this._logError(`set_clear_stencil(${clearStencil}): bad value`);
        }
        if (this._clearState.clearStencil === clearStencil) {
            return false;
        }
        this._logInfo(`set_clear_stencil(${clearStencil})`);
        this._gl.clearStencil(Number(clearStencil));
        this._clearState.clearStencil = Number(clearStencil);
        return true;
    }

    getDepthTest(): boolean {
        return this._renderState.depthTest;
    }

    getDepthMask(): boolean {
        return this._renderState.depthMask;
    }

    getDepthFunc(): DEPTH_FUNC {
        return this._renderState.depthFunc;
    }

    getStencilTest(): boolean {
        return this._renderState.stencilTest;
    }

    getStencilMask(): number {
        return this._renderState.stencilMask;
    }

    getStencilFunc(): StencilFuncState {
        return this._renderState.stencilFunc;
    }

    getStencilOp(): StencilOpState {
        return this._renderState.stencilOp;
    }

    getCulling(): boolean {
        return this._renderState.culling;
    }

    getCullFace(): CULL_FACE {
        return this._renderState.cullFace;
    }

    getBlending(): boolean {
        return this._renderState.blending;
    }

    getBlendFunc(): BLEND_FUNC {
        return this._renderState.blendFunc;
    }

    frameRequested(): EventProxy<[number, number]> {
        return this._renderLoop.frameRequested();
    }

    requestFrameRender(): void {
        this._renderLoop.update();
    }

    sizeChanged(): EventProxy {
        return this._sizeChanged;
    }

    useProgram(program: GLHandleWrapper<WebGLProgram> | null): void {
        const handle = unwrapGLHandle(program);
        if (this._bindingsState.currentProgram === handle) {
            return;
        }
        this._logInfo(`use_program(${program})`);
        this._gl.useProgram(handle);
        this._bindingsState.currentProgram = handle;
    }

    bindVertexArrayObject(vertexArrayObject: GLHandleWrapper<WebGLVertexArrayObjectOES> | null): void {
        const handle = unwrapGLHandle(vertexArrayObject);
        if (this._bindingsState.vertexArrayObject === handle) {
            return;
        }
        this._logInfo(`bind_vertex_array_object(${vertexArrayObject})`);
        this._vaoExt.bindVertexArrayOES(handle);
        this._bindingsState.vertexArrayObject = handle;
    }

    bindArrayBuffer(buffer: GLHandleWrapper<WebGLBuffer> | null): void {
        const handle = unwrapGLHandle(buffer);
        if (this._bindingsState.arrayBuffer === buffer) {
            return;
        }
        this._logInfo(`bind_array_buffer(${buffer})`);
        this._gl.bindBuffer(GL_ARRAY_BUFFER, handle);
        this._bindingsState.arrayBuffer = handle;
    }

    bindElementArrayBuffer(buffer: GLHandleWrapper<WebGLBuffer> | null): void {
        const handle = unwrapGLHandle(buffer);
        if (this._bindingsState.elementArrayBuffers[this._bindingsState.vertexArrayObject as number] === handle) {
            return;
        }
        this._logInfo(`bind_element_array_buffer(${buffer})`);
        this._gl.bindBuffer(GL_ELEMENT_ARRAY_BUFFER, handle);
        this._bindingsState.elementArrayBuffers[this._bindingsState.vertexArrayObject as number] = handle;
    }

    bindTexture(texture: GLHandleWrapper<WebGLTexture> | null): void {
        const handle = unwrapGLHandle(texture);
        if ((this._bindingsState.boundTextures[this._bindingsState.textureUnit] || null) === handle) {
            return;
        }
        this._logInfo(`bind_texture(${texture})`);
        this._gl.bindTexture(GL_TEXTURE_2D, handle);
        this._bindingsState.boundTextures[this._bindingsState.textureUnit] = handle;
    }

    bindCubeTexture(texture: GLHandleWrapper<WebGLTexture> | null): void {
        const handle = unwrapGLHandle(texture);
        if ((this._bindingsState.boundCubeTextures[this._bindingsState.textureUnit] || null) === handle) {
            return;
        }
        this._logInfo(`bind_cube_texture(${texture})`);
        this._gl.bindTexture(GL_TEXTURE_CUBE_MAP, handle);
        this._bindingsState.boundCubeTextures[this._bindingsState.textureUnit] = handle;
    }

    setTextureUnit(unit: number, texture: GLHandleWrapper<WebGLTexture> | null): void {
        const handle = unwrapGLHandle(texture);
        if ((this._bindingsState.boundTextures[unit] || null) === handle) {
            return;
        }
        if (this._bindingsState.textureUnit !== unit) {
            this._logInfo(`set_texture_unit(${unit}, ${texture})`);
            this._gl.activeTexture(GL_TEXTURE0 + unit);
            this._bindingsState.textureUnit = unit;
        }
        this.bindTexture(texture);
    }

    setCubeTextureUnit(unit: number, texture: GLHandleWrapper<WebGLTexture> | null): void {
        const handle = unwrapGLHandle(texture);
        if ((this._bindingsState.boundCubeTextures[unit] || null) === handle) {
            return;
        }
        if (this._bindingsState.textureUnit !== unit) {
            this._logInfo(`set_cube_texture_unit(${unit}, ${texture})`);
            this._gl.activeTexture(GL_TEXTURE0 + unit);
            this._bindingsState.textureUnit = unit;
        }
        this.bindCubeTexture(texture);
    }

    getPixelStoreUnpackFlipYWebgl(): boolean {
        return this._pixelStoreState.pixelStoreUnpackFlipYWebgl;
    }

    setPixelStoreUnpackFlipYWebgl(unpackFlipYWebgl: boolean): boolean {
        if (this._pixelStoreState.pixelStoreUnpackFlipYWebgl === unpackFlipYWebgl) {
            return false;
        }
        this._logInfo(`unpack_flip_y_webgl(${unpackFlipYWebgl})`);
        this._gl.pixelStorei(GL_UNPACK_FLIP_Y_WEBGL, Boolean(unpackFlipYWebgl));
        this._pixelStoreState.pixelStoreUnpackFlipYWebgl = Boolean(unpackFlipYWebgl);
        return true;
    }

    getPixelStoreUnpackPremultiplyAlphaWebgl(): boolean {
        return this._pixelStoreState.pixelStoreUnpackPremultiplyAlphaWebgl;
    }

    setPixelStoreUnpackPremultiplyAlphaWebgl(unpackPremultiplyAlphaWebgl: boolean): boolean {
        if (this._pixelStoreState.pixelStoreUnpackPremultiplyAlphaWebgl === unpackPremultiplyAlphaWebgl) {
            return false;
        }
        this._logInfo(`unpack_premultiply_alpha_webgl(${unpackPremultiplyAlphaWebgl})`);
        this._gl.pixelStorei(GL_UNPACK_PREMULTIPLY_ALPHA_WEBGL, Boolean(unpackPremultiplyAlphaWebgl));
        this._pixelStoreState.pixelStoreUnpackPremultiplyAlphaWebgl = Boolean(unpackPremultiplyAlphaWebgl);
        return true;
    }

    getPixelStoreUnpackColorSpaceConversionWebgl(): UNPACK_COLORSPACE_CONVERSION {
        return this._pixelStoreState.pixelStoreUnpackColorSpaceConversionWebgl;
    }

    setPixelStoreUnpackColorSpaceConversionWebgl(
        unpackColorSpaceConversionWebgl: UNPACK_COLORSPACE_CONVERSION,
    ): boolean {
        if (this._pixelStoreState.pixelStoreUnpackColorSpaceConversionWebgl === unpackColorSpaceConversionWebgl) {
            return false;
        }
        this._logInfo(`unpack_colorspace_conversion_webgl(${unpackColorSpaceConversionWebgl})`);
        const value = UNPACK_COLORSPACE_CONVERSION_MAP[unpackColorSpaceConversionWebgl];
        this._gl.pixelStorei(GL_UNPACK_COLORSPACE_CONVERSION_WEBGL, value);
        this._pixelStoreState.pixelStoreUnpackColorSpaceConversionWebgl = unpackColorSpaceConversionWebgl;
        return true;
    }

    bindFramebuffer(framebuffer: GLHandleWrapper<WebGLFramebuffer> | null): void {
        const handle = unwrapGLHandle(framebuffer);
        if (this._bindingsState.framebuffer === handle) {
            return;
        }
        this._logInfo(`bind_framebuffer(${framebuffer})`);
        this._gl.bindFramebuffer(GL_FRAMEBUFFER, handle);
        this._bindingsState.framebuffer = handle;
    }

    getDefaultRenderTarget(): RenderTarget {
        return this._defaultRenderTarget;
    }

    getRenderTarget(): RenderTarget {
        return this._renderTarget || this._defaultRenderTarget;
    }

    setRenderTarget(renderTarget: RenderTarget | null): void {
        if (renderTarget === this._defaultRenderTarget) {
            renderTarget = null;
        }
        if (this._renderTarget === renderTarget) {
            return;
        }
        this._logInfo(`set_render_target(${renderTarget})`);
        this.bindFramebuffer(renderTarget ? renderTarget as unknown as GLHandleWrapper<WebGLFramebuffer> : null);
        this._updateViewport((renderTarget || this._defaultRenderTarget).size());
        this._renderTarget = renderTarget;
    }

    bindRenderbuffer(renderbuffer: GLHandleWrapper<WebGLRenderbuffer> | null): void {
        const handle = unwrapGLHandle(renderbuffer);
        if (this._bindingsState.renderbuffer === handle) {
            return;
        }
        this._logInfo(`bind_renderbuffer(${renderbuffer})`);
        this._gl.bindRenderbuffer(GL_RENDERBUFFER, handle);
        this._bindingsState.renderbuffer = handle;
    }

    readPixels(renderTarget: RenderTarget | null, pixels: ArrayBufferView, options: ReadPixelsOptions = {}): void {
        if (renderTarget === this._defaultRenderTarget) {
            renderTarget = null;
        }
        const {
            x, y, width, height,
        } = getReadPixelsRange(renderTarget || this._defaultRenderTarget, options.p1, options.p2);
        const format = options.format || DEFAULT_READ_PIXELS_FORMAT;
        const glFormat = READ_PIXELS_FORMAT_MAP[format] || READ_PIXELS_FORMAT_MAP[DEFAULT_READ_PIXELS_FORMAT];
        const glType = READ_PIXELS_TYPE_MAP[format] || READ_PIXELS_TYPE_MAP[DEFAULT_READ_PIXELS_FORMAT];
        // In practice this state has no effect on "readPixels" output (though documentation states otherwise).
        // So it is just set to a fixed value to avoid any inconsistencies.
        this.setPixelStoreUnpackFlipYWebgl(false);
        this.bindFramebuffer(renderTarget ? renderTarget as unknown as GLHandleWrapper<WebGLFramebuffer> : null);
        this._gl.readPixels(x, y, width, height, glFormat, glType, pixels);
    }
}

const CANVAS_TAG = Symbol('CanvasTag');

function getDefaultBindingsState(): BindingsState {
    return {
        currentProgram: null,
        vertexArrayObject: null,
        arrayBuffer: null,
        elementArrayBuffers: {
            [null as unknown as number]: null,
        },
        textureUnit: 0,
        boundTextures: {},
        boundCubeTextures: {},
        framebuffer: null,
        renderbuffer: null,
    };
}

function getDefaultClearState(): ClearState {
    return {
        clearColor: color(0, 0, 0, 0),
        clearDepth: 1,
        clearStencil: 0,
    };
}

function getDefaultPixelStoreState(): PixelStoreState {
    return {
        pixelStoreUnpackFlipYWebgl: false,
        pixelStoreUnpackPremultiplyAlphaWebgl: false,
        pixelStoreUnpackColorSpaceConversionWebgl: 'browser_default',
    };
}

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

class DefaultRenderTarget extends BaseObject implements RenderTarget {
    private readonly _runtime: Runtime;

    constructor(runtime: Runtime, tag: string | undefined) {
        super({ logger: runtime.logger(), tag });
        this._runtime = runtime;
    }

    size(): Vec2 {
        return this._runtime.canvasSize();
    }
}

function getReadPixelsRange(
    renderTarget: RenderTarget, p1: Vec2 | undefined, p2: Vec2 | undefined,
): { x: number, y: number, width: number, height: number } {
    const x1 = p1 ? p1.x : 0;
    const x2 = p2 ? p2.x : renderTarget.size().x - 1;
    const y1 = p1 ? p1.y : 0;
    const y2 = p2 ? p2.y : renderTarget.size().y - 1;
    return {
        x: Math.min(x1, x2),
        y: Math.min(y1, y2),
        width: Math.abs(x1 - x2) + 1,
        height: Math.abs(y1 - y2) + 1,
    };
}

const defaultRenderStateLogger = new LoggerImpl('RenderState');

export function createRenderState(
    state: Partial<RenderState>, logger: Logger = defaultRenderStateLogger,
): RenderState {
    return makeRenderState(state, logger);
}
