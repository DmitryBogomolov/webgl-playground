import type { Vec2 } from 'lib';
import type { Observable } from 'playground-utils/observable';
import {
    Runtime,
    Primitive,
    Program,
    Texture,
    Tracker,
    vec2, ZERO2, sub2, mul2, inv2,
    parseVertexSchema,
} from 'lib';
import { observable } from 'playground-utils/observable';
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

const TEXTURE_SIZE = 256;
const OFFSET = 32;

main();

interface Rect {
    readonly xMin: number;
    readonly xMax: number;
    readonly yMin: number;
    readonly yMax: number;
}

interface Controls {
    readonly uNearest: HTMLElement;
    readonly vNearest: HTMLElement;
    readonly uLinear: HTMLElement;
    readonly vLinear: HTMLElement;
    readonly crossNearest: HTMLElement;
    readonly crossLinear: HTMLElement;
}

function main(): void {
    const container = document.querySelector<HTMLElement>(PLAYGROUND_ROOT)!;
    const runtime = new Runtime({ element: container });
    const primitive = makePrimitive(runtime);
    const texture = makeTexture(runtime);
    const texcoord = observable(vec2(0.5 / TEXTURE_SIZE, 0.5 / TEXTURE_SIZE));
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

    const controls: Controls = {
        uNearest: document.querySelector('#u-nearest') as HTMLElement,
        vNearest: document.querySelector('#v-nearest') as HTMLElement,
        uLinear: document.querySelector('#u-linear') as HTMLElement,
        vLinear: document.querySelector('#v-linear') as HTMLElement,
        crossNearest: document.querySelector('#cross-nearest') as HTMLElement,
        crossLinear: document.querySelector('#cross-linear') as HTMLElement,
    };

    function processPointerPosition(position: Vec2): void {
        const point = sub2(position, mul2(runtime.canvasSize(), 0.5));
        if (inRect(point, nearestRegion)) {
            texcoord(point2texcoord(point, nearestRegion));
        }
        if (inRect(point, linearRegion)) {
            texcoord(point2texcoord(point, linearRegion));
        }
    }

    const tracker = new Tracker(container);
    tracker.event('start').on((e) => {
        processPointerPosition(e.coords);
    });
    tracker.event('move').on((e) => {
        processPointerPosition(e.coords);
    });

    function doLayout(): void {
        layoutElements(container, controls, texcoord, nearestRegion, linearRegion);
    }

    texcoord.on(() => runtime.requestFrameRender());
    texcoord.on(doLayout);

    runtime.frameRequested().on(() => {
        runtime.clearBuffer();

        const ratio = mul2(inv2(runtime.canvasSize()), 2);

        const size = mul2(ratio, TEXTURE_SIZE / 2);
        const offset = mul2(ratio, OFFSET + TEXTURE_SIZE / 2);

        drawRect(runtime, primitive, texture, size, vec2(-offset.x, +offset.y), 'nearest', null);
        drawRect(runtime, primitive, texture, size, vec2(-offset.x, -offset.y), 'linear', null);
        drawRect(runtime, primitive, texture, size, vec2(+offset.x, +offset.y), 'nearest', texcoord());
        drawRect(runtime, primitive, texture, size, vec2(+offset.x, -offset.y), 'linear', texcoord());
    });

    doLayout();
}

function makeTexture(runtime: Runtime): Texture {
    const texture = new Texture({ runtime });
    texture.setImageData(makeTextureData(), { unpackFlipY: true });
    return texture;
}

function makePrimitive(runtime: Runtime): Primitive {
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

    const primitive = new Primitive({ runtime });

    primitive.setup({
        vertexData,
        indexData,
        vertexSchema: parseVertexSchema({
            attributes: [{ type: 'float2' }],
        }),
    });

    const program = new Program({
        runtime,
        vertShader,
        fragShader,
    });
    primitive.setProgram(program);

    return primitive;
}

function moveElement(label: HTMLElement, x: number, y: number): void {
    label.style.left = `${x}px`;
    label.style.top = `${y}px`;
}

function layoutElements(
    container: HTMLElement, controls: Controls,
    texcoord: Observable<Vec2>, nearestRegion: Rect, linearRegion: Rect,
): void {
    const boundingRect = container.getBoundingClientRect();
    const cx = (boundingRect.left + boundingRect.right) / 2;
    const cy = (boundingRect.top + boundingRect.bottom) / 2;
    const tex = texcoord();
    const dx = tex.x * TEXTURE_SIZE;
    const dy = (1 - tex.y) * TEXTURE_SIZE;
    const uText = tex.x.toFixed(2);
    const vText = tex.y.toFixed(2);

    moveElement(controls.uNearest, cx + nearestRegion.xMin + dx, cy + nearestRegion.yMax);
    controls.uNearest.textContent = uText;

    moveElement(controls.vNearest, cx + nearestRegion.xMin, cy + nearestRegion.yMin + dy);
    controls.vNearest.textContent = vText;

    moveElement(controls.uLinear, cx + linearRegion.xMin + dx, cy + linearRegion.yMin);
    controls.uLinear.textContent = uText;

    moveElement(controls.vLinear, cx + linearRegion.xMin, cy + linearRegion.yMin + dy);
    controls.vLinear.textContent = vText;

    moveElement(controls.crossNearest, cx + nearestRegion.xMin + dx, cy + nearestRegion.yMin + dy);
    moveElement(controls.crossLinear, cx + linearRegion.xMin + dx, cy + linearRegion.yMin + dy);
}

function drawRect(
    runtime: Runtime, primitive: Primitive, texture: Texture,
    size: Vec2, offset: Vec2, filter: 'nearest' | 'linear', texcoord: Vec2 | null,
): void {
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

function inRect(point: Vec2, rect: Rect): boolean {
    return rect.xMin <= point.x && point.x <= rect.xMax && rect.yMin <= point.y && point.y <= rect.yMax;
}

function point2texcoord(point: Vec2, rect: Rect): Vec2 {
    return vec2(
        (point.x - rect.xMin) / (rect.xMax - rect.xMin),
        (point.y - rect.yMax) / (rect.yMin - rect.yMax),
    );
}
