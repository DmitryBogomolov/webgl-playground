import {
    OX2, OY2, line2, line2eq, line2ofPoints,
} from './line2';

describe('line2', () => {
    it('constants', () => {
        expect(line2eq(OX2, { direction: { x: 1, y: 0 }, anchor: { x: 0, y: 0 } })).toEqual(true);
        expect(line2eq(OY2, { direction: { x: 0, y: 1 }, anchor: { x: 0, y: 0 } })).toEqual(true);
    });

    it('line2eq', () => {
        expect(line2eq(
            { direction: { x: 1, y: 2 }, anchor: { x: 1, y: 2 } },
            { direction: { x: 2, y: 3 }, anchor: { x: 1, y: 2 } },
        )).toEqual(false);
        expect(line2eq(
            { direction: { x: 1, y: 2 }, anchor: { x: 1, y: 2 } },
            { direction: { x: 1, y: 2 }, anchor: { x: 2, y: 3 } },
        )).toEqual(false);
        expect(line2eq(
            { direction: { x: 1, y: 2 }, anchor: { x: 2, y: 3 } },
            { direction: { x: 1, y: 2 }, anchor: { x: 2, y: 3 } },
        )).toEqual(true);
    });

    it('normalization', () => {
        expect(line2eq(
            line2({ x: -4, y: 0 }, { x: 1, y: 2 }),
            { direction: { x: 1, y: 0 }, anchor: { x: 0, y: 2 } },
        )).toEqual(true);
        expect(line2eq(
            line2({ x: 0, y: -3 }, { x: 1, y: 2 }),
            { direction: { x: 0, y: 1 }, anchor: { x: 1, y: 0 } },
        )).toEqual(true);
    });

    it('line2ofPoints', () => {
        expect(line2eq(
            line2ofPoints({ x: 1, y: 4 }, { x: 1, y: 0 }),
            { direction: { x: 0, y: 1 }, anchor: { x: 1, y: 0 } },
        )).toEqual(true);
    });
});
