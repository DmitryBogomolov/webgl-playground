import type {
    BUFFER_MASK,
    DEPTH_FUNC,
    StencilFuncState, StencilOpState, STENCIL_FUNC, STENCIL_OP,
    CULL_FACE,
    BLEND_FUNC,
    READ_PIXELS_FORMAT, ReadPixelsOptions,
    EXTENSION,
    RuntimeOptions,
} from './types/runtime';
import type { Vec2 } from '../geometry/types/vec2';
import type { Color } from './types/color';
import type { GLValuesMap } from './types/gl-values-map';
import type { GLHandleWrapper } from './types/gl-handle-wrapper';
import type { RenderTarget } from './types/render-target';
import type { EventProxy } from '../utils/types/event-emitter';
import { BaseWrapper } from './base-wrapper';
import { onWindowResize, offWindowResize } from '../utils/resize-handler';
import { EventEmitter } from '../utils/event-emitter';
import { RenderLoop } from './render-loop';
import { color, colorEq, isColor } from './color';
import { ZERO2, vec2, isVec2, eq2 } from '../geometry/vec2';

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
const GL_DEPTH_TEST = WebGL.DEPTH_TEST;
const GL_STENCIL_TEST = WebGL.STENCIL_TEST;
const GL_CULL_FACE = WebGL.CULL_FACE;
const GL_BLEND = WebGL.BLEND;

interface State {
    viewportSize: Vec2;
    clearColor: Color;
    clearDepth: number;
    clearStencil: number;
    depthTest: boolean;
    depthMask: boolean;
    depthFunc: DEPTH_FUNC;
    stencilTest: boolean;
    stencilMask: number;
    stencilFunc: StencilFuncState;
    stencilOp: StencilOpState;
    culling: boolean;
    cullFace: CULL_FACE;
    blending: boolean;
    blendFunc: BLEND_FUNC;
    currentProgram: WebGLProgram | null;
    vertexArrayObject: WebGLVertexArrayObjectOES | null;
    arrayBuffer: WebGLBuffer | null;
    // ELEMENT_ARRAY_BUFFER is part of VAO state.
    // When bound VAO is changed bound element array buffer is changed as well. Hence state is dropped.
    elementArrayBuffers: { [key: number]: WebGLBuffer | null };
    textureUnit: number;
    boundTextures: { [key: number]: WebGLTexture | null };
    boundCubeTextures: { [key: number]: WebGLTexture | null };
    pixelStoreUnpackFlipYWebgl: boolean;
    pixelStoreUnpackPremultiplyAlphaWebgl: boolean;
    framebuffer: WebGLFramebuffer | null;
    renderTarget: RenderTarget | null;
    renderbuffer: WebGLRenderbuffer | null;
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

const DEPTH_FUNC_MAP: GLValuesMap<DEPTH_FUNC> = {
    'never': WebGL.NEVER,
    'less': WebGL.LESS,
    'lequal': WebGL.LEQUAL,
    'greater': WebGL.GREATER,
    'gequal': WebGL.GEQUAL,
    'equal': WebGL.EQUAL,
    'notequal': WebGL.NOTEQUAL,
    'always': WebGL.ALWAYS,
};

const STENCIL_FUNC_MAP: GLValuesMap<STENCIL_FUNC> = {
    'never': WebGL.NEVER,
    'less': WebGL.LESS,
    'lequal': WebGL.LEQUAL,
    'greater': WebGL.GREATER,
    'gequal': WebGL.GEQUAL,
    'equal': WebGL.EQUAL,
    'notequal': WebGL.NOTEQUAL,
    'always': WebGL.ALWAYS,
};

const STENCIL_OP_MAP: GLValuesMap<STENCIL_OP> = {
    'keep': WebGL.KEEP,
    'zero': WebGL.ZERO,
    'replace': WebGL.REPLACE,
    'incr': WebGL.INCR,
    'incr_wrap': WebGL.INCR_WRAP,
    'decr': WebGL.DECR,
    'decr_wrap': WebGL.DECR_WRAP,
    'invert': WebGL.INVERT,
};

const CULL_FACE_MAP: GLValuesMap<CULL_FACE> = {
    'back': WebGL.BACK,
    'front': WebGL.FRONT,
    'front_and_back': WebGL.FRONT_AND_BACK,
};

const BLEND_FUNC_MAP_SRC: GLValuesMap<BLEND_FUNC> = {
    'one|zero': WebGL.ONE,
    'src_alpha|one_minus_src_alpha': WebGL.SRC_ALPHA,
    'one|one_minus_src_alpha': WebGL.ONE,
};

const BLEND_FUNC_MAP_DST: GLValuesMap<BLEND_FUNC> = {
    'one|zero': WebGL.ZERO,
    'src_alpha|one_minus_src_alpha': WebGL.ONE_MINUS_SRC_ALPHA,
    'one|one_minus_src_alpha': WebGL.ONE_MINUS_SRC_ALPHA,
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

const EXTENSION_MAP: Readonly<Record<EXTENSION, string>> = {
    'element_index_uint': 'OES_element_index_uint',
    'depth_texture': 'WEBGL_depth_texture',
};

const DEFAULT_OPTIONS: Required<RuntimeOptions> = {
    alpha: true,
    depth: true,
    stencil: false,
    antialias: false,
    premultipliedAlpha: false,
    trackWindowResize: true,
    failIfMajorPerformanceCaveat: true,
    extensions: [],
};

export class Runtime extends BaseWrapper {
    private readonly _options: Required<RuntimeOptions>;
    private readonly _canvas: HTMLCanvasElement;
    private readonly _renderLoop = new RenderLoop();
    private readonly _defaultRenderTarget;
    private _size: Vec2 = ZERO2;
    private _canvasSize: Vec2 = ZERO2;
    private readonly _sizeChanged = new EventEmitter((handler) => {
        // Immediately notify subscriber so that it may perform initial calculation.
        handler();
    });
    private readonly _state: State;
    // TODO: Replace it with getters.
    private readonly _gl: WebGLRenderingContext;
    private readonly _vaoExt: OES_vertex_array_object;

    private readonly _handleContextLost: EventListener = () => {
        this._logger.warn('context is lost');
    };

    private readonly _handleContextRestored: EventListener = () => {
        this._logger.warn('context is restored');
    };

    private readonly _handleWindowResize = (): void => {
        this.adjustViewport();
    };

    constructor(element: HTMLElement, options?: RuntimeOptions, tag?: string) {
        super(tag);
        this._options = { ...DEFAULT_OPTIONS, ...options };
        this._logger.log('init');
        this._canvas = element instanceof HTMLCanvasElement ? element : createCanvas(element);
        this._gl = this._getContext();
        this._vaoExt = this._getVaoExt();
        this._enableExtensions();
        this._canvas.addEventListener('webglcontextlost', this._handleContextLost);
        this._canvas.addEventListener('webglcontextrestored', this._handleContextRestored);
        this._defaultRenderTarget = new DefaultRenderTarget(this, tag);
        this._state = getDefaultState();
        this.adjustViewport();
        if (this._options.trackWindowResize) {
            onWindowResize(this._handleWindowResize);
        }
    }

    gl(): WebGLRenderingContext {
        return this._gl;
    }

    vaoExt(): OES_vertex_array_object {
        return this._vaoExt;
    }

    dispose(): void {
        this._logger.log('dispose');
        this._renderLoop.cancel();
        this._renderLoop.clearCallbacks();
        this._sizeChanged.clear();
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
        const ext = this._gl.getExtension('OES_vertex_array_object');
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
            const ret = this._gl.getExtension(name) as unknown;
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
        this._gl.viewport(0, 0, size.x, size.y);
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
        if (this._state.renderTarget === null) {
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
        this._gl.clear(value);
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
        this._gl.clearColor(r, g, b, a);
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
        this._gl.clearDepth(Number(clearDepth));
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
        this._gl.clearStencil(Number(clearStencil));
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
            this._gl.enable(GL_DEPTH_TEST);
        } else {
            this._gl.disable(GL_DEPTH_TEST);
        }
        this._state.depthTest = Boolean(depthTest);
        return true;
    }

    getDepthMask(): boolean {
        return this._state.depthMask;
    }

    setDepthMask(depthMask: boolean): boolean {
        if (this._state.depthMask === depthMask) {
            return false;
        }
        this._logger.log('set_depth_mask({0})', depthMask);
        this._gl.depthMask(Boolean(depthMask));
        this._state.depthMask = Boolean(depthMask);
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
        this._gl.depthFunc(value);
        this._state.depthFunc = depthFunc;
        return true;
    }

    getStencilTest(): boolean {
        return this._state.stencilTest;
    }

    setStencilTest(stencilTest: boolean): boolean {
        if (this._state.stencilTest === stencilTest) {
            return false;
        }
        this._logger.log('set_stencil_test({0})', stencilTest);
        if (stencilTest) {
            this._gl.enable(GL_STENCIL_TEST);
        } else {
            this._gl.disable(GL_STENCIL_TEST);
        }
        this._state.stencilTest = Boolean(stencilTest);
        return true;
    }

    getStencilMask(): number {
        return this._state.stencilMask;
    }

    setStencilMask(stencilMask: number): boolean {
        if (this._state.stencilMask === stencilMask) {
            return false;
        }
        this._logger.log('set_stencil_mask({0})', stencilMask);
        this._gl.stencilMask(Number(stencilMask));
        this._state.stencilMask = Number(stencilMask);
        return true;
    }

    getStencilFunc(): StencilFuncState {
        return this._state.stencilFunc;
    }

    setStencilFunc(stencilFunc: StencilFuncState): boolean {
        if (!stencilFunc) {
            throw this._logger.error('set_stencil_func({0}): bad value', stencilFunc);
        }
        const func = STENCIL_FUNC_MAP[stencilFunc.func];
        const ref = Number(stencilFunc.ref);
        const mask = Number(stencilFunc.mask);
        if (!func || !(mask >= 0) || !(ref >= 0)) {
            throw this._logger.error('set_stencil_func(func={0}, ref={1}, mask={2}): bad value',
                stencilFunc.func, stencilFunc.ref, stencilFunc.mask);
        }
        if (compareStencilFunc(this._state.stencilFunc, stencilFunc)) {
            return false;
        }
        this._logger.log('set_stencil_func(func={0}, ref={1}, mask={2})',
            stencilFunc.func, stencilFunc.ref, stencilFunc.mask);
        this._gl.stencilFunc(func, ref, mask);
        this._state.stencilFunc = { ...stencilFunc };
        return true;
    }

    getStencilOp(): StencilOpState {
        return this._state.stencilOp;
    }

    setStencilOp(stencilOp: StencilOpState): boolean {
        if (!stencilOp) {
            throw this._logger.error('set_stencil_op({0}): bad value', stencilOp);
        }
        const fail = STENCIL_OP_MAP[stencilOp.fail];
        const zfail = STENCIL_OP_MAP[stencilOp.zfail];
        const zpass = STENCIL_OP_MAP[stencilOp.zpass];
        if (!fail || !zfail || !zpass) {
            throw this._logger.error('set_stencil_op(fail={0}, zfail={1}, zpass={2}): bad value',
                stencilOp.fail, stencilOp.zfail, stencilOp.zpass);
        }
        if (compareStencilOp(this._state.stencilOp, stencilOp)) {
            return false;
        }
        this._logger.log('set_stencil_op(fail={0}, zfail={1}, zpass={2})',
            stencilOp.fail, stencilOp.zfail, stencilOp.zpass);
        this._gl.stencilOp(fail, zfail, zpass);
        this._state.stencilOp = { ...stencilOp };
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
            this._gl.enable(GL_CULL_FACE);
        } else {
            this._gl.disable(GL_CULL_FACE);
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
        this._gl.cullFace(value);
        this._state.cullFace = cullFace;
        return true;
    }

    getBlending(): boolean {
        return this._state.blending;
    }

    setBlending(blending: boolean): boolean {
        if (this._state.blending === blending) {
            return false;
        }
        this._logger.log('set_blending({0})', blending);
        if (blending) {
            this._gl.enable(GL_BLEND);
        } else {
            this._gl.disable(GL_BLEND);
        }
        this._state.blending = Boolean(blending);
        return true;
    }

    getBlendFunc(): BLEND_FUNC {
        return this._state.blendFunc;
    }

    setBlendFunc(blendFunc: BLEND_FUNC): boolean {
        const value = BLEND_FUNC_MAP_SRC[blendFunc];
        if (!value) {
            throw this._logger.error('set_blend_func({0}): bad value', blendFunc);
        }
        if (this._state.blendFunc === blendFunc) {
            return false;
        }
        this._logger.log('set_blend_func({0})', blendFunc);
        this._gl.blendFunc(value, BLEND_FUNC_MAP_DST[blendFunc]);
        this._state.blendFunc = blendFunc;
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
        this._gl.useProgram(handle);
        this._state.currentProgram = handle;
    }

    bindVertexArrayObject(vertexArrayObject: GLHandleWrapper<WebGLVertexArrayObjectOES> | null): void {
        const handle = unwrapGLHandle(vertexArrayObject);
        if (this._state.vertexArrayObject === handle) {
            return;
        }
        this._logger.log('bind_vertex_array_object({0})', vertexArrayObject ? vertexArrayObject.id() : null);
        this._vaoExt.bindVertexArrayOES(handle);
        this._state.vertexArrayObject = handle;
    }

    bindArrayBuffer(buffer: GLHandleWrapper<WebGLBuffer> | null): void {
        const handle = unwrapGLHandle(buffer);
        if (this._state.arrayBuffer === buffer) {
            return;
        }
        this._logger.log('bind_array_buffer({0})', buffer ? buffer.id() : null);
        this._gl.bindBuffer(GL_ARRAY_BUFFER, handle);
        this._state.arrayBuffer = handle;
    }

    bindElementArrayBuffer(buffer: GLHandleWrapper<WebGLBuffer> | null): void {
        const handle = unwrapGLHandle(buffer);
        if (this._state.elementArrayBuffers[this._state.vertexArrayObject as number] === handle) {
            return;
        }
        this._logger.log('bind_element_array_buffer({0})', buffer ? buffer.id() : null);
        this._gl.bindBuffer(GL_ELEMENT_ARRAY_BUFFER, handle);
        this._state.elementArrayBuffers[this._state.vertexArrayObject as number] = handle;
    }

    bindTexture(texture: GLHandleWrapper<WebGLTexture> | null): void {
        const handle = unwrapGLHandle(texture);
        if ((this._state.boundTextures[this._state.textureUnit] || null) === handle) {
            return;
        }
        this._logger.log('bind_texture({0})', texture ? texture.id() : null);
        this._gl.bindTexture(GL_TEXTURE_2D, handle);
        this._state.boundTextures[this._state.textureUnit] = handle;
    }

    bindCubeTexture(texture: GLHandleWrapper<WebGLTexture> | null): void {
        const handle = unwrapGLHandle(texture);
        if ((this._state.boundCubeTextures[this._state.textureUnit] || null) === handle) {
            return;
        }
        this._logger.log('bind_cube_texture({0})', texture ? texture.id() : null);
        this._gl.bindTexture(GL_TEXTURE_CUBE_MAP, handle);
        this._state.boundCubeTextures[this._state.textureUnit] = handle;
    }

    setTextureUnit(unit: number, texture: GLHandleWrapper<WebGLTexture> | null): void {
        const handle = unwrapGLHandle(texture);
        if ((this._state.boundTextures[unit] || null) === handle) {
            return;
        }
        if (this._state.textureUnit !== unit) {
            this._logger.log('set_texture_unit({0}, {1})', unit, texture ? texture.id() : null);
            this._gl.activeTexture(GL_TEXTURE0 + unit);
            this._state.textureUnit = unit;
        }
        this.bindTexture(texture);
    }

    setCubeTextureUnit(unit: number, texture: GLHandleWrapper<WebGLTexture> | null): void {
        const handle = unwrapGLHandle(texture);
        if ((this._state.boundCubeTextures[unit] || null) === handle) {
            return;
        }
        if (this._state.textureUnit !== unit) {
            this._logger.log('set_cube_texture_unit({0}, {1})', unit, texture ? texture.id() : null);
            this._gl.activeTexture(GL_TEXTURE0 + unit);
            this._state.textureUnit = unit;
        }
        this.bindCubeTexture(texture);
    }

    getPixelStoreUnpackFlipYWebgl(): boolean {
        return this._state.pixelStoreUnpackFlipYWebgl;
    }

    setPixelStoreUnpackFlipYWebgl(unpackFlipYWebgl: boolean): boolean {
        if (this._state.pixelStoreUnpackFlipYWebgl === unpackFlipYWebgl) {
            return false;
        }
        this._logger.log('unpack_flip_y_webgl({0})', unpackFlipYWebgl);
        this._gl.pixelStorei(GL_UNPACK_FLIP_Y_WEBGL, Boolean(unpackFlipYWebgl));
        this._state.pixelStoreUnpackFlipYWebgl = Boolean(unpackFlipYWebgl);
        return true;
    }

    getPixelStoreUnpackPremultiplyAlphaWebgl(): boolean {
        return this._state.pixelStoreUnpackPremultiplyAlphaWebgl;
    }

    setPixelStoreUnpackPremultiplyAlphaWebgl(unpackPremultiplyAlphaWebgl: boolean): boolean {
        if (this._state.pixelStoreUnpackPremultiplyAlphaWebgl === unpackPremultiplyAlphaWebgl) {
            return false;
        }
        this._logger.log('unpack_premultiply_alpha_webgl({0})', unpackPremultiplyAlphaWebgl);
        this._gl.pixelStorei(GL_UNPACK_PREMULTIPLY_ALPHA_WEBGL, Boolean(unpackPremultiplyAlphaWebgl));
        this._state.pixelStoreUnpackPremultiplyAlphaWebgl = Boolean(unpackPremultiplyAlphaWebgl);
        return true;
    }

    bindFramebuffer(framebuffer: GLHandleWrapper<WebGLFramebuffer> | null): void {
        const handle = unwrapGLHandle(framebuffer);
        if (this._state.framebuffer === handle) {
            return;
        }
        this._logger.log('bind_framebuffer({0})', framebuffer ? framebuffer.id() : null);
        this._gl.bindFramebuffer(GL_FRAMEBUFFER, handle);
        this._state.framebuffer = handle;
    }

    getDefaultRenderTarget(): RenderTarget {
        return this._defaultRenderTarget;
    }

    getRenderTarget(): RenderTarget {
        return this._state.renderTarget || this._defaultRenderTarget;
    }

    setRenderTarget(renderTarget: RenderTarget | null): void {
        if (renderTarget === this._defaultRenderTarget) {
            renderTarget = null;
        }
        if (this._state.renderTarget === renderTarget) {
            return;
        }
        this._logger.log('set_render_target({0})', renderTarget ? renderTarget.id() : null);
        this.bindFramebuffer(renderTarget ? renderTarget as unknown as GLHandleWrapper<WebGLFramebuffer> : null);
        this._updateViewport((renderTarget || this._defaultRenderTarget).size());
        this._state.renderTarget = renderTarget;
    }

    bindRenderbuffer(renderbuffer: GLHandleWrapper<WebGLRenderbuffer> | null): void {
        const handle = unwrapGLHandle(renderbuffer);
        if (this._state.renderbuffer === handle) {
            return;
        }
        this._logger.log('bind_renderbuffer({0})', renderbuffer ? renderbuffer.id() : null);
        this._gl.bindRenderbuffer(GL_RENDERBUFFER, handle);
        this._state.renderbuffer = handle;
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

// Initial state is formed according to specification.
// These values could be queried with `gl.getParameter` but that would unnecessarily increase in startup time.
function getDefaultState(): State {
    return {
        viewportSize: ZERO2,
        clearColor: color(0, 0, 0, 0),
        clearDepth: 1,
        clearStencil: 0,
        depthTest: false,
        depthMask: true,
        depthFunc: 'less',
        stencilTest: false,
        stencilMask: 0x7FFFFFFF,
        stencilFunc: { func: 'always', ref: 0, mask: 0x7FFFFFFF },
        stencilOp: { fail: 'keep', zfail: 'keep', zpass: 'keep' },
        culling: false,
        cullFace: 'back',
        blending: false,
        blendFunc: 'one|zero',
        currentProgram: null,
        vertexArrayObject: null,
        arrayBuffer: null,
        elementArrayBuffers: {
            [null as unknown as number]: null,
        },
        textureUnit: 0,
        boundTextures: {},
        boundCubeTextures: {},
        pixelStoreUnpackFlipYWebgl: false,
        pixelStoreUnpackPremultiplyAlphaWebgl: false,
        framebuffer: null,
        renderTarget: null,
        renderbuffer: null,
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

class DefaultRenderTarget extends BaseWrapper implements RenderTarget {
    private readonly _runtime: Runtime;

    constructor(runtime: Runtime, tag?: string) {
        super(tag);
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

function compareStencilFunc(lhs: StencilFuncState, rhs: StencilFuncState): boolean {
    return lhs.func === rhs.func && lhs.mask === rhs.mask && lhs.ref === rhs.ref;
}

function compareStencilOp(lhs: StencilOpState, rhs: StencilOpState): boolean {
    return lhs.fail === rhs.fail && lhs.zfail === rhs.zfail && lhs.zpass === rhs.zpass;
}
