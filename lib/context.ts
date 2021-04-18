import { ContextView } from './context-view';
import { contextConstants } from './context-constants';
import { Program } from './program';
import { VertexBuffer, IndexBuffer } from './buffer';
import { VertexArrayObject } from './vertex-array-object';
import { Texture } from './texture';
import { BLACK } from './color';
import { generateId, Logger, raiseError } from './utils';
import { Color } from './color';

const {
    TRIANGLES,
    UNSIGNED_SHORT,
    COLOR_BUFFER_BIT,
} = contextConstants;

function createCanvas(container: HTMLElement): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    container.appendChild(canvas);

    const width = Math.floor(devicePixelRatio * canvas.clientWidth);
    const height = Math.floor(devicePixelRatio * canvas.clientHeight);
    canvas.width = width;
    canvas.height = height;

    return canvas;
}

export class Context implements ContextView {
    private readonly _logger: Logger;
    private readonly _container: HTMLElement;
    private readonly _canvas: HTMLCanvasElement;
    private readonly _handle: WebGLRenderingContext;
    private readonly _vaoExt: OES_vertex_array_object;

    constructor(container: HTMLElement) {
        this._logger = new Logger(generateId('Context'));
        this._container = container;
        this._logger.log('init');
        this._canvas = createCanvas(this._container);
        const handle = this._canvas.getContext('webgl');
        if (!handle) {
            throw raiseError(this._logger, 'webgl context is not created');
        }
        this._handle = handle;
        const vaoExt = this._handle.getExtension('OES_vertex_array_object');
        if (!vaoExt) {
            throw raiseError(this._logger, 'no OES_vertex_array_object extension');
        }
        this._vaoExt = vaoExt;
        this._canvas.addEventListener('webglcontextlost', this._handleContextLost);
        this._canvas.addEventListener('webglcontextrestored', this._handleContextRestored);

        this.setViewport(0, 0, this._canvas.width, this._canvas.height);
        this.setClearColor(BLACK);    
    }

    private readonly _handleContextLost: EventListener = () => {
        this._logger.error('context is lost');
    };

    private readonly _handleContextRestored: EventListener = () => {
        this._logger.log('context is restored');
    };

    dispose(): void {
        this._logger.log('dispose');
        this._canvas.removeEventListener('webglcontextlost', this._handleContextLost);
        this._canvas.removeEventListener('webglcontextrestored', this._handleContextRestored);
        this._canvas.remove();
    }

    handle(): WebGLRenderingContext {
        return this._handle;
    }

    vaoExt(): OES_vertex_array_object {
        return this._vaoExt;
    }

    canvas(): HTMLCanvasElement {
        return this._canvas;
    }

    logCall(funcName: string, param: any): void {
        this._logger.log(`${funcName}(${param})`);
    }

    setViewport(x: number, y: number, width: number, height: number): void {
        this.logCall('set_viewport', `${x} ${y} ${width} ${height}`);
        this._handle.viewport(x, y, width, height);
    }

    setClearColor(color: Color): void {
        this.logCall('set_clear_color', `${color.r} ${color.g} ${color.b} ${color.a}`);
        this._handle.clearColor(color.r, color.g, color.b, color.a);
    }

    clearColor(): void {
        this._handle.clear(COLOR_BUFFER_BIT);
    }

    drawElements(indexCount: number): void {
        this._handle.drawElements(TRIANGLES, indexCount, UNSIGNED_SHORT, 0);
    }

    createVertexBuffer(): VertexBuffer {
        return VertexBuffer.contextMethods.createVertexBuffer(this);
    }

    bindVertexBuffer(target: VertexBuffer | null): void {
        VertexBuffer.contextMethods.bindVertexBuffer(this, target);
    }

    createIndexBuffer(): IndexBuffer {
        return IndexBuffer.contextMethods.createIndexBuffer(this);
    }
    
    bindIndexBuffer(target: IndexBuffer | null) {
        IndexBuffer.contextMethods.bindIndexBuffer(this, target);
    }

    createVertexArrayObject(): VertexArrayObject {
        return VertexArrayObject.contextMethods.createVertexArrayObject(this);
    }
    
    bindVertexArrayObject(target: VertexArrayObject | null): void {
        VertexArrayObject.contextMethods.bindVertexArrayObject(this, target);
    }

    createTexture() {
        return Texture.contextMethods.createTexture(this);
    }

    bindTexture(target: Texture | null) {
        Texture.contextMethods.bindTexture(this, target);
    }

    activeTexture(unit: number) {
        Texture.contextMethods.activeTexture(this, unit);
    }

    setTextureParameters(params: Record<string, string>) {
        Texture.contextMethods.setTextureParameters(this, params);
    }

    setTextureImage(width: number, height: number, data: ArrayBufferView): void {
        Texture.contextMethods.setTextureImage(this, width, height, data);
    }

    setUnpackFlipY(value: number | boolean) {
        Texture.contextMethods.setUnpackFlipY(this, value);
    }

    createProgram() {
        return Program.contextMethods.createProgram(this);
    }

    useProgram(target: Program | null) {
        Program.contextMethods.useProgram(this, target);
    }
}
