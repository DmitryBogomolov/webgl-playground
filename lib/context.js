import { constants } from './constants';
import { Program } from './program';
import { VertexBuffer, IndexBuffer } from './buffer';
import { VertexArrayObject } from './vertex-array-object';
import { Texture } from './texture';
import { BLACK } from './color';
import { generateId, Logger, raiseError } from './utils';

const {
    TRIANGLES,
    UNSIGNED_SHORT,
    COLOR_BUFFER_BIT,
} = constants;

function createCanvas(/** @type {HTMLElement} */container) {
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

export class Context {
    constructor(/** @type {HTMLElement} */container) {
        this._logger = new Logger(generateId('Context'));
        this._container = container;
        this._handleContextLost = () => {
            this._logger.error('context lost');
        };
        this._handleContextRestored = () => {
            this._logger.log('context restored');
        };
        this._init();
    }

    _init() {
        this._logger.log('init');
        this._canvas = createCanvas(this._container);
            
        this._handle = this._canvas.getContext('webgl');
        if (!this._handle) {
            raiseError(this._logger, 'webgl context is not created');
        }
        this._vaoExt = this._handle.getExtension('OES_vertex_array_object');
        if (!this._vaoExt) {
            raiseError(this._logger, 'no OES_vertex_array_object extension');
        }
        this._canvas.addEventListener('webglcontextlost', this._handleContextLost);
        this._canvas.addEventListener('webglcontextrestored', this._handleContextRestored);

        this.setViewport(0, 0, this._canvas.width, this._canvas.height);
        this.setClearColor(BLACK);
    }

    dispose() {
        this._logger.log('dispose');
        this._canvas.removeEventListener('webglcontextlost', this._handleContextLost);
        this._canvas.removeEventListener('webglcontextrestored', this._handleContextRestored);
        this._canvas.remove();
    }

    handle() {
        return this._handle;
    }

    vaoExt() {
        return this._vaoExt;
    }

    canvas() {
        return this._canvas;
    }

    logCall(/** @type {string} */funcName, /** @type {string} */param) {
        this._logger.log(`${funcName}(${param})`);
    }

    setViewport(
        /** @type {number} */x, /** @type {number} */y, /** @type {number} */width, /** @type {number} */height,
    ) {
        this.logCall('set_viewport', `${x} ${y} ${width} ${height}`);
        this._handle.viewport(x, y, width, height);
    }

    setClearColor(/** @type {import('./color').Color} */color) {
        this.logCall('set_clear_color', `${color.r} ${color.g} ${color.b} ${color.a}`);
        this._handle.clearColor(color.r, color.g, color.b, color.a);
    }

    clearColor() {
        this._handle.clear(COLOR_BUFFER_BIT);
    }

    drawElements(/** @type {number} */indexCount) {
        this._handle.drawElements(TRIANGLES, indexCount, UNSIGNED_SHORT, 0);
    }
}

[
    VertexBuffer,
    IndexBuffer,
    VertexArrayObject,
    Texture,
    Program,
].forEach((component) => {
    Object.keys(component.contextMethods).forEach((name) => {
        const method = component.contextMethods[name];
        Context.prototype[name] = function (...args) {
            return method(this, ...args);
        };
    });
});
