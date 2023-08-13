import { deg2rad, rad2deg } from './deg-rad';

describe('deg-rad', () => {
    it('deg2rad', () => {
        expect(deg2rad(0)).toBeCloseTo(0);
        expect(deg2rad(30)).toBeCloseTo(Math.PI / 6);
        expect(deg2rad(45)).toBeCloseTo(Math.PI / 4);
        expect(deg2rad(60)).toBeCloseTo(Math.PI / 3);
        expect(deg2rad(90)).toBeCloseTo(Math.PI / 2);
        expect(deg2rad(180)).toBeCloseTo(Math.PI);
        expect(deg2rad(270)).toBeCloseTo(Math.PI * 1.5);
        expect(deg2rad(360)).toBeCloseTo(Math.PI * 2);
    });

    it('rad2deg', () => {
        expect(rad2deg(0)).toBeCloseTo(0);
        expect(rad2deg(Math.PI / 6)).toBeCloseTo(30);
        expect(rad2deg(Math.PI / 4)).toBeCloseTo(45);
        expect(rad2deg(Math.PI / 3)).toBeCloseTo(60);
        expect(rad2deg(Math.PI / 2)).toBeCloseTo(90);
        expect(rad2deg(Math.PI)).toBeCloseTo(180);
        expect(rad2deg(Math.PI * 1.5)).toBeCloseTo(270);
        expect(rad2deg(Math.PI * 2)).toBeCloseTo(360);
    });
});
