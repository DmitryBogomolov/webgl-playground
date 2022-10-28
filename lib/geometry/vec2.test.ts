import {
    ZERO2, UNIT2, XUNIT2, YUNIT2,
    eq2, isZero2, isUnit2, neg2, inv2, len2, sqrlen2, norm2,
    dot2, mul2, div2, mul2c, div2c, add2, sub2, dir2, dist2, sqrdist2,
} from './vec2';

describe('vec2', () => {
    it('constants', () => {
        expect(eq2(ZERO2, { x: 0, y: 0 })).toEqual(true);
        expect(eq2(UNIT2, { x: 1, y: 1 })).toEqual(true);
        expect(eq2(XUNIT2, { x: 1, y: 0 })).toEqual(true);
        expect(eq2(YUNIT2, { x: 0, y: 1 })).toEqual(true);
    });

    it('eq2', () => {
        expect(eq2({ x: 1, y: 2 }, { x: 2, y: 3 })).toEqual(false);
        expect(eq2({ x: 1, y: 2 }, { x: 1, y: 2 })).toEqual(true);
    });

    it('isZero2', () => {
        expect(isZero2({ x: 0, y: 0 })).toEqual(true);
        expect(isZero2({ x: 0.1, y: 0 })).toEqual(false);
    });

    it('isUnit2', () => {
        expect(isUnit2({ x: 1, y: 0 })).toEqual(true);
        expect(isUnit2({ x: 0, y: -1 })).toEqual(true);
        expect(isUnit2({ x: -0.8, y: 0.6 })).toEqual(true);
        expect(isUnit2({ x: 2, y: -1 })).toEqual(false);
    });

    it('dot2', () => {
        expect(dot2({ x: 1, y: 2 }, { x: 2, y: 3 })).toEqual(8);
    });

    it('neg2', () => {
        expect(neg2({ x: 1, y: 2 })).toBeVec2({ x: -1, y: -2 });
    });

    it('inv2', () => {
        expect(inv2({ x: 1, y: 2 })).toBeVec2({ x: 1, y: 0.5 });
    });

    it('mul2', () => {
        expect(mul2({ x: 1, y: 2 }, 4)).toBeVec2({ x: 4, y: 8 });
    });

    it('div2', () => {
        expect(div2({ x: 1, y: 2 }, 4)).toBeVec2({ x: 0.25, y: 0.5 });
    });

    it('mul2c', () => {
        expect(mul2c({ x: 1, y: 2 }, { x: 2, y: 3 })).toBeVec2({ x: 2, y: 6 });
    });

    it('div2c', () => {
        expect(div2c({ x: 1, y: 2 }, { x: 2, y: 3 })).toBeVec2({ x: 0.5, y: 0.6667 });
    });

    it('add2', () => {
        expect(add2({ x: 1, y: 2 }, { x: 2, y: 4 })).toBeVec2({ x: 3, y: 6 });
    });

    it('sub2', () => {
        expect(sub2({ x: 1, y: 2 }, { x: 2, y: 4 })).toBeVec2({ x: -1, y: -2 });
    });

    it('len2', () => {
        expect(len2({ x: 1, y: 2 })).toBeCloseTo(2.2361, 4);
    });

    it('sqrlen2', () => {
        expect(sqrlen2({ x: 1, y: 2 })).toEqual(5);
    });

    it('norm2', () => {
        expect(norm2({ x: 3, y: 4 })).toBeVec2({ x: 0.6, y: 0.8 });
    });

    it('dir2', () => {
        expect(dir2({ x: 1, y: 2 }, { x: 4, y: 1 })).toBeVec2({ x: 0.9487, y: -0.3162 });
    });

    it('dist2', () => {
        expect(dist2({ x: 1, y: 2 }, { x: 4, y: 1 })).toBeCloseTo(3.1623);
    });

    it('sqrdist2', () => {
        expect(sqrdist2({ x: 1, y: 2 }, { x: 4, y: 1 })).toBeCloseTo(10);
    });
});
