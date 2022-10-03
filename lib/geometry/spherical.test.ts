import { spherical2zxy, zxy2spherical } from './spherical';

describe('spherical', () => {
    const PI = Math.PI;
    const PI_2 = Math.PI / 2;

    it('spherical2zxy', () => {
        expect(spherical2zxy({ azimuth: 0, elevation: 0 })).toBeVec3({ x: 0, y: 0, z: +1 });
        expect(spherical2zxy({ azimuth: 2 * PI, elevation: 0 })).toBeVec3({ x: 0, y: 0, z: +1 });
        expect(spherical2zxy({ azimuth: +PI, elevation: 0 })).toBeVec3({ x: 0, y: 0, z: -1 });
        expect(spherical2zxy({ azimuth: -PI, elevation: 0 })).toBeVec3({ x: 0, y: 0, z: -1 });
        expect(spherical2zxy({ azimuth: +PI_2, elevation: 0 })).toBeVec3({ x: +1, y: 0, z: 0 });
        expect(spherical2zxy({ azimuth: -PI_2, elevation: 0 })).toBeVec3({ x: -1, y: 0, z: 0 });
        expect(spherical2zxy({ azimuth: 0, elevation: +PI_2 })).toBeVec3({ x: 0, y: +1, z: 0 });
        expect(spherical2zxy({ azimuth: 0, elevation: -PI_2 })).toBeVec3({ x: 0, y: -1, z: 0 });
    });

    it('zxy2spherical', () => {
        expect(zxy2spherical({ x: 0, y: 0, z: +1 })).toBeSpherical({ azimuth: 0, elevation: 0 });
        expect(zxy2spherical({ x: 0, y: 0, z: -1 })).toBeSpherical({ azimuth: PI, elevation: 0 });
        expect(zxy2spherical({ x: +1, y: 0, z: 0 })).toBeSpherical({ azimuth: +PI_2, elevation: 0 });
        expect(zxy2spherical({ x: -1, y: 0, z: 0 })).toBeSpherical({ azimuth: -PI_2, elevation: 0 });
        expect(zxy2spherical({ x: 0, y: +1, z: 0 })).toBeSpherical({ azimuth: 0, elevation: +PI_2 });
        expect(zxy2spherical({ x: 0, y: -1, z: 0 })).toBeSpherical({ azimuth: 0, elevation: -PI_2 });
    });
});
