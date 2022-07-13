import { zero4x4, identity4x4, det4x4, update4x4 } from './mat4';

describe('mat4', () => {
    it('det4x4', () => {
        expect(det4x4(zero4x4())).toEqual(0);
        expect(det4x4(identity4x4())).toEqual(1);
        expect(det4x4(update4x4([
            2, 0, 0, 0,
            0, 3, 0, 0,
            0, 0, 4, 0,
            0, 0, 0, 5,
        ]))).toEqual(120);
        expect(det4x4(update4x4([
            1, 0, 0, 0,
            0, 0, 1, 0,
            0, 0, 2, 0,
            0, 0, 0, 1,
        ]))).toEqual(0);
        expect(det4x4(update4x4([
            1, 2, 1, 2,
            3, 0, 1, 0,
            1, 4, 4, 0,
            1, 2, 1, 1,
        ]))).toEqual(14);
    });
});
