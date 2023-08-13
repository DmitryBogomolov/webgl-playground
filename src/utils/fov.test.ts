import { fovDist2Size, fovSize2Dist } from './fov';

describe('fov', () => {
    it('fovDist2Size', () => {
        expect(fovDist2Size(Math.PI / 4, 1)).toBeCloseTo(0.8284);
        expect(fovDist2Size(Math.PI / 4, 1.2071)).toBeCloseTo(1);
    });

    it('fovSize2Dist', () => {
        expect(fovSize2Dist(Math.PI / 4, 1)).toBeCloseTo(1.2071);
        expect(fovSize2Dist(Math.PI / 4, 0.8284)).toBeCloseTo(1);
    });
});
