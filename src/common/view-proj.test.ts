import { ViewProj } from './view-proj';
import { perspective4x4, orthographic4x4, lookAt4x4, transpose4x4, mul4x4, inverse4x4 } from '../geometry/mat4';

describe('view-proj', () => {
    describe('ViewProj', () => {
        it('init perspective projection', () => {
            const vp = new ViewProj();

            expect(vp.getProjType()).toEqual('perspective');
            expect(vp.getZNear()).toEqual(0.01);
            expect(vp.getZFar()).toEqual(100);
            expect(vp.getYFov()).toEqual(Math.PI / 3);
            expect(vp.getViewportSize()).toBeVec2({ x: 2, y: 2 });
            expect(vp.getAspect()).toEqual(1);
            expect(vp.getProjMat()).toBeMat4(
                transpose4x4(perspective4x4({
                    aspect: 1,
                    yFov: Math.PI / 3,
                    zNear: 0.01,
                    zFar: 100,
                })),
            );
        });

        it('init orthographic projection', () => {
            const vp = new ViewProj();
            vp.setProjType('orthographic');

            expect(vp.getProjType()).toEqual('orthographic');
            expect(vp.getZNear()).toEqual(0.01);
            expect(vp.getZFar()).toEqual(100);
            expect(vp.getYFov()).toEqual(Math.PI / 3);
            expect(vp.getViewportSize()).toBeVec2({ x: 2, y: 2 });
            expect(vp.getAspect()).toEqual(1);
            expect(vp.getProjMat()).toBeMat4(
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
            const vp = new ViewProj();

            expect(vp.getCenterPos()).toBeVec3({ x: 0, y: 0, z: 0 });
            expect(vp.getUpDir()).toBeVec3({ x: 0, y: 1, z: 0 });
            expect(vp.getEyePos()).toBeVec3({ x: 0, y: 0, z: 1 });
            expect(vp.getViewMat()).toBeMat4(
                transpose4x4(lookAt4x4({
                    center: { x: 0, y: 0, z: 0 },
                    up: { x: 0, y: 1, z: 0 },
                    eye: { x: 0, y: 0, z: 1 },
                })),
            );
        });

        it('update projection', () => {
            const vp = new ViewProj();

            vp.setYFov(Math.PI / 4);
            vp.setZFar(1000);
            vp.setZNear(1);
            vp.setViewportSize({ x: 400, y: 300 });

            expect(vp.getYFov()).toEqual(Math.PI / 4);
            expect(vp.getZNear()).toEqual(1);
            expect(vp.getZFar()).toEqual(1000);
            expect(vp.getViewportSize()).toBeVec2({ x: 400, y: 300 });
            expect(vp.getAspect()).toEqual(4 / 3);
            expect(vp.getProjMat()).toBeMat4(
                transpose4x4(perspective4x4({
                    yFov: Math.PI / 4,
                    zNear: 1,
                    zFar: 1000,
                    aspect: 4 / 3,
                })),
            );
        });

        it('update view', () => {
            const vp = new ViewProj();

            vp.setEyePos({ x: 1, y: 8, z: 0 });
            vp.setCenterPos({ x: 2, y: 1, z: 1 });
            vp.setUpDir({ x: 1, y: 0, z: 2 });

            expect(vp.getEyePos()).toBeVec3({ x: 1, y: 8, z: 0 });
            expect(vp.getCenterPos()).toBeVec3({ x: 2, y: 1, z: 1 });
            expect(vp.getUpDir()).toBeVec3({ x: 0.4472, y: 0, z: 0.8944 });
            expect(vp.getViewMat()).toBeMat4(
                transpose4x4(lookAt4x4({
                    center: { x: 2, y: 1, z: 1 },
                    up: { x: 1, y: 0, z: 2 },
                    eye: { x: 1, y: 8, z: 0 },
                })),
            );
        });

        it('provide transform', () => {
            const vp = new ViewProj();
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

            vp.setYFov(Math.PI / 4);
            vp.setEyePos({ x: 1, y: 5, z: 2 });

            expect(vp.getTransformMat()).toBeMat4(
                transpose4x4(transform),
            );
            expect(vp.getInvtransformMat()).toBeMat4(
                transpose4x4(inverse4x4(transform)),
            );
        });

        it('provide view data', () => {
            const vp = new ViewProj();

            expect(vp.getXFov()).toEqual(Math.PI / 3);
            expect(vp.getYFov()).toEqual(Math.PI / 3);
            expect(vp.getViewDist()).toEqual(1);
            expect(vp.getXViewSize()).toBeCloseTo(1.1547);
            expect(vp.getYViewSize()).toBeCloseTo(1.1547);

            vp.setYFov(Math.PI / 4);
            vp.setViewportSize({ x: 800, y: 600 });
            vp.setEyePos({ x: 0, y: 3, z: 4 });

            expect(vp.getXFov()).toBeCloseTo(Math.PI * 0.3212);
            expect(vp.getYFov()).toEqual(Math.PI * 0.25);
            expect(vp.getViewDist()).toBeCloseTo(5);
            expect(vp.getXViewSize()).toBeCloseTo(5.5229);
            expect(vp.getYViewSize()).toBeCloseTo(4.1421);
        });

        it('emit changed event', () => {
            const vp = new ViewProj();
            let count = 0;
            vp.changed.on(() => {
                ++count;
            });

            vp.setCenterPos({ x: 1, y: 0, z: 0 });
            expect(count).toEqual(1);

            vp.setCenterPos({ x: 1, y: 0, z: 0 });
            expect(count).toEqual(1);

            vp.setCenterPos({ x: 1, y: 0, z: 1 });
            expect(count).toEqual(2);

            vp.setCenterPos({ x: 1, y: 0, z: 1 });
            expect(count).toEqual(2);

            vp.setViewportSize({ x: 200, y: 100 });
            expect(count).toEqual(3);
        });

        it('return actual state on changed event', () => {
            const vp = new ViewProj();
            let handler: () => void;
            vp.changed.on(() => {
                handler();
            });
            vp.getTransformMat();

            handler = () => {
                expect(vp.getTransformMat()).toBeMat4([
                    0, 0, -1.7321, 0,
                    -1.5492, 0.7746, 0, 0,
                    -0.4473, -0.8946, 0, 2.2165,
                    -0.4472, -0.8944, 0, 2.2361,
                ]);
            };
            vp.setEyePos({ x: 1, y: 2, z: 0 });

            handler = () => {
                expect(vp.getTransformMat()).toBeMat4([
                    0, 0, -1.7321, 0,
                    -1.5492, 0.7746, 0, 0,
                    -0.4481, -0.8962, 0, 2.2205,
                    -0.4472, -0.8944, 0, 2.2361,
                ]);
            };
            vp.setZFar(10);
        });
    });
});
