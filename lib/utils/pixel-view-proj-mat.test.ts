import type { Mat4Mut } from '../geometry/mat4.types';
import { makePixelViewProjMat } from './pixel-view-proj-mat';
import { Camera } from '../common/camera';
import { mat4 } from '../geometry/mat4';

describe('pixel-view-proj-mat', () => {
    it('make matrix', () => {
        const mat = mat4();
        const camera = new Camera();
        camera.setViewportSize({ x: 640, y: 480 });

        makePixelViewProjMat(camera, { x: 320, y: 240 }, mat as Mat4Mut);
        expect(mat).toBeMat4([
            831.3844, 0, 1, -1,
            0, 831.3844, 1, -1,
            0, 0, -1.0002, 0.9802,
            0, 0, -1, 1,
        ]);

        makePixelViewProjMat(camera, { x: 20, y: 230 }, mat as Mat4Mut);
        expect(mat).toBeMat4([
            831.3844, 0, -599, 599,
            0, 831.3844, -19, 19,
            0, 0, -1.0002, 0.9802,
            0, 0, -1, 1,
        ]);

        makePixelViewProjMat(camera, { x: 620, y: 10 }, mat as Mat4Mut);
        expect(mat).toBeMat4([
            831.3844, 0, 601, -601,
            0, 831.3844, -459, 459,
            0, 0, -1.0002, 0.9802,
            0, 0, -1, 1,
        ]);
    });
});
