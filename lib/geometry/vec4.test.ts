import {
    ZERO4, UNIT4, XUNIT4, YUNIT4, ZUNIT4, WUNIT4,
    eq4, isZero4, isUnit4, neg4, inv4, len4, sqrlen4, norm4,
    dot4, mul4, div4, mulc4, divc4, add4, sub4,
} from './vec4';

describe('vec4', () => {
    it('constants', () => {
        expect(eq4(ZERO4, { x: 0, y: 0, z: 0, w: 0 })).toEqual(true);
        expect(eq4(UNIT4, { x: 1, y: 1, z: 1, w: 1 })).toEqual(true);
        expect(eq4(XUNIT4, { x: 1, y: 0, z: 0, w: 0 })).toEqual(true);
        expect(eq4(YUNIT4, { x: 0, y: 1, z: 0, w: 0 })).toEqual(true);
        expect(eq4(ZUNIT4, { x: 0, y: 0, z: 1, w: 0 })).toEqual(true);
        expect(eq4(WUNIT4, { x: 0, y: 0, z: 0, w: 1 })).toEqual(true);
    });

    it('eq4', () => {
        expect(eq4({ x: 1, y: 2, z: 3, w: 4 }, { x: 2, y: 3, z: 4, w: 5 })).toEqual(false);
        expect(eq4({ x: 1, y: 2, z: 3, w: 4 }, { x: 1, y: 2, z: 3, w: 4 })).toEqual(true);
    });

    it('isZero4', () => {
        expect(isZero4({ x: 0, y: 0, z: 0, w: 0 })).toEqual(true);
        expect(isZero4({ x: 0.1, y: 0, z: 0, w: 2 })).toEqual(false);
    });

    it('isUnit4', () => {
        expect(isUnit4({ x: 1, y: 0, z: 0, w: 0 })).toEqual(true);
        expect(isUnit4({ x: 0, y: -1, z: 0, w: 0 })).toEqual(true);
        expect(isUnit4({ x: 0, y: 0, z: 1, w: 0 })).toEqual(true);
        expect(isUnit4({ x: 0, y: 0, z: 0, w: -1 })).toEqual(true);
        expect(isUnit4({ x: -1 / 3, y: 2 / 3, z: -2 / 3, w: 0 })).toEqual(true);
        expect(isUnit4({ x: 2, y: -1, z: 0, w: 1 })).toEqual(false);
    });

    it('dot4', () => {
        expect(dot4({ x: 1, y: 2, z: 3, w: 4 }, { x: 2, y: 3, z: -1, w: -2 })).toEqual(-3);
    });

    it('neg4', () => {
        expect(neg4({ x: 1, y: 2, z: 3, w: 4 })).toBeVec4({ x: -1, y: -2, z: -3, w: -4 });
    });

    it('inv4', () => {
        expect(inv4({ x: 1, y: 2, z: 3, w: 4 })).toBeVec4({ x: 1, y: 0.5, z: 0.3333, w: 0.25 });
    });

    it('mul4', () => {
        expect(mul4({ x: 1, y: 2, z: 3, w: 4 }, 4)).toBeVec4({ x: 4, y: 8, z: 12, w: 16 });
    });

    it('div4', () => {
        expect(div4({ x: 1, y: 2, z: 3, w: 4 }, 4)).toBeVec4({ x: 0.25, y: 0.5, z: 0.75, w: 1 });
    });

    it('mulc4', () => {
        expect(mulc4({ x: 1, y: 2, z: 3, w: 4 }, { x: 2, y: 3, z: 4, w: 5 }))
            .toBeVec4({ x: 2, y: 6, z: 12, w: 20 });
    });

    it('divc4', () => {
        expect(divc4({ x: 1, y: 2, z: 3, w: 4 }, { x: 2, y: 3, z: 4, w: 5 }))
            .toBeVec4({ x: 0.5, y: 0.6667, z: 0.75, w: 0.8 });
    });

    it('add4', () => {
        expect(add4({ x: 1, y: 2, z: 3, w: 4 }, { x: 2, y: 4, z: 6, w: 8 })).toBeVec4({ x: 3, y: 6, z: 9, w: 12 });
    });

    it('sub4', () => {
        expect(sub4({ x: 1, y: 2, z: 3, w: 4 }, { x: 2, y: 4, z: 6, w: 8 })).toBeVec4({ x: -1, y: -2, z: -3, w: -4 });
    });

    it('len4', () => {
        expect(len4({ x: 1, y: 2, z: 3, w: 4 })).toBeCloseTo(5.4772, 4);
    });

    it('sqrlen4', () => {
        expect(sqrlen4({ x: 1, y: 2, z: 3, w: 4 })).toEqual(30);
    });

    it('norm4', () => {
        expect(norm4({ x: 3, y: 4, z: 5, w: 6 })).toBeVec4({ x: 0.3235, y: 0.4313, z: 0.5392, w: 0.647 });
    });
});
