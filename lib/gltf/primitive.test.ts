import type { GlTF_PRIMITIVE_MODE } from './primitive.types';
import { getPrimitiveMode } from './primitive';

describe('primitive', () => {
    describe('getPrimitiveMode', () => {
        it('parse mode', () => {
            expect(getPrimitiveMode({ attributes: {} })).toEqual<GlTF_PRIMITIVE_MODE>('triangles');
            expect(getPrimitiveMode({ attributes: {}, mode: 0 })).toEqual<GlTF_PRIMITIVE_MODE>('points');
            expect(getPrimitiveMode({ attributes: {}, mode: 4 })).toEqual<GlTF_PRIMITIVE_MODE>('triangles');
        });
    });
});
