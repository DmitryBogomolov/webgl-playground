import {
    Color,
    Vec2,
    Mat3,
    mat3,
    identity3x3,
    apply3x3,
    scaling3x3,
    mul3x3,
} from 'lib';
import { PrimitiveFactory } from './primitive';

export interface FigureRenderer {
    (projection: Mat3, transformation: Mat3): void;
}

export function makeFigureRenderer(makePrimitive: PrimitiveFactory, clr: Color, size: Vec2): FigureRenderer {
    const primitive = makePrimitive(clr);
    const mat = mat3();
    return (projection, transformation) => {
        identity3x3(mat);
        apply3x3(mat, scaling3x3, size);
        mul3x3(transformation, mat, mat);
        mul3x3(projection, mat, mat);
        primitive.program().setUniform('u_transform', mat);
        primitive.render();
    };
}
