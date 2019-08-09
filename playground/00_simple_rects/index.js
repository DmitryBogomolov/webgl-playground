import vertShaderSource from './simple.vert';
import fragShaderSource from './simple.frag';

const {
    VERTEX_SHADER, FRAGMENT_SHADER,
    COMPILE_STATUS, LINK_STATUS,
    ARRAY_BUFFER, ELEMENT_ARRAY_BUFFER,
    STATIC_DRAW,
    COLOR_BUFFER_BIT,
    UNSIGNED_BYTE, UNSIGNED_SHORT, FLOAT,
    TRIANGLES,
} = WebGLRenderingContext.prototype;

function createContext(container) {
    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    container.appendChild(canvas);

    const width = Math.floor(devicePixelRatio * canvas.clientWidth);
    const height = Math.floor(devicePixelRatio * canvas.clientHeight);
    canvas.width = width;
    canvas.height = height;

    const gl = canvas.getContext('webgl');
    if (!gl) {
        const err = 'Context is not created';
        console.error(err);
        throw new Error(err);
    }
    if (!gl.getExtension('OES_vertex_array_object')) {
        const err = 'No OES_vertex_array_object extension';
        console.error(err);
        throw new Error(err);
    }

    // TODO: Get extensions here.
    return { gl, size: [width, height] };
}

function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, COMPILE_STATUS)) {
        const err = gl.getShaderInfoLog(shader);
        console.error(err);
        gl.deleteShader(shader);
        throw new Error(err);
    }
    return shader;
}

function createProgram(gl, vertShader, fragShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);

    // TODO: Inspect sources for names.
    const attributes = {
        a_position: 0,
        a_color: 1,
    };
    const uniforms = {};
    Object.keys(attributes).forEach((name) => {
        gl.bindAttribLocation(program, attributes[name], name);
    })
    
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, LINK_STATUS)) {
        gl.deleteShader(vertShader);
        gl.deleteShader(fragShader);
        const err = gl.getProgramInfoLog(program);
        console.error(err);
        gl.deleteProgram(program);
        throw new Error(err);
    }

    return { program, attributes, uniforms };
}

function createBuffer(gl, program, vaoExt) {
    const vertices = [
        { position: [-1,  0], color: [1, 0, 0], },
        { position: [-1, -1], color: [1, 0, 0], },
        { position: [ 0, -1], color: [1, 0, 0], },

        { position: [ 0, -1], color: [1, 1, 0], },
        { position: [ 1, -1], color: [1, 1, 0], },
        { position: [ 1,  0], color: [1, 1, 0], },

        { position: [ 1,  0], color: [0, 1, 0], },
        { position: [ 1,  1], color: [0, 1, 0], },
        { position: [ 0,  1], color: [0, 1, 0], },

        { position: [ 0,  1], color: [0, 1, 1], },
        { position: [-1,  1], color: [0, 1, 1], },
        { position: [-1,  0], color: [0, 1, 1], },
    ];
    const indexes = [
        0, 1, 2,
        3, 4, 5,
        6, 7, 8,
        9, 10, 11,
    ];
    const vertexSize = (2 + 1) * 4;
    const data = new ArrayBuffer(vertices.length * vertexSize);
    const dv = new DataView(data);
    let offset = 0;
    vertices.forEach((vertex) => {
        dv.setFloat32(offset, vertex.position[0], true);
        offset += 4;
        dv.setFloat32(offset, vertex.position[1], true);
        offset += 4;
        dv.setUint8(offset, Math.round(vertex.color[0] * 255));
        offset++;
        dv.setUint8(offset, Math.round(vertex.color[1] * 255));
        offset++;
        dv.setUint8(offset, Math.round(vertex.color[2] * 255));
        offset++;
        dv.setUint8(offset, 0);
        offset++;
    });

    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(ARRAY_BUFFER, data, STATIC_DRAW);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(ELEMENT_ARRAY_BUFFER, new Uint16Array(indexes), STATIC_DRAW);

    const vao = vaoExt.createVertexArrayOES();
    vaoExt.bindVertexArrayOES(vao);
    gl.bindBuffer(ARRAY_BUFFER, vertexBuffer);
    gl.vertexAttribPointer(program.attributes.a_position, 2, FLOAT, false, vertexSize, 0);
    gl.enableVertexAttribArray(program.attributes.a_position);
    gl.vertexAttribPointer(program.attributes.a_color, 3, UNSIGNED_BYTE, true, vertexSize, 8);
    gl.enableVertexAttribArray(program.attributes.a_color);
    gl.bindBuffer(ELEMENT_ARRAY_BUFFER, indexBuffer);
    vaoExt.bindVertexArrayOES(null);

    return {
        vao,
        vertexBuffer,
        indexBuffer,
        vertexCount: vertices.length,
        vertexSize,
        indexCount: vertices.length,
    };
}

function init() {
    const container = document.querySelector('.container');
    const { gl, size } = createContext(container);
    const vaoExt = gl.getExtension('OES_vertex_array_object');

    const vertShader = createShader(gl, VERTEX_SHADER, vertShaderSource);
    const fragShader = createShader(gl, FRAGMENT_SHADER, fragShaderSource);
    const program = createProgram(gl, vertShader, fragShader);

    const buffer = createBuffer(gl, program, vaoExt);

    gl.viewport(0, 0, size[0], size[1]);
    gl.clearColor(0, 0, 0, 1);

    return {
        gl,
        vaoExt,
        program,
        buffer,
    };
}

function render({ gl, vaoExt, program, buffer }) {
    gl.clear(COLOR_BUFFER_BIT);
    gl.useProgram(program.program);
    vaoExt.bindVertexArrayOES(buffer.vao);
    gl.drawElements(TRIANGLES, buffer.indexCount, UNSIGNED_SHORT, 0);
    vaoExt.bindVertexArrayOES(null);
}

function runLoop(state) {
    function doLoop() {
        render(state);
        requestAnimationFrame(doLoop);
    }
    doLoop();
}

const state = init();
runLoop(state);
