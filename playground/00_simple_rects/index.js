import vertShaderSource from './simple.vert';
import fragShaderSource from './simple.frag';

const {
    VERTEX_SHADER, FRAGMENT_SHADER,
    COMPILE_STATUS, LINK_STATUS,
    ARRAY_BUFFER, STATIC_DRAW,
    COLOR_BUFFER_BIT,
    FLOAT,
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
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, LINK_STATUS)) {
        gl.deleteShader(vertShader);
        gl.deleteShader(fragShader);
        const err = gl.getProgramInfoLog(program);
        console.error(err);
        gl.deleteProgram(program);
        throw new Error(err);
    }

    // TODO: Inspect sources for names.
    // TODO: Use `bindAttribLocation`.
    const attributes = {
        a_position: gl.getAttribLocation(program, 'a_position'),
    };
    const uniforms = {};

    return { program, attributes, uniforms };
}

// TODO: Add index buffer.
// TODO: Use VertexAttributeArray.
function createBuffer(gl) {
    const vertices = [
        [-1,  0],
        [-1, -1],
        [ 0, -1],

        [ 0, -1],
        [ 1, -1],
        [ 1,  0],

        [ 1,  0],
        [ 1,  1],
        [ 0,  1],

        [ 0,  1],
        [-1,  1],
        [-1,  0],
    ];
    const data = new ArrayBuffer(vertices.length * vertices[0].length * 4);
    const dv = new DataView(data);
    let offset = 0;
    vertices.forEach((vertex) => {
        dv.setFloat32(offset, vertex[0], true);
        offset += 4;
        dv.setFloat32(offset, vertex[1], true);
        offset += 4;
    });

    const buffer = gl.createBuffer();
    gl.bindBuffer(ARRAY_BUFFER, buffer);
    gl.bufferData(ARRAY_BUFFER, data, STATIC_DRAW);
    return {
        buffer,
        vertexCount: vertices.length,
        vertexSize: vertices[0].length,
    };
}

function init() {
    const container = document.querySelector('.container');
    const { gl, size } = createContext(container);

    const vertShader = createShader(gl, VERTEX_SHADER, vertShaderSource);
    const fragShader = createShader(gl, FRAGMENT_SHADER, fragShaderSource);
    const program = createProgram(gl, vertShader, fragShader);

    const buffer = createBuffer(gl);

    gl.viewport(0, 0, size[0], size[1]);
    gl.clearColor(0, 0, 0, 1);

    return {
        gl,
        program,
        buffer,
    };
}

function render({ gl, program, buffer }) {
    gl.clear(COLOR_BUFFER_BIT);
    gl.useProgram(program.program);
    gl.bindBuffer(ARRAY_BUFFER, buffer.buffer);
    gl.enableVertexAttribArray(program.attributes.a_position);
    gl.vertexAttribPointer(program.attributes.a_position, buffer.vertexSize, FLOAT, false, 0, 0);
    gl.drawArrays(TRIANGLES, 0, buffer.vertexCount);
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
