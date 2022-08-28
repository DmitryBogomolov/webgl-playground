import { Camera } from './camera';
import { perspective4x4, lookAt4x4, transpose4x4 } from '../geometry/mat4';

describe('camera', () => {
    describe('Camera', () => {
        it('initial projection', () => {
            const camera = new Camera();

            expect(camera.getProjType()).toEqual('perspective');
            expect(camera.getZNear()).toEqual(0.01);
            expect(camera.getZFar()).toEqual(100);
            expect(camera.getYFov()).toEqual(Math.PI / 3);
            expect(camera.getViewportSize()).toBeVec2({ x: 2, y: 2 });
            expect(camera.getProjMat()).toBeMat4(
                transpose4x4(perspective4x4({
                    aspect: 1,
                    yFov: Math.PI / 3,
                    zNear: 0.01,
                    zFar: 100,
                })) as ReadonlyArray<number>
            );
        });

        it('initial view', () => {
            const camera = new Camera();

            expect(camera.getCenterPos()).toBeVec3({ x: 0, y: 0, z: 0 });
            expect(camera.getUpDir()).toBeVec3({ x: 0, y: 1, z: 0 });
            expect(camera.getEyePos()).toBeVec3({ x: 0, y: 0, z: 1 });
            expect(camera.getViewMat()).toBeMat4(
                transpose4x4(lookAt4x4({
                    center: { x: 0, y: 0, z: 0 },
                    up: { x: 0, y: 1, z: 0 },
                    eye: { x: 0, y: 0, z: 1 },
                })) as ReadonlyArray<number>
            );
        });
    });
});
