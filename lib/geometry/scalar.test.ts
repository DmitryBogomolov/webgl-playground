import {
    deg2rad, rad2deg,
    fovDist2Size, fovSize2Dist,
    linearMapping,
} from './scalar';

describe('scalar', () => {
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

    it('fovDist2Size', () => {
        expect(fovDist2Size(Math.PI / 4, 1)).toBeCloseTo(0.8284);
        expect(fovDist2Size(Math.PI / 4, 1.2071)).toBeCloseTo(1);
    });

    it('fovSize2Dist', () => {
        expect(fovSize2Dist(Math.PI / 4, 1)).toBeCloseTo(1.2071);
        expect(fovSize2Dist(Math.PI / 4, 0.8284)).toBeCloseTo(1);
    });

    it('linear mapping', () => {
        const func = linearMapping(0, 10, -1, +1);
        expect(func(0)).toEqual(-1);
        expect(func(10)).toEqual(1);
        expect(func(5)).toEqual(0);
        expect(func(1)).toEqual(-0.8);
        expect(func(9)).toEqual(0.8);
    });
});
