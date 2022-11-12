import {
    XOY3, YOZ3, ZOX3, plane3, plane3eq, plane3ofPoints,
} from './plane3';

describe('plane3', () => {
    it('constants', () => {
        expect(plane3eq(XOY3, { normal: { x: 0, y: 0, z: 1 }, distance: 0 })).toEqual(true);
        expect(plane3eq(YOZ3, { normal: { x: 1, y: 0, z: 0 }, distance: 0 })).toEqual(true);
        expect(plane3eq(ZOX3, { normal: { x: 0, y: 1, z: 0 }, distance: 0 })).toEqual(true);
    });

    it('plane3eq', () => {
        expect(plane3eq(
            { normal: { x: 1, y: 2, z: 3 }, distance: 1 },
            { normal: { x: 2, y: 3, z: 4 }, distance: 1 },
        )).toEqual(false);
        expect(plane3eq(
            { normal: { x: 1, y: 2, z: 3 }, distance: 1 },
            { normal: { x: 1, y: 2, z: 3 }, distance: 2 },
        )).toEqual(false);
        expect(plane3eq(
            { normal: { x: 1, y: 2, z: 3 }, distance: 1 },
            { normal: { x: 1, y: 2, z: 3 }, distance: 1 },
        )).toEqual(true);
    });

    it('normalization', () => {
        expect(plane3eq(
            plane3({ x: -4, y: 0, z: 0 }, 5),
            { normal: { x: 1, y: 0, z: 0 }, distance: -5 },
        )).toEqual(true);
        expect(plane3eq(
            plane3({ x: 0, y: -3, z: 0 }, 4),
            { normal: { x: 0, y: -1, z: 0 }, distance: 4 },
        )).toEqual(true);
        expect(plane3eq(
            plane3({ x: 0, y: 0, z: -2 }, -3),
            { normal: { x: 0, y: 0, z: -1 }, distance: -3 },
        )).toEqual(true);
    });

    it('plane3ofPoints', () => {
        expect(plane3eq(
            plane3ofPoints({ x: 5, y: 3, z: -4 }, { x: -10, y: 3, z: -1 }, { x: 0, y: 3, z: 2 }),
            { normal: { x: 0, y: 1, z: 0 }, distance: 3 },
        )).toEqual(true);
    });
});
