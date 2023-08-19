import {
    ZERO2, UNIT2, XUNIT2, YUNIT2,
    eq2, isZero2, isUnit2, vec2str, clone2, neg2, inv2, len2, sqrlen2, norm2,
    dot2, mul2, div2, mulc2, divc2, add2, sub2, dir2, dist2, sqrdist2, project2,
} from './vec2';

describe('vec2', () => {
    it('constants', () => {
        expect(ZERO2).toBeVec2({ x: 0, y: 0 });
        expect(UNIT2).toBeVec2({ x: 1, y: 1 });
        expect(XUNIT2).toBeVec2({ x: 1, y: 0 });
        expect(YUNIT2).toBeVec2({ x: 0, y: 1 });
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

    it('vec2str', () => {
        expect(vec2str({ x: 1, y: 2 })).toEqual('(1, 2)');
        expect(vec2str({ x: 2.1234, y: 3.0023 })).toEqual('(2.1234, 3.0023)');
    });

    it('clone2', () => {
        expect(clone2({ x: 3, y: 1 })).toBeVec2({ x: 3, y: 1 });
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

    it('mulc2', () => {
        expect(mulc2({ x: 1, y: 2 }, { x: 2, y: 3 })).toBeVec2({ x: 2, y: 6 });
    });

    it('divc2', () => {
        expect(divc2({ x: 1, y: 2 }, { x: 2, y: 3 })).toBeVec2({ x: 0.5, y: 0.6667 });
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

    it('project2', () => {
        expect(project2({ x: 2, y: 3 }, { x: -10, y: 0 })).toBeVec2({ x: 2, y: 0 });
        expect(project2({ x: 2, y: 3 }, { x: 0, y: -20 })).toBeVec2({ x: 0, y: 3 });
        expect(project2({ x: 2, y: 3 }, { x: -20, y: -30 })).toBeVec2({ x: 2, y: 3 });
        expect(project2({ x: 2, y: 3 }, { x: 0, y: -30 })).toBeVec2({ x: 0, y: 3 });
    });
});
