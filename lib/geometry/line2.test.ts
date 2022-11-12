import {
    OX2, OY2, line2, line2eq, line2ofPoints,
} from './line2';

describe('line2', () => {
    it('constants', () => {
        expect(line2eq(OX2, { normal: { x: 1, y: 0 }, distance: 0 })).toEqual(true);
        expect(line2eq(OY2, { normal: { x: 0, y: 1 }, distance: 0 })).toEqual(true);
    });

    it('line2eq', () => {
        expect(line2eq(
            { normal: { x: 1, y: 2 }, distance: 3 },
            { normal: { x: 2, y: 3 }, distance: 3 },
        )).toEqual(false);
        expect(line2eq(
            { normal: { x: 1, y: 2 }, distance: 3 },
            { normal: { x: 1, y: 2 }, distance: 4 },
        )).toEqual(false);
        expect(line2eq(
            { normal: { x: 1, y: 2 }, distance: 3 },
            { normal: { x: 1, y: 2 }, distance: 3 },
        )).toEqual(true);
    });

    it('normalization', () => {
        expect(line2eq(
            line2({ x: -4, y: 0 }, 4),
            { normal: { x: 1, y: 0 }, distance: -4 },
        )).toEqual(true);
        expect(line2eq(
            line2({ x: 0, y: 3 }, 5),
            { normal: { x: 0, y: 1 }, distance: 5 },
        )).toEqual(true);
    });

    it('line2ofPoints', () => {
        expect(line2eq(
            line2ofPoints({ x: 1, y: 4 }, { x: 1, y: 0 }),
            { normal: { x: 1, y: 0 }, distance: 1 },
        )).toEqual(true);
    });
});
