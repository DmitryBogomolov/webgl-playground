import { OrbitCamera } from './orbit-camera';
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

        it('initial state', () => {
            const camera = new OrbitCamera();

            expect(camera.getCenterPos()).toBeVec3({ x: 0, y: 0, z: 0 });
            expect(camera.getUpDir()).toBeVec3({ x: 0, y: 1, z: 0 });
            expect(camera.getOriginDir()).toBeVec3({ x: 0, y: 0, z: 1 });
            expect(camera.getEyePos()).toBeVec3({ x: 0, y: 0, z: 1 });

            expect(camera.getLon()).toEqual(0);
            expect(camera.getLat()).toEqual(0);
            expect(camera.getDist()).toEqual(1);
        });

        it('set orientation', () => {
            const camera = new OrbitCamera();
            const stub = jest.fn();
            camera.changed().on(stub);

            camera.setOrientation({ x: 1, y: 1, z: 1 });

            expect(stub.mock.calls.length).toEqual(1);
            expect(camera.getOriginDir()).toBeVec3({ x: 0.5774, y: 0.5774, z: 0.5774 });
            expect(camera.getUpDir()).toBeVec3({ x: -0.4082, y: 0.8165, z: -0.4082 });
            // expect(camera.getEyePos()).toBeVec3();

            camera.setOrientation({ x: 5, y: 0, z: 1 }, { x: 0, y: -2, z: 0 });

            expect(stub.mock.calls.length).toEqual(2);
            expect(camera.getOriginDir()).toBeVec3({ x: 0.9806, y: 0, z: 0.1961 });
            expect(camera.getUpDir()).toBeVec3({ x: 0, y: -1, z: 0 });
            // expect(camera.getEyePos()).toBeVec3();

            // camera.setOrientation({ x: 0, y: 0, z: 1 });
        });

        it('set position', () => {
            const camera = new OrbitCamera();
            const stub = jest.fn();
            camera.changed().on(stub);

            camera.setPosition({
                dist: 2,
            });

            expect(camera.getEyePos()).toBeVec3({ x: 0, y: 0, z: 2 });

            camera.setPosition({
                lon: Math.PI / 6,
            });

            expect(camera.getEyePos()).toBeVec3({ x: 1, y: 0, z: 1.7321 });

            camera.setPosition({
                lat: Math.PI / 4,
            });

            expect(camera.getEyePos()).toBeVec3({ x: 0.7071, y: 1.4142, z: 1.2247 });

            // camera.setOrientation({ x: 1, y: 0, z: 0 });
            // expect(camera.getEyePos()).toBeVec3({ x: 0.7071, y: 1.4142, z: 1.2247 });

            // camera.setOrientation({ x: 0, y: 0, z: 1 }, { x: 1, y: 0, z: 0 });
            // expect(camera.getEyePos()).toBeVec3({ x: 0.7071, y: 1.4142, z: 1.2247 });
        });
    });
});
