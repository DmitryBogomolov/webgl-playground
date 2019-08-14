import { log, panic } from './log';
import { constants } from './constants';
import { Program } from './program';
import { Buffer } from './buffer';
import { VertexArrayObject } from './vao';
import { BLACK } from './color';

const {
    ARRAY_BUFFER, ELEMENT_ARRAY_BUFFER, 
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
        this._container = container;
        this._init();    
    }

    _init() {
        this._canvas = createCanvas(this._container);
            
        this._handle = this._canvas.getContext('webgl');
        if (!this._handle) {
            panic('context: not created');
        }
        this._vaoExt = this._handle.getExtension('OES_vertex_array_object');
        if (!this._vaoExt) {
            panic('context: no OES_vertex_array_object extension');
        }

        log('context: init');
        this.setViewport(0, 0, this._canvas.width, this._canvas.height);
        this.setClearColor(BLACK);
    }

    dispose() {
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

    setViewport(x, y, width, height) {
        this._handle.viewport(x, y, width, height);
    }

    setClearColor(color) {
        this._handle.clearColor(color.r, color.g, color.b, color.a);
    }

    clearColor() {
        this._handle.clear(COLOR_BUFFER_BIT);
    }

    createProgram(vertexShaderSource, fragmentShaderSource) {
        return new Program(this, vertexShaderSource, fragmentShaderSource);
    }

    createBuffer() {
        return new Buffer(this, ARRAY_BUFFER);
    }

    createIndexBuffer() {
        return new Buffer(this, ELEMENT_ARRAY_BUFFER);
    }

    createVAO() {
        return new VertexArrayObject(this);
    }

    drawElements(indexCount) {
        this._handle.drawElements(TRIANGLES, indexCount, UNSIGNED_SHORT, 0);
    }
}
