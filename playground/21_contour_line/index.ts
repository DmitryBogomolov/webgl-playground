import {
    Runtime,
    Primitive,
    Camera,
    Vec3, vec3, mul3,
    Mat4, identity4x4, apply4x4, xrotation4x4, yrotation4x4,
    Color, color,
    deg2rad, spherical2zxy,
} from 'lib';
import { observable, computed, Observable } from 'util/observable';
import { createControls } from 'util/controls';
import { makePrimitive, makeControurPrimitive } from './primitive';
import { findContour } from './contour';

/**
 * Contour line.
 *
 * TODO...
 */
export type DESCRIPTION = never;

main();

interface State {
    readonly runtime: Runtime;
    readonly camera: Camera;
    readonly primitive: Primitive;
    readonly contourPrimitive: Primitive;
    readonly modelMat: Observable<Mat4>;
    readonly modelClr: Color;
    readonly modelPoints: ReadonlyArray<Vec3>;
}

function main(): void {
    const container = document.querySelector<HTMLElement>(PLAYGROUND_ROOT)!;
    const runtime = new Runtime(container);
    runtime.setDepthTest(true);
    runtime.setClearColor(color(0.8, 0.8, 0.8));
    const camera = new Camera();

    const cameraLon = observable(0);
    const cameraLat = observable(20);
    const cameraDist = observable(2);
    const cameraPos = computed(([cameraLon, cameraLat, cameraDist]) => {
        const dir = spherical2zxy({ azimuth: deg2rad(cameraLon), elevation: deg2rad(cameraLat) });
        return mul3(dir, cameraDist);
    }, [cameraLon, cameraLat, cameraDist]);
    cameraPos.on((cameraPos) => {
        camera.setEyePos(cameraPos);
    });

    const xRotation = observable(0);
    const yRotation = observable(0);
    const _modelMat = identity4x4();
    const modelMat = computed(([xRotation, yRotation]) => {
        const mat = _modelMat;
        identity4x4(mat);
        apply4x4(mat, xrotation4x4, deg2rad(xRotation));
        apply4x4(mat, yrotation4x4, deg2rad(yRotation));
        return mat;
    }, [xRotation, yRotation]);

    const state: State = {
        runtime,
        camera,
        primitive: makePrimitive(runtime),
        contourPrimitive: makeControurPrimitive(runtime),
        modelMat,
        modelClr: color(0.5, 0.1, 0.5),
        modelPoints: [
            vec3(-0.5, -0.5, -0.5),
            vec3(+0.5, -0.5, -0.5),
            vec3(+0.5, +0.5, -0.5),
            vec3(-0.5, +0.5, -0.5),
            vec3(-0.5, -0.5, +0.5),
            vec3(+0.5, -0.5, +0.5),
            vec3(+0.5, +0.5, +0.5),
            vec3(-0.5, +0.5, +0.5),
        ]
    };

    runtime.frameRendered().on(() => {
        renderScene(state);
    });

    runtime.sizeChanged().on(() => {
        camera.setViewportSize(runtime.canvasSize());
    });
    [camera.changed(), modelMat].forEach((proxy) => proxy.on(() => {
        updateContourPrimitive(state);
        runtime.requestFrameRender();
    }));

    createControls(container, [
        { label: 'camera lon', value: cameraLon, min: -180, max: +180 },
        { label: 'camera lat', value: cameraLat, min: -30, max: +30 },
        { label: 'camera dist', value: cameraDist, min: 1, max: 8, step: 0.2 },
        { label: 'x rotation', value: xRotation, min: -180, max: +180 },
        { label: 'y rotation', value: yRotation, min: -180, max: +180 },
    ]);
}

function renderScene({ runtime, camera, primitive, contourPrimitive, modelMat, modelClr }: State): void {
    runtime.clearBuffer('color|depth');

    runtime.setDepthTest(true);
    runtime.setDepthMask(true);
    primitive.program().setUniform('u_view_proj', camera.getTransformMat());
    primitive.program().setUniform('u_model', modelMat());
    primitive.program().setUniform('u_color', modelClr);
    primitive.render();

    runtime.setDepthTest(false);
    runtime.setDepthMask(false);
    contourPrimitive.render();
}

function updateContourPrimitive({ contourPrimitive, camera, modelMat, modelPoints }: State): void {
    const points = findContour(modelPoints, modelMat(), camera.getTransformMat());
    console.log('###', points);
    const vertexData = new Float32Array(points.length * 2);
    const indexData = new Uint16Array(points.length * 2);
    for (let i = 0; i < points.length; ++i) {
        vertexData[2 * i + 0] = points[i].x;
        vertexData[2 * i + 1] = points[i].y;
        indexData[2 * i + 0] = i;
        indexData[2 * i + 1] = (i + 1) % points.length;
    }
    // const vertexData = new Float32Array([
    //     -0.5, -0.5,
    //     +0.5, -0.5,
    //     +0.5, +0.5,
    //     -0.5, +0.5,
    // ]);
    // const indexData = new Uint16Array([
    //     0, 1,
    //     1, 2,
    //     2, 3,
    //     3, 0,
    // ]);
    contourPrimitive.updateVertexData(vertexData);
    contourPrimitive.updateIndexData(indexData);
    contourPrimitive.setIndexData({ indexCount: indexData.length, primitiveMode: 'lines' });
}
