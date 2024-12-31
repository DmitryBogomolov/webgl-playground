import type { Mat4Mut } from '../geometry/mat4.types';
import { makePixelViewProjMat } from './pixel-view-proj-mat';
import { ViewProj } from '../common/view-proj';
import { mat4 } from '../geometry/mat4';

describe('pixel-view-proj-mat', () => {
    it('make matrix', () => {
        const mat = mat4();
        const viewProj = new ViewProj();
        viewProj.setViewportSize({ x: 640, y: 480 });

        makePixelViewProjMat(viewProj, { x: 320, y: 240 }, mat as Mat4Mut);
        expect(mat).toBeMat4([
            831.3844, 0, 1, -1,
            0, 831.3844, 1, -1,
            0, 0, -1.0002, 0.9802,
            0, 0, -1, 1,
        ]);

        makePixelViewProjMat(viewProj, { x: 20, y: 230 }, mat as Mat4Mut);
        expect(mat).toBeMat4([
            831.3844, 0, -599, 599,
            0, 831.3844, -19, 19,
            0, 0, -1.0002, 0.9802,
            0, 0, -1, 1,
        ]);

        makePixelViewProjMat(viewProj, { x: 620, y: 10 }, mat as Mat4Mut);
        expect(mat).toBeMat4([
            831.3844, 0, 601, -601,
            0, 831.3844, -459, 459,
            0, 0, -1.0002, 0.9802,
            0, 0, -1, 1,
        ]);
    });
});
