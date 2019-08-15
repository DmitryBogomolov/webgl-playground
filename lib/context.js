import { generateId, log, error } from './utils';
import { constants } from './constants';
import { Program } from './program';
import { ArrayBuffer, ElementArrayBuffer } from './buffer';
import { VertexArrayObject } from './vao';
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
        this._state = {};
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

        this.setViewport(0, 0, this._canvas.width, this._canvas.height);
        this.setClearColor(BLACK);
    }

    dispose() {
        log(this._id, 'dispose');
        this._canvas.remove();
    }

    getState(key) {
        return this._state[key] || null;
    }

    setState(key, value) {
        this._state[key] = value;
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
    
    createProgram(vertexShaderSource, fragmentShaderSource) {
        return new Program(this, vertexShaderSource, fragmentShaderSource);
    }

    createArrayBuffer() {
        return new ArrayBuffer(this);
    }

    createElementArrayBuffer() {
        return new ElementArrayBuffer(this);
    }

    createVAO() {
        return new VertexArrayObject(this);
    }
}
