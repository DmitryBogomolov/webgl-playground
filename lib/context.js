import { generateId, log, error } from './utils';
import { constants } from './constants';
import { Program, useProgram } from './program';
import { 
    ArrayBuf, ElementArrayBuf,
    bindArrayBuffer, bindElementArrayBuffer,
} from './buffer';
import { VertexArrayObject, bindVertexArrayObject } from './vertex-array-object';
import { BLACK } from './color';

const {
    TRIANGLES,
    UNSIGNED_SHORT,
    COLOR_BUFFER_BIT,
} = constants;

function createCanvas(container) {
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
    constructor(container) {
        this._id = generateId('Context');
        this._container = container;
        this._handleContextLost = () => {
            error(this._id, 'context lost');
        };
        this._handleContextRestored = () => {
            log(this._id, 'context restored');
        };
        this._init();
    }

    _init() {
        log(this._id, 'init');
        this._canvas = createCanvas(this._container);
            
        this._handle = this._canvas.getContext('webgl');
        if (!this._handle) {
            error(this._id, new Error('not created'));
        }
        this._vaoExt = this._handle.getExtension('OES_vertex_array_object');
        if (!this._vaoExt) {
            error(this._id, new Error('no OES_vertex_array_object extension'));
        }
        this._canvas.addEventListener('webglcontextlost', this._handleContextLost);
        this._canvas.addEventListener('webglcontextrestored', this._handleContextRestored);

        this.setViewport(0, 0, this._canvas.width, this._canvas.height);
        this.setClearColor(BLACK);
    }

    dispose() {
        log(this._id, 'dispose');
        this._canvas.removeEventListener('webglcontextlost', this._handleContextLost);
        this._canvas.removeEventListener('webglcontextrestored', this._handleContextRestored);
        this._canvas.remove();
    }

    id() {
        return this._id;
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

    setViewport(x, y, width, height) {
        log(this._id, `set_viewport(${x} ${y} ${width} ${height})`);
        this._handle.viewport(x, y, width, height);
    }

    setClearColor(color) {
        log(this._id, `set_clear_color(${color.r} ${color.g} ${color.b} ${color.a})`);
        this._handle.clearColor(color.r, color.g, color.b, color.a);
    }

    clearColor() {
        this._handle.clear(COLOR_BUFFER_BIT);
    }

    drawElements(indexCount) {
        this._handle.drawElements(TRIANGLES, indexCount, UNSIGNED_SHORT, 0);
    }
}

[
    ['Program', Program],
    ['ArrayBuffer', ArrayBuf],
    ['ElementArrayBuffer', ElementArrayBuf],
    ['VertexArrayObject', VertexArrayObject],
].forEach(([name, cls]) => {
    Context.prototype['create' + name] = function (params) {
        return new cls(this, params);
    };
});

[
    ['bindArrayBuffer', bindArrayBuffer],
    ['bindElementArrayBuffer', bindElementArrayBuffer],
    ['bindVertexArrayObject', bindVertexArrayObject],
    ['useProgram', useProgram],
].forEach(([name, func]) => {
    Context.prototype[name] = function (target) {
        return func(this, target);
    };
});
