import {
    point3line3projection, point3line3distance,
    point3plane3projection, point3plane3distance,
    line3plane3intersection,
    line3line3distance,
    line3line3intersection,
    plane3plane3intersection,
} from './relations3';

describe('relations3', () => {
    it('point3line3projection', () => {
        expect(point3line3projection(
            { x: 4, y: 4, z: 10 },
            { direction: { x: 1, y: 1, z: 0 }, anchor: { x: 2, y: 2, z: 1 } },
        )).toBeVec3({ x: 4, y: 4, z: 1 });
        expect(point3line3projection(
            { x: 2, y: 2, z: -4 },
            { direction: { x: 1, y: 1, z: 0 }, anchor: { x: 2, y: 2, z: 1 } },
        )).toBeVec3({ x: 2, y: 2, z: 1 });
        expect(point3line3projection(
            { x: 3, y: 3, z: 1 },
            { direction: { x: 1, y: 1, z: 0 }, anchor: { x: 2, y: 2, z: 1 } },
        )).toBeVec3({ x: 3, y: 3, z: 1 });
    });

    it('point3line3distance', () => {
        expect(point3line3distance(
            { x: 4, y: 4, z: 10 },
            { direction: { x: 1, y: 1, z: 0 }, anchor: { x: 2, y: 2, z: 1 } },
        )).toEqual(9);
        expect(point3line3distance(
            { x: 2, y: 2, z: -4 },
            { direction: { x: 1, y: 1, z: 0 }, anchor: { x: 2, y: 2, z: 1 } },
        )).toEqual(5);
        expect(point3line3distance(
            { x: 3, y: 3, z: 1 },
            { direction: { x: 1, y: 1, z: 0 }, anchor: { x: 2, y: 2, z: 1 } },
        )).toEqual(0);
    });

    it('point3plane3projection', () => {
        expect(point3plane3projection(
            { x: 2, y: 3, z: 4 },
            { normal: { x: 0, y: 0, z: 2 }, distance: 4 },
        )).toBeVec3({ x: 2, y: 3, z: 4 });
        expect(point3plane3projection(
            { x: 5, y: 2, z: 1 },
            { normal: { x: 0, y: 0, z: 2 }, distance: 4 },
        )).toBeVec3({ x: 5, y: 2, z: 4 });
    });

    it('point3plane3distance', () => {
        expect(point3plane3distance(
            { x: 2, y: 3, z: 4 },
            { normal: { x: 0, y: 0, z: 2 }, distance: 4 },
        )).toEqual(0);
        expect(point3plane3distance(
            { x: 5, y: 2, z: 1 },
            { normal: { x: 0, y: 0, z: 2 }, distance: 4 },
        )).toEqual(3);
    });

    it('line3plane3intersection', () => {
        expect(line3plane3intersection(
            { direction: { x: 2, y: 2, z: 1 }, anchor: { x: 0, y: 0, z: 4 } },
            { normal: { x: 0, y: 0, z: 1 }, distance: 2 },
        )).toBeVec3({ x: -4, y: -4, z: 2 });
        expect(line3plane3intersection(
            { direction: { x: 2, y: 2, z: 1 }, anchor: { x: 0, y: 0, z: 2 } },
            { normal: { x: 0, y: 0, z: 1 }, distance: 2 },
        )).toBeVec3({ x: 0, y: 0, z: 2 });
        expect(line3plane3intersection(
            { direction: { x: 2, y: 2, z: 0 }, anchor: { x: 0, y: 0, z: 4 } },
            { normal: { x: 0, y: 0, z: 1 }, distance: 2 },
        )).toEqual(2);
        expect(line3plane3intersection(
            { direction: { x: 2, y: 2, z: 0 }, anchor: { x: 0, y: 0, z: 2 } },
            { normal: { x: 0, y: 0, z: 1 }, distance: 2 },
        )).toEqual(0);
    });

    it('line3line3distance', () => {
        expect(line3line3distance(
            { direction: { x: 2, y: 1, z: 0 }, anchor: { x: 3, y: 2, z: 4 } },
            { direction: { x: 1, y: 2, z: 0 }, anchor: { x: 2, y: 3, z: 2 } },
        )).toEqual(2);
        expect(line3line3distance(
            { direction: { x: 2, y: 1, z: 0 }, anchor: { x: 3, y: 2, z: 3 } },
            { direction: { x: 1, y: 2, z: 0 }, anchor: { x: 2, y: 3, z: 3 } },
        )).toEqual(0);
        expect(line3line3distance(
            { direction: { x: 3, y: 3, z: 0 }, anchor: { x: 3, y: 2, z: 5 } },
            { direction: { x: 3, y: 3, z: 0 }, anchor: { x: 3, y: 2, z: 1 } },
        )).toEqual(4);
        expect(line3line3distance(
            { direction: { x: 3, y: 3, z: 0 }, anchor: { x: 3, y: 2, z: 1 } },
            { direction: { x: 3, y: 3, z: 0 }, anchor: { x: 3, y: 2, z: 1 } },
        )).toEqual(0);
    });

    it('line3line3intersection', () => {
        expect(line3line3intersection(
            { direction: { x: 2, y: 1, z: 0 }, anchor: { x: 3, y: 2, z: 4 } },
            { direction: { x: 1, y: 2, z: 0 }, anchor: { x: 2, y: 3, z: 2 } },
        )).toEqual(null);
        expect(line3line3intersection(
            { direction: { x: 2, y: 1, z: 0 }, anchor: { x: 3, y: 2, z: 3 } },
            { direction: { x: 1, y: 2, z: 0 }, anchor: { x: 2, y: 3, z: 3 } },
        )).toBeVec3({ x: 1, y: 1, z: 3 });
        expect(line3line3intersection(
            { direction: { x: 3, y: 3, z: 0 }, anchor: { x: 3, y: 2, z: 5 } },
            { direction: { x: 3, y: 3, z: 0 }, anchor: { x: 3, y: 2, z: 1 } },
        )).toEqual(null);
        expect(line3line3intersection(
            { direction: { x: 3, y: 3, z: 0 }, anchor: { x: 3, y: 2, z: 1 } },
            { direction: { x: 3, y: 3, z: 0 }, anchor: { x: 3, y: 2, z: 1 } },
        )).toEqual(null);
    });

    it('plane3plane3intersection', () => {
        expect(plane3plane3intersection(
            { normal: { x: 0, y: 0, z: 2 }, distance: 2 },
            { normal: { x: 0, y: 0, z: 3 }, distance: 2 },
        )).toEqual(0);
        expect(plane3plane3intersection(
            { normal: { x: 0, y: 0, z: 2 }, distance: 2 },
            { normal: { x: 0, y: 0, z: 3 }, distance: 4 },
        )).toEqual(2);
        expect(plane3plane3intersection(
            { normal: { x: 2, y: 0, z: 0 }, distance: 4 },
            { normal: { x: 0, y: 3, z: 0 }, distance: 5 },
        )).toEqual({ direction: { x: 0, y: 0, z: 1 }, anchor: { x: 4, y: 5, z: 0 } });
    });
});
