import {
    OX3, OY3, OZ3, line3, line3eq,
} from './line3';

describe('line3', () => {
    it('constants', () => {
        expect(line3eq(OX3, { direction: { x: 1, y: 0, z: 0 }, anchor: { x: 0, y: 0, z: 0 } })).toEqual(true);
        expect(line3eq(OY3, { direction: { x: 0, y: 1, z: 0 }, anchor: { x: 0, y: 0, z: 0 } })).toEqual(true);
        expect(line3eq(OZ3, { direction: { x: 0, y: 0, z: 1 }, anchor: { x: 0, y: 0, z: 0 } })).toEqual(true);
    });

    it('line3eq', () => {
        expect(line3eq(
            { direction: { x: 1, y: 2, z: 3 }, anchor: { x: 1, y: 2, z: 3 } },
            { direction: { x: 2, y: 3, z: 4 }, anchor: { x: 1, y: 2, z: 3 } },
        )).toEqual(false);
        expect(line3eq(
            { direction: { x: 1, y: 2, z: 3 }, anchor: { x: 1, y: 2, z: 3 } },
            { direction: { x: 1, y: 2, z: 3 }, anchor: { x: 2, y: 3, z: 4 } },
        )).toEqual(false);
        expect(line3eq(
            { direction: { x: 1, y: 2, z: 3 }, anchor: { x: 2, y: 3, z: 4 } },
            { direction: { x: 1, y: 2, z: 3 }, anchor: { x: 2, y: 3, z: 4 } },
        )).toEqual(true);
    });

    it('normalization', () => {
        expect(line3eq(
            line3({ x: -4, y: 0, z: 0 }, { x: 1, y: 2, z: 3 }),
            { direction: { x: 1, y: 0, z: 0 }, anchor: { x: 0, y: 2, z: 3 } },
        )).toEqual(true);
        expect(line3eq(
            line3({ x: 0, y: -3, z: 0 }, { x: 1, y: 2, z: 3 }),
            { direction: { x: 0, y: -1, z: 0 }, anchor: { x: 1, y: 0, z: 3 } },
        )).toEqual(true);
        expect(line3eq(
            line3({ x: 0, y: 0, z: -2 }, { x: 1, y: 2, z: 3 }),
            { direction: { x: 0, y: 0, z: -1 }, anchor: { x: 1, y: 2, z: 0 } },
        )).toEqual(true);
    });
});
