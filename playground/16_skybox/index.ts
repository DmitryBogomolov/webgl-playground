import {
    Runtime,
    Primitive,
    Program,
    TextureCube, TextureCubeImageData,
    Camera,
    vec3,
    parseVertexSchema,
    loadImage,
    deg2rad,
} from 'lib';
import { observable, computed } from 'util/observable';
import { createControls } from 'util/controls';
import vertShader from './shaders/skybox.vert';
import fragShader from './shaders/skybox.frag';

/**
 * Skybox.
 *
 * TODO...
 */
export type DESCRIPTION = never;

// TODO: Investigate inversion.
main();

function main(): void {
    const container = document.querySelector<HTMLElement>(PLAYGROUND_ROOT)!;
    const runtime = new Runtime(container);
    const quad = makeQuad(runtime);
    const texture = makeTexture(runtime);
    const camera = new Camera();

    const cameraLon = observable(0);
    const cameraLat = observable(0);
    const cameraPos = computed(([cameraLon, cameraLat]) => {
        const lon = deg2rad(cameraLon);
        const lat = deg2rad(cameraLat);
        return vec3(
            Math.cos(lat) * Math.sin(lon),
            Math.sin(lat),
            Math.cos(lat) * Math.cos(lon),
        );
    }, [cameraLon, cameraLat]);
    cameraPos.on((cameraPos) => {
        camera.setEyePos(cameraPos);
    });

    camera.changed().on(() => runtime.requestFrameRender());
    runtime.sizeChanged().on(() => {
        camera.setViewportSize(runtime.canvasSize());
    });
    runtime.frameRendered().on(() => {
        renderFrame(runtime, camera, quad, texture);
    });

    createControls(container, [
        { label: 'camera lon', value: cameraLon, min: -180, max: +180 },
        { label: 'camera lat', value: cameraLat, min: -80, max: +80 },
    ]);
}

function renderFrame(runtime: Runtime, camera: Camera, primitive: Primitive, texture: TextureCube): void {
    runtime.clearBuffer('color|depth');

    runtime.setCubeTextureUnit(4, texture);
    primitive.program().setUniform('u_texture', 4);
    primitive.program().setUniform('u_view_proj_inv', camera.getInvtransformMat());
    primitive.render();
}

function makeQuad(runtime: Runtime): Primitive {
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

function makeTexture(runtime: Runtime): TextureCube {
    const texture = new TextureCube(runtime);
    const schema: { key: keyof TextureCubeImageData, url: string }[] = [
        { key: 'xNeg', url: '/static/computer-history-museum/x-neg.jpg' },
        { key: 'xPos', url: '/static/computer-history-museum/x-pos.jpg' },
        { key: 'yNeg', url: '/static/computer-history-museum/y-neg.jpg' },
        { key: 'yPos', url: '/static/computer-history-museum/y-pos.jpg' },
        { key: 'zNeg', url: '/static/computer-history-museum/z-neg.jpg' },
        { key: 'zPos', url: '/static/computer-history-museum/z-pos.jpg' },
    ];
    const loadings = schema.map(({ key, url }) =>
        loadImage(url).then((image) => ({ key, image })),
    );
    Promise.all(loadings).then((items) => {
        const imageData: Record<string, HTMLImageElement> = {};
        items.forEach(({ key, image }) => {
            imageData[key] = image;
        });
        texture.setImageData(imageData as unknown as TextureCubeImageData);
        runtime.requestFrameRender();
    }).catch(console.error);
    return texture;
}
