import {
    point2line2projection, point2line2distance,
    line2line2intersection,
} from './relations2';

describe('relations2', () => {
    it('point2line2projection', () => {
        expect(point2line2projection(
            { x: 4, y: 4 },
            { normal: { x: 0, y: 1 }, distance: 2 },
        )).toBeVec2({ x: 4, y: 2 });
        expect(point2line2projection(
            { x: 1, y: 1 },
            { normal: { x: 0, y: 1 }, distance: 2 },
        )).toBeVec2({ x: 1, y: 2 });
        expect(point2line2projection(
            { x: 0, y: 2 },
            { normal: { x: 0, y: 1 }, distance: 2 },
        )).toBeVec2({ x: 0, y: 2 });
    });

    it('point2line2distance', () => {
        expect(point2line2distance(
            { x: 4, y: 4 },
            { normal: { x: 0, y: 1 }, distance: 2 },
        )).toEqual(2);
        expect(point2line2distance(
            { x: 1, y: 1 },
            { normal: { x: 0, y: 1 }, distance: 2 },
        )).toEqual(-1);
        expect(point2line2distance(
            { x: 0, y: 2 },
            { normal: { x: 0, y: 1 }, distance: 2 },
        )).toEqual(0);
    });

    it('line2line2intersection', () => {
        expect(line2line2intersection(
            { normal: { x: 1, y: 1 }, distance: 3 },
            { normal: { x: 1, y: 1 }, distance: 4 },
        )).toEqual(null);
        expect(line2line2intersection(
            { normal: { x: 1, y: 1 }, distance: 3 },
            { normal: { x: 1, y: 1 }, distance: 3 },
        )).toEqual(null);
        expect(line2line2intersection(
            { normal: { x: 1, y: 0 }, distance: 4 },
            { normal: { x: 0, y: 1 }, distance: 2 },
        )).toBeVec2({ x: 4, y: 2 });
    });
});
