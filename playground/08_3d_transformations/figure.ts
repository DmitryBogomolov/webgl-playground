import type { Primitive, Vec3, Mat4, Mat4Mut } from 'lib';
import {
    ZERO3, UNIT3, YUNIT3, ZUNIT3, eq3, mul3, cross3, norm3,
    mat4, targetTo4x4, identity4x4, scaling4x4, mul4x4, apply4x4, rotation4x4, yrotation4x4,
} from 'lib';

export interface FigureRenderer {
    update(viewProj: Mat4, parentModel: Mat4, delta: number): void;
    render(): void;
    model(): Mat4;
}

export function makeFigureRenderer(
    primitive: Primitive, size: number, axis: Vec3, distance: number, speed: number,
): FigureRenderer {
    const selfSpeed = -speed * 4;
    const model = getInitialModel(axis, distance) as Mat4Mut;
    const selfModel = getInitialSelfModel(size) as Mat4Mut;
    const transform = mat4() as Mat4Mut;
    return {
        update(viewProj, parentModel, delta) {
            apply4x4(selfModel, yrotation4x4, selfSpeed * delta);
            apply4x4(model, rotation4x4, axis, speed * delta);

            identity4x4(transform);
            mul4x4(selfModel, transform, transform);
            mul4x4(model, transform, transform);
            mul4x4(parentModel, transform, transform);
            mul4x4(viewProj, transform, transform);
        },

        render() {
            primitive.program().setUniform('u_transform', transform);
            primitive.render();
        },

        model() {
            return model;
        },
    };
}

function getInitialModel(axis: Vec3, distance: number): Mat4 {
    const up = norm3(axis);
    let dir = cross3(YUNIT3, up);
    if (eq3(dir, ZERO3)) {
        dir = ZUNIT3;
    }
    return targetTo4x4({ eye: mul3(dir, distance), target: ZERO3, up: up });
}

function getInitialSelfModel(size: number): Mat4 {
    return scaling4x4(mul3(UNIT3, size));
}
