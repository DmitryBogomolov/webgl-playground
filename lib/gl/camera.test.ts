import { Camera } from './camera';
import { perspective4x4, orthographic4x4, lookAt4x4, transpose4x4, mul4x4, inverse4x4 } from '../geometry/mat4';

describe('camera', () => {
    describe('Camera', () => {
        it('init perspective projection', () => {
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
                })),
            );
        });

        it('init orthographic projection', () => {
            const camera = new Camera();
            camera.setProjType('orthographic');

            expect(camera.getProjType()).toEqual('orthographic');
            expect(camera.getZNear()).toEqual(0.01);
            expect(camera.getZFar()).toEqual(100);
            expect(camera.getYFov()).toEqual(Math.PI / 3);
            expect(camera.getViewportSize()).toBeVec2({ x: 2, y: 2 });
            expect(camera.getProjMat()).toBeMat4(
                transpose4x4(orthographic4x4({
                    zNear: 0.01,
                    zFar: 100,
                    left: -1,
                    right: +1,
                    bottom: -1,
                    top: +1,
                })),
            );
        });

        it('init view', () => {
            const camera = new Camera();

            expect(camera.getCenterPos()).toBeVec3({ x: 0, y: 0, z: 0 });
            expect(camera.getUpDir()).toBeVec3({ x: 0, y: 1, z: 0 });
            expect(camera.getEyePos()).toBeVec3({ x: 0, y: 0, z: 1 });
            expect(camera.getViewMat()).toBeMat4(
                transpose4x4(lookAt4x4({
                    center: { x: 0, y: 0, z: 0 },
                    up: { x: 0, y: 1, z: 0 },
                    eye: { x: 0, y: 0, z: 1 },
                })),
            );
        });

        it('update projection', () => {
            const camera = new Camera();

            camera.setYFov(Math.PI / 4);
            camera.setZFar(1000);
            camera.setZNear(1);
            camera.setViewportSize({ x: 400, y: 300 });

            expect(camera.getYFov()).toEqual(Math.PI / 4);
            expect(camera.getZNear()).toEqual(1);
            expect(camera.getZFar()).toEqual(1000);
            expect(camera.getViewportSize()).toBeVec2({ x: 400, y: 300 });
            expect(camera.getProjMat()).toBeMat4(
                transpose4x4(perspective4x4({
                    yFov: Math.PI / 4,
                    zNear: 1,
                    zFar: 1000,
                    aspect: 4 / 3,
                })),
            );
        });

        it('update view', () => {
            const camera = new Camera();

            camera.setEyePos({ x: 1, y: 8, z: 0 });
            camera.setCenterPos({ x: 2, y: 1, z: 1 });
            camera.setUpDir({ x: 1, y: 0, z: 2 });

            expect(camera.getEyePos()).toBeVec3({ x: 1, y: 8, z: 0 });
            expect(camera.getCenterPos()).toBeVec3({ x: 2, y: 1, z: 1 });
            expect(camera.getUpDir()).toBeVec3({ x: 0.4472, y: 0, z: 0.8944 });
            expect(camera.getViewMat()).toBeMat4(
                transpose4x4(lookAt4x4({
                    center: { x: 2, y: 1, z: 1 },
                    up: { x: 1, y: 0, z: 2 },
                    eye: { x: 1, y: 8, z: 0 },
                })),
            );
        });

        it('provide transform', () => {
            const camera = new Camera();
            const transform = mul4x4(
                perspective4x4({
                    yFov: Math.PI / 4,
                    zNear: 0.01,
                    zFar: 100,
                    aspect: 1,
                }),
                lookAt4x4({
                    eye: { x: 1, y: 5, z: 2 },
                    center: { x: 0, y: 0, z: 0 },
                    up: { x: 0, y: 1, z: 0 },
                }),
            );

            camera.setYFov(Math.PI / 4);
            camera.setEyePos({ x: 1, y: 5, z: 2 });

            expect(camera.getTransformMat()).toBeMat4(
                transpose4x4(transform),
            );
            expect(camera.getInvtransformMat()).toBeMat4(
                transpose4x4(inverse4x4(transform)),
            );
        });
    });
});
