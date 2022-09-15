import {
    Runtime,
    Primitive,
    Program,
    Texture,
    parseVertexSchema,
    Tracker,
    Vec2, vec2, ZERO2, sub2, mul2, inv2,
} from 'lib';
import { observable } from 'util/observable';
import { makeTextureData } from './image';
import vertShader from './shaders/shader.vert';
import fragShader from './shaders/shader.frag';

/**
 * Four rectangles.
 *
 * Left rectangles are colored with texture.
 * Top one with *nearest* filter, bottom one with *linear*.
 *
 * Right rectangles are colored with a colored samples from texture.
 * Top one with *nearest* filter, bottom one with *linear*.
 * Texture coordinates are taken from input canvas.
 *
 * Texture is custom 4x4 image.
 * First two rows have colors from black to white.
 * Last two rows have same colors in reverse order.
 */
export type DESCRIPTION = never;

const container = document.querySelector<HTMLElement>(PLAYGROUND_ROOT)!;

function makePrimitive(runtime: Runtime): Primitive {
    const schema = parseVertexSchema([
        {
            name: 'a_position',
            type: 'float2',
        },
    ]);

    const vertexData = new Float32Array([
        -1, -1,
        +1, -1,
        +1, +1,
        -1, +1,
    ]);
    const indexData = new Uint16Array([
        0, 1, 2,
        2, 3, 0,
    ]);

    const primitive = new Primitive(runtime);

    primitive.allocateVertexBuffer(vertexData.byteLength);
    primitive.updateVertexData(vertexData);
    primitive.allocateIndexBuffer(indexData.byteLength);
    primitive.updateIndexData(indexData);
    primitive.setVertexSchema(schema);
    primitive.setIndexData({ indexCount: indexData.length });

    const program = new Program(runtime, {
        vertShader,
        fragShader,
        schema,
    });
    primitive.setProgram(program);

    return primitive;
}

function makeTexture(runtime: Runtime): Texture {
    const texture = new Texture(runtime);
    texture.setParameters({
        wrap_s: 'clamp_to_edge',
        wrap_t: 'clamp_to_edge',
    });
    texture.setImageData(makeTextureData(), { unpackFlipY: true });
    return texture;
}

const runtime = new Runtime(container);

const primitive = makePrimitive(runtime);
const texture = makeTexture(runtime);

const TEXTURE_SIZE = 256;
const OFFSET = 32;
const texcoord = observable(vec2(0.5 / TEXTURE_SIZE, 0.5 / TEXTURE_SIZE));

interface Rect {
    readonly xMin: number;
    readonly xMax: number;
    readonly yMin: number;
    readonly yMax: number;
}

const nearestRegion: Rect = {
    xMin: -OFFSET - TEXTURE_SIZE,
    xMax: -OFFSET,
    yMin: -OFFSET - TEXTURE_SIZE,
    yMax: -OFFSET,
};
const linearRegion: Rect = {
    xMin: -OFFSET - TEXTURE_SIZE,
    xMax: -OFFSET,
    yMin: +OFFSET,
    yMax: +OFFSET + TEXTURE_SIZE,
};

function inRect(point: Vec2, rect: Rect): boolean {
    return rect.xMin <= point.x && point.x <= rect.xMax && rect.yMin <= point.y && point.y <= rect.yMax;
}

function point2texcoord(point: Vec2, rect: Rect): Vec2 {
    return vec2(
        (point.x - rect.xMin) / (rect.xMax - rect.xMin),
        (point.y - rect.yMax) / (rect.yMin - rect.yMax),
    );
}

function processPointerPosition(position: Vec2): void {
    const point = sub2(position, mul2(runtime.canvasSize(), 0.5));
    if (inRect(point, nearestRegion)) {
        texcoord(point2texcoord(point, nearestRegion));
    }
    if (inRect(point, linearRegion)) {
        texcoord(point2texcoord(point, linearRegion));
    }
}

const uNearest = document.querySelector('#u-nearest') as HTMLElement;
const vNearest = document.querySelector('#v-nearest') as HTMLElement;
const uLinear = document.querySelector('#u-linear') as HTMLElement;
const vLinear = document.querySelector('#v-linear') as HTMLElement;
const crossNearest = document.querySelector('#cross-nearest') as HTMLElement;
const crossLinear = document.querySelector('#cross-linear') as HTMLElement;

function moveElement(label: HTMLElement, x: number, y: number): void {
    label.style.left = `${x}px`;
    label.style.top = `${y}px`;
}

function layoutElements(): void {
    const boundingRect = container.getBoundingClientRect();
    const cx = (boundingRect.left + boundingRect.right) / 2;
    const cy = (boundingRect.top + boundingRect.bottom) / 2;
    const tex = texcoord();
    const dx = tex.x * TEXTURE_SIZE;
    const dy = (1 - tex.y) * TEXTURE_SIZE;
    const uText = tex.x.toFixed(2);
    const vText = tex.y.toFixed(2);

    moveElement(uNearest, cx + nearestRegion.xMin + dx, cy + nearestRegion.yMax);
    uNearest.textContent = uText;

    moveElement(vNearest, cx + nearestRegion.xMin, cy + nearestRegion.yMin + dy);
    vNearest.textContent = vText;

    moveElement(uLinear, cx + linearRegion.xMin + dx, cy + linearRegion.yMin);
    uLinear.textContent = uText;

    moveElement(vLinear, cx + linearRegion.xMin, cy + linearRegion.yMin + dy);
    vLinear.textContent = vText;

    moveElement(crossNearest, cx + nearestRegion.xMin + dx, cy + nearestRegion.yMin + dy);
    moveElement(crossLinear, cx + linearRegion.xMin + dx, cy + linearRegion.yMin + dy);
}

layoutElements();

new Tracker(container, {
    onStart(e) {
        processPointerPosition(e.coords);
    },
    onMove(e) {
        processPointerPosition(e.coords);
    },
});

texcoord.on(() => runtime.requestFrameRender());
texcoord.on(layoutElements);

runtime.frameRendered().on(() => {
    runtime.clearBuffer();

    const ratio = mul2(inv2(runtime.canvasSize()), 2);

    const size = mul2(ratio, TEXTURE_SIZE / 2);
    const offset = mul2(ratio, OFFSET + TEXTURE_SIZE / 2);

    drawRect(size, vec2(-offset.x, +offset.y), 'nearest', null);
    drawRect(size, vec2(-offset.x, -offset.y), 'linear', null);
    drawRect(size, vec2(+offset.x, +offset.y), 'nearest', texcoord());
    drawRect(size, vec2(+offset.x, -offset.y), 'linear', texcoord());
});

function drawRect(size: Vec2, offset: Vec2, filter: 'nearest' | 'linear', texcoord: Vec2 | null): void {
    texture.setParameters({
        min_filter: filter,
        mag_filter: filter,
    });
    runtime.setTextureUnit(2, texture);
    const program = primitive.program();
    program.setUniform('u_size', size);
    program.setUniform('u_offset', offset);
    program.setUniform('u_texture', 2);
    program.setUniform('u_use_custom', !!texcoord);
    program.setUniform('u_texcoord', texcoord || ZERO2);
    primitive.render();
}
