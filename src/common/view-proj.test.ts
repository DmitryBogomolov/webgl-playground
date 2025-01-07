import { ViewProj } from './view-proj';
import { perspective4x4, orthographic4x4, lookAt4x4, transpose4x4, mul4x4, inverse4x4 } from '../geometry/mat4';

describe('view-proj', () => {
    describe('ViewProj', () => {
        it('init perspective projection', () => {
            const viewProj = new ViewProj();

            expect(viewProj.getProjType()).toEqual('perspective');
            expect(viewProj.getZNear()).toEqual(0.01);
            expect(viewProj.getZFar()).toEqual(100);
            expect(viewProj.getYFov()).toEqual(Math.PI / 3);
            expect(viewProj.getViewportSize()).toBeVec2({ x: 2, y: 2 });
            expect(viewProj.getAspect()).toEqual(1);
            expect(viewProj.getProjMat()).toBeMat4(
                transpose4x4(perspective4x4({
                    aspect: 1,
                    yFov: Math.PI / 3,
                    zNear: 0.01,
                    zFar: 100,
                })),
            );
        });

        it('init orthographic projection', () => {
            const viewProj = new ViewProj();
            viewProj.setProjType('orthographic');

            expect(viewProj.getProjType()).toEqual('orthographic');
            expect(viewProj.getZNear()).toEqual(0.01);
            expect(viewProj.getZFar()).toEqual(100);
            expect(viewProj.getYFov()).toEqual(Math.PI / 3);
            expect(viewProj.getViewportSize()).toBeVec2({ x: 2, y: 2 });
            expect(viewProj.getAspect()).toEqual(1);
            expect(viewProj.getProjMat()).toBeMat4(
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
            const viewProj = new ViewProj();

            expect(viewProj.getCenterPos()).toBeVec3({ x: 0, y: 0, z: 0 });
            expect(viewProj.getUpDir()).toBeVec3({ x: 0, y: 1, z: 0 });
            expect(viewProj.getEyePos()).toBeVec3({ x: 0, y: 0, z: 1 });
            expect(viewProj.getViewMat()).toBeMat4(
                transpose4x4(lookAt4x4({
                    center: { x: 0, y: 0, z: 0 },
                    up: { x: 0, y: 1, z: 0 },
                    eye: { x: 0, y: 0, z: 1 },
                })),
            );
        });

        it('update projection', () => {
            const viewProj = new ViewProj();

            viewProj.setYFov(Math.PI / 4);
            viewProj.setZFar(1000);
            viewProj.setZNear(1);
            viewProj.setViewportSize({ x: 400, y: 300 });

            expect(viewProj.getYFov()).toEqual(Math.PI / 4);
            expect(viewProj.getZNear()).toEqual(1);
            expect(viewProj.getZFar()).toEqual(1000);
            expect(viewProj.getViewportSize()).toBeVec2({ x: 400, y: 300 });
            expect(viewProj.getAspect()).toEqual(4 / 3);
            expect(viewProj.getProjMat()).toBeMat4(
                transpose4x4(perspective4x4({
                    yFov: Math.PI / 4,
                    zNear: 1,
                    zFar: 1000,
                    aspect: 4 / 3,
                })),
            );
        });

        it('update view', () => {
            const viewProj = new ViewProj();

            viewProj.setEyePos({ x: 1, y: 8, z: 0 });
            viewProj.setCenterPos({ x: 2, y: 1, z: 1 });
            viewProj.setUpDir({ x: 1, y: 0, z: 2 });

            expect(viewProj.getEyePos()).toBeVec3({ x: 1, y: 8, z: 0 });
            expect(viewProj.getCenterPos()).toBeVec3({ x: 2, y: 1, z: 1 });
            expect(viewProj.getUpDir()).toBeVec3({ x: 0.4472, y: 0, z: 0.8944 });
            expect(viewProj.getViewMat()).toBeMat4(
                transpose4x4(lookAt4x4({
                    center: { x: 2, y: 1, z: 1 },
                    up: { x: 1, y: 0, z: 2 },
                    eye: { x: 1, y: 8, z: 0 },
                })),
            );
        });

        it('provide transform', () => {
            const viewProj = new ViewProj();
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

            viewProj.setYFov(Math.PI / 4);
            viewProj.setEyePos({ x: 1, y: 5, z: 2 });

            expect(viewProj.getTransformMat()).toBeMat4(
                transpose4x4(transform),
            );
            expect(viewProj.getInvtransformMat()).toBeMat4(
                transpose4x4(inverse4x4(transform)),
            );
        });

        it('provide view data', () => {
            const viewProj = new ViewProj();

            expect(viewProj.getXFov()).toEqual(Math.PI / 3);
            expect(viewProj.getYFov()).toEqual(Math.PI / 3);
            expect(viewProj.getViewDist()).toEqual(1);
            expect(viewProj.getXViewSize()).toBeCloseTo(1.1547);
            expect(viewProj.getYViewSize()).toBeCloseTo(1.1547);

            viewProj.setYFov(Math.PI / 4);
            viewProj.setViewportSize({ x: 800, y: 600 });
            viewProj.setEyePos({ x: 0, y: 3, z: 4 });

            expect(viewProj.getXFov()).toBeCloseTo(Math.PI * 0.3212);
            expect(viewProj.getYFov()).toEqual(Math.PI * 0.25);
            expect(viewProj.getViewDist()).toBeCloseTo(5);
            expect(viewProj.getXViewSize()).toBeCloseTo(5.5229);
            expect(viewProj.getYViewSize()).toBeCloseTo(4.1421);
        });

        it('emit changed event', () => {
            const viewProj = new ViewProj();
            let count = 0;
            viewProj.changed().on(() => {
                ++count;
            });

            viewProj.setCenterPos({ x: 1, y: 0, z: 0 });
            expect(count).toEqual(1);

            viewProj.setCenterPos({ x: 1, y: 0, z: 0 });
            expect(count).toEqual(1);

            viewProj.setCenterPos({ x: 1, y: 0, z: 1 });
            expect(count).toEqual(2);

            viewProj.setCenterPos({ x: 1, y: 0, z: 1 });
            expect(count).toEqual(2);

            viewProj.setViewportSize({ x: 200, y: 100 });
            expect(count).toEqual(3);
        });

        it('return actual state on changed event', () => {
            const viewProj = new ViewProj();
            let handler: () => void;
            viewProj.changed().on(() => {
                handler();
            });
            viewProj.getTransformMat();

            handler = () => {
                expect(viewProj.getTransformMat()).toBeMat4([
                    0, 0, -1.7321, 0,
                    -1.5492, 0.7746, 0, 0,
                    -0.4473, -0.8946, 0, 2.2165,
                    -0.4472, -0.8944, 0, 2.2361,
                ]);
            };
            viewProj.setEyePos({ x: 1, y: 2, z: 0 });

            handler = () => {
                expect(viewProj.getTransformMat()).toBeMat4([
                    0, 0, -1.7321, 0,
                    -1.5492, 0.7746, 0, 0,
                    -0.4481, -0.8962, 0, 2.2205,
                    -0.4472, -0.8944, 0, 2.2361,
                ]);
            };
            viewProj.setZFar(10);
        });
    });
});
