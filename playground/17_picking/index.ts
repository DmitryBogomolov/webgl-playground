import {
    Runtime,
    Program,
    Framebuffer,
    Camera,
    Tracker,
    Vec2, vec2,
    vec3,
    vec4,
    color,
    logSilenced,
} from 'lib';
import { makeObjectsFactory, SceneItem } from './primitive';

/**
 * Picking.
 *
 * TODO...
 */
export type DESCRIPTION = never;

main();

function main(): void {
    const container = document.querySelector<HTMLElement>(PLAYGROUND_ROOT)!;
    const runtime = new Runtime(container);
    runtime.setDepthTest(true);
    const framebuffer = new Framebuffer(runtime);
    framebuffer.setup('color|depth', vec2(1024, 512));
    // framebuffer.setup('color|depth', runtime.canvasSize());
    const camera = new Camera();
    camera.setEyePos(vec3(0, 3, 10));
    const { objects, program, idProgram } = makeObjects(runtime);

    let activePoint = vec2(0, 0);
    new Tracker(container, {
        onMove(e) {
            const canvasSize = runtime.canvasSize();
            // Flip Y coordinate.
            const coords = vec2(e.coords.x, canvasSize.y - e.coords.y);
            activePoint = mapPixelCoodinates(coords, canvasSize, framebuffer.size());
            runtime.requestFrameRender();
        },
    });

    const canvas = document.createElement('canvas');
    canvas.style.border = 'solid 1px black';
    canvas.width = framebuffer.size().x;
    canvas.height = framebuffer.size().y;
    container.parentElement!.appendChild(canvas);
    const ctx = canvas.getContext('2d')!;

    runtime.sizeChanged().on(() => {
        camera.setViewportSize(runtime.canvasSize());
    });
    runtime.frameRendered().on(() => {
        renderFrame(runtime, framebuffer, camera, program, idProgram, objects, activePoint, ctx);
    });

    logSilenced(true);
}

function renderFrame(
    runtime: Runtime, framebuffer: Framebuffer, camera: Camera,
    program: Program, idProgram: Program,
    objects: ReadonlyArray<SceneItem>,
    activePoint: Vec2,
    ctx: CanvasRenderingContext2D,
): void {
    runtime.setFramebuffer(framebuffer);
    camera.setViewportSize(framebuffer.size());
    runtime.setClearColor(color(0, 0, 0, 0));
    runtime.clearBuffer('color|depth');
    for (const { primitive, modelMat } of objects) {
        primitive.setProgram(idProgram);
        idProgram.setUniform('u_view_proj', camera.getTransformMat());
        idProgram.setUniform('u_model', modelMat);
        idProgram.setUniform('u_id', vec4(1, 0, 0, 1));
        primitive.render();
    }

    //ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    const raw1 = new Uint8Array(framebuffer.size().x * framebuffer.size().y * 4);
    // const raw2 = new Uint8Array(framebuffer.size().x * framebuffer.size().y * 4);
    runtime.readPixels({ pixels: raw1 });
    // runtime.readPixels({ pixels: raw2 });
    const pixels1 = new Uint32Array(raw1.buffer);
    // const pixels2 = new Uint32Array(raw2.buffer);

    // const eq = pixels1.every((p1, i) => p1 === pixels2[i]);
    // console.log('@@@@@', eq);

    const { x, y } = activePoint;
    const idx = y * framebuffer.size().x + x;
    const pixel = pixels1[idx];
    console.log('#####', x, y, pixel);

    const imageData = ctx.createImageData(ctx.canvas.width, ctx.canvas.height);
    const step = framebuffer.size().x * 4;
    let srcOffset = 0;
    let dstOffset = imageData.data.length - step;
    for (let i = 0; i < framebuffer.size().y; ++i) {
        imageData.data.set(raw1.slice(srcOffset, srcOffset + step), dstOffset);
        srcOffset += step;
        dstOffset -= step;
    }
    // imageData.data.set(raw1);
    ctx.putImageData(imageData, 0, 0);

    ctx.fillStyle = pixel > 0 ? 'blue' : 'black';
    ctx.fillRect(x - 4, ctx.canvas.height - y + 4, 8, 8);

    runtime.setFramebuffer(null);
    camera.setViewportSize(runtime.canvasSize());
    runtime.setClearColor(color(0.7, 0.7, 0.7));
    runtime.clearBuffer('color|depth');
    for (const { primitive, modelMat, normalMat } of objects) {
        primitive.setProgram(program);
        program.setUniform('u_view_proj', camera.getTransformMat());
        program.setUniform('u_model', modelMat);
        program.setUniform('u_model_invtrs', normalMat);
        primitive.render();
    }
}

function makeObjects(runtime: Runtime): {
    objects: ReadonlyArray<SceneItem>,
    program: Program,
    idProgram: Program,
 } {
    const { make: makeObject, program, idProgram } = makeObjectsFactory(runtime);
    const objects: SceneItem[] = [
        makeObject(
            vec3(1, 0.9, 0.6), vec3(1, 0, 0), 0.3 * Math.PI, vec3(4, 0, 0),
        ),
        makeObject(
            vec3(0.7, 1, 0.8), vec3(0, 1, 0), 0.4 * Math.PI, vec3(-3, 0, 0),
        ),
        makeObject(
            vec3(0.9, 0.8, 1), vec3(0, 0, 1), 0.3 * Math.PI, vec3(0, 0, 5),
        ),
        makeObject(
            vec3(1, 0.9, 0.8), vec3(0, 1, 0), 0.2 * Math.PI, vec3(0, 0, -4),
        ),
    ];
    return { objects, program, idProgram };
}

// In perspective projection higher aspect means extra horizontal space on left and right sides.
// I.e. if some pixel has coordinate x1 in a1 aspect then in a2 > a1 aspect that pixel would have
// coordinate x2 > x1 if x1 < x_center and x2 < x1 of x1 > x_center. Y coordinate stays the same.
function mapPixelCoodinates(coords: Vec2, size1: Vec2, size2: Vec2): Vec2 {
    const aspect1 = size1.x / size1.y;
    const aspect2 = size2.x / size2.y;
    // Convert coordinates from [0, w1] * [0, h1] space to [-1, +1] * [-1, +1] space.
    // Adjust [-1, +1] coordinates assuming that aspect1 * x1 == aspect2 * x2, y1 == y2.
    const x = (2 * coords.x / size1.x - 1) * (aspect1 / aspect2);
    const y = 2 * coords.y / size1.y - 1;
    // Convert coodinates from [-1, +1] * [-1, +1] to [0, w2] * [0, h2].
    return vec2(
        Math.round(size2.x * (x + 1) / 2),
        Math.round(size2.y * (y + 1) / 2),
    );
}
