import { spherical2zxy, zxy2spherical } from './spherical';

describe('spherical', () => {
    const PI = Math.PI;
    const PI_2 = Math.PI / 2;

    it('spherical2zxy', () => {
        expect(spherical2zxy({ distance: 1, azimuth: 0, elevation: 0 })).toBeVec3({ x: 0, y: 0, z: +1 });
        expect(spherical2zxy({ distance: 2, azimuth: 2 * PI, elevation: 0 })).toBeVec3({ x: 0, y: 0, z: +2 });
        expect(spherical2zxy({ distance: 1, azimuth: +PI, elevation: 0 })).toBeVec3({ x: 0, y: 0, z: -1 });
        expect(spherical2zxy({ distance: 3, azimuth: -PI, elevation: 0 })).toBeVec3({ x: 0, y: 0, z: -3 });
        expect(spherical2zxy({ distance: 2, azimuth: +PI_2, elevation: 0 })).toBeVec3({ x: +2, y: 0, z: 0 });
        expect(spherical2zxy({ distance: 4, azimuth: -PI_2, elevation: 0 })).toBeVec3({ x: -4, y: 0, z: 0 });
        expect(spherical2zxy({ distance: 1, azimuth: 0, elevation: +PI_2 })).toBeVec3({ x: 0, y: +1, z: 0 });
        expect(spherical2zxy({ distance: 5, azimuth: 0, elevation: -PI_2 })).toBeVec3({ x: 0, y: -5, z: 0 });
    });

    it('zxy2spherical', () => {
        expect(zxy2spherical({ x: 0, y: 0, z: +1 })).toBeSpherical({ distance: 1, azimuth: 0, elevation: 0 });
        expect(zxy2spherical({ x: 0, y: 0, z: -2 })).toBeSpherical({ distance: 2, azimuth: PI, elevation: 0 });
        expect(zxy2spherical({ x: +3, y: 0, z: 0 })).toBeSpherical({ distance: 3, azimuth: +PI_2, elevation: 0 });
        expect(zxy2spherical({ x: -4, y: 0, z: 0 })).toBeSpherical({ distance: 4, azimuth: -PI_2, elevation: 0 });
        expect(zxy2spherical({ x: 0, y: +5, z: 0 })).toBeSpherical({ distance: 5, azimuth: 0, elevation: +PI_2 });
        expect(zxy2spherical({ x: 0, y: -6, z: 0 })).toBeSpherical({ distance: 6, azimuth: 0, elevation: -PI_2 });
    });
});
