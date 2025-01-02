import { OrbitCamera } from './orbit-camera';
import { perspective4x4, orthographic4x4, lookAt4x4, transpose4x4, mul4x4, inverse4x4 } from '../geometry/mat4';
import { quat4apply } from '../geometry/quat4';

describe('orbit-camera', () => {
    describe('OrbitCamera', () => {
        it('check rotation calculation', () => {
            const camera = new OrbitCamera();

            camera.setOrientation({ x: -2, y: 0, z: 1 }, { x: -1, y: 5, z: -2 });

            const quat = (camera as any)._rotationQuat;

            expect(quat4apply(quat, { x: 1, y: 0, z: 0 })).toBeVec3({ x: 0.40824829, y: 0.40824829, z: 0.81649658 });
            expect(quat4apply(quat, { x: 0, y: 1, z: 0 })).toBeVec3({ x: -0.18257419, y: 0.91287093, z: -0.36514837 });
            expect(quat4apply(quat, { x: 0, y: 0, z: 1 })).toBeVec3({ x: -0.89442719, y: 0, z: 0.4472136 });

            expect(quat4apply(quat, { x: 1, y: 1, z: 0 })).toBeVec3({ x: 0.2256741, y: 1.32111922, z: 0.45134821 });
            expect(quat4apply(quat, { x: 0, y: 1, z: 1 })).toBeVec3({ x: -1.07700138, y: 0.91287093, z: 0.08206522 });
            expect(quat4apply(quat, { x: 1, y: 0, z: 1 })).toBeVec3({ x: -0.4861789, y: 0.40824829, z: 1.26371018 });

            expect(quat4apply(quat, { x: 1, y: 1, z: 1 })).toBeVec3({ x: -0.66875309, y: 1.32111922, z: 0.8985618 });
        });
    });
});
