import type { Color, Vec2, Mat3, Mat3Mut } from 'lib';
import type { PrimitiveFactory } from './primitive';
import { mat3, identity3x3, apply3x3, scaling3x3, mul3x3 } from 'lib';

export interface FigureRenderer {
    (projection: Mat3, transformation: Mat3): void;
}

export function makeFigureRenderer(factory: PrimitiveFactory, clr: Color, size: Vec2): FigureRenderer {
    const primitive = factory.createPrimitive(clr);
    const mat = mat3() as Mat3Mut;
    return (projection, transformation) => {
        identity3x3(mat);
        apply3x3(mat, scaling3x3, size);
        mul3x3(transformation, mat, mat);
        mul3x3(projection, mat, mat);
        primitive.program().setUniform('u_transform', mat);
        primitive.render();
    };
}
