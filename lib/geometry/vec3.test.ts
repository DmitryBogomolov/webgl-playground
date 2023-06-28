import {
    ZERO3, UNIT3, XUNIT3, YUNIT3, ZUNIT3,
    eq3, isZero3, isUnit3, clone3, neg3, inv3, len3, sqrlen3, norm3, dir3, dist3, sqrdist3,
    dot3, mul3, div3, mulc3, divc3, add3, sub3, cross3, rotate3,
    collinear3, orthogonal3, project3,
} from './vec3';

describe('vec3', () => {
    it('constants', () => {
        expect(ZERO3).toBeVec3({ x: 0, y: 0, z: 0 });
        expect(UNIT3).toBeVec3({ x: 1, y: 1, z: 1 });
        expect(XUNIT3).toBeVec3({ x: 1, y: 0, z: 0 });
        expect(YUNIT3).toBeVec3({ x: 0, y: 1, z: 0 });
        expect(ZUNIT3).toBeVec3({ x: 0, y: 0, z: 1 });
    });

    it('eq3', () => {
        expect(eq3({ x: 1, y: 2, z: 3 }, { x: 2, y: 3, z: 4 })).toEqual(false);
        expect(eq3({ x: 1, y: 2, z: 3 }, { x: 1, y: 2, z: 3 })).toEqual(true);
    });

    it('isZero3', () => {
        expect(isZero3({ x: 0, y: 0, z: 0 })).toEqual(true);
        expect(isZero3({ x: 0.1, y: 0, z: 0 })).toEqual(false);
    });

    it('isUnit3', () => {
        expect(isUnit3({ x: 1, y: 0, z: 0 })).toEqual(true);
        expect(isUnit3({ x: 0, y: -1, z: 0 })).toEqual(true);
        expect(isUnit3({ x: 0, y: 0, z: 1 })).toEqual(true);
        expect(isUnit3({ x: -1 / 3, y: 2 / 3, z: -2 / 3 })).toEqual(true);
        expect(isUnit3({ x: 2, y: -1, z: 0 })).toEqual(false);
    });

    it('clone3', () => {
        expect(clone3({ x: 3, y: 1, z: 2 })).toBeVec3({ x: 3, y: 1, z: 2 });
    });

    it('dot3', () => {
        expect(dot3({ x: 1, y: 2, z: 3 }, { x: 2, y: 3, z: -1 })).toEqual(5);
    });

    it('neg3', () => {
        expect(neg3({ x: 1, y: 2, z: 3 })).toBeVec3({ x: -1, y: -2, z: -3 });
    });

    it('inv3', () => {
        expect(inv3({ x: 1, y: 2, z: 3 })).toBeVec3({ x: 1, y: 0.5, z: 0.3333 });
    });

    it('mul3', () => {
        expect(mul3({ x: 1, y: 2, z: 3 }, 4)).toBeVec3({ x: 4, y: 8, z: 12 });
    });

    it('div3', () => {
        expect(div3({ x: 1, y: 2, z: 3 }, 4)).toBeVec3({ x: 0.25, y: 0.5, z: 0.75 });
    });

    it('mulc3', () => {
        expect(mulc3({ x: 1, y: 2, z: 3 }, { x: 2, y: 3, z: 4 })).toBeVec3({ x: 2, y: 6, z: 12 });
    });

    it('divc3', () => {
        expect(divc3({ x: 1, y: 2, z: 3 }, { x: 2, y: 3, z: 4 })).toBeVec3({ x: 0.5, y: 0.6667, z: 0.75 });
    });

    it('add3', () => {
        expect(add3({ x: 1, y: 2, z: 3 }, { x: 2, y: 4, z: 6 })).toBeVec3({ x: 3, y: 6, z: 9 });
    });

    it('sub3', () => {
        expect(sub3({ x: 1, y: 2, z: 3 }, { x: 2, y: 4, z: 6 })).toBeVec3({ x: -1, y: -2, z: -3 });
    });

    it('len3', () => {
        expect(len3({ x: 1, y: 2, z: 3 })).toBeCloseTo(3.7417, 4);
    });

    it('sqrlen3', () => {
        expect(sqrlen3({ x: 1, y: 2, z: 3 })).toEqual(14);
    });

    it('dir3', () => {
        expect(dir3({ x: 1, y: 2, z: 1 }, { x: 4, y: 1, z: 3 })).toBeVec3({ x: 0.8018, y: -0.2673, z: 0.5345 });
    });

    it('dist3', () => {
        expect(dist3({ x: 1, y: 2, z: 1 }, { x: 4, y: 1, z: 3 })).toBeCloseTo(3.7417);
    });

    it('sqrdist3', () => {
        expect(sqrdist3({ x: 1, y: 2, z: 1 }, { x: 4, y: 1, z: 3 })).toBeCloseTo(14);
    });

    it('norm3', () => {
        expect(norm3({ x: 3, y: 4, z: 5 })).toBeVec3({ x: 0.4243, y: 0.5657, z: 0.7071 });
    });

    it('cross3', () => {
        expect(cross3({ x: 1, y: 2, z: 3 }, { x: 2, y: -1, z: -2 })).toBeVec3({ x: -1, y: 8, z: -5 });
    });

    it('rotate3', () => {
        expect(rotate3({ x: 0, y: 3, z: 0 }, { x: 2, y: 0, z: 0 }, Math.PI / 4))
            .toBeVec3({ x: 0, y: 2.1213, z: 2.1213 });
        expect(rotate3({ x: 2.1213, y: 0, z: 2.1213 }, { x: 0, y: 0.1, z: 0 }, -Math.PI / 4))
            .toBeVec3({ x: 0, y: 0, z: 3 });
    });

    it('collinear3', () => {
        expect(collinear3({ x: 1, y: 1, z: 0 }, { x: 2, y: 2, z: 0 })).toEqual(true);
        expect(collinear3({ x: 0, y: 1, z: 2 }, { x: 0, y: -0.5, z: -1 })).toEqual(true);
        expect(collinear3({ x: 0, y: 0, z: 0 }, { x: 1, y: 2, z: 3 })).toEqual(true);
        expect(collinear3({ x: 1, y: 1, z: 0 }, { x: 0, y: 1, z: 1 })).toEqual(false);
    });

    it('orthogonal3', () => {
        expect(orthogonal3({ x: 1, y: 1, z: 0 }, { x: 2, y: -2, z: 0 })).toEqual(true);
        expect(orthogonal3({ x: 0, y: 1, z: 2 }, { x: 4, y: 0, z: 0 })).toEqual(true);
        expect(orthogonal3({ x: 1, y: 1, z: 0 }, { x: 2, y: 1, z: 3 })).toEqual(false);
    });

    it('project3', () => {
        expect(project3({ x: 2, y: 3, z: 4 }, { x: -10, y: 0, z: 0 })).toBeVec3({ x: 2, y: 0, z: 0 });
        expect(project3({ x: 2, y: 3, z: 4 }, { x: 0, y: -20, z: 0 })).toBeVec3({ x: 0, y: 3, z: 0 });
        expect(project3({ x: 2, y: 3, z: 4 }, { x: 0, y: 0, z: -30 })).toBeVec3({ x: 0, y: 0, z: 4 });
        expect(project3({ x: 2, y: 3, z: 4 }, { x: -20, y: -30, z: 0 })).toBeVec3({ x: 2, y: 3, z: 0 });
        expect(project3({ x: 2, y: 3, z: 4 }, { x: 0, y: -30, z: -40 })).toBeVec3({ x: 0, y: 3, z: 4 });
        expect(project3({ x: 2, y: 3, z: 4 }, { x: -20, y: 0, z: -40 })).toBeVec3({ x: 2, y: 0, z: 4 });
        expect(project3({ x: 2, y: 3, z: 4 }, { x: -20, y: -30, z: -40 })).toBeVec3({ x: 2, y: 3, z: 4 });
    });
});
