import type { Vec2 } from '../geometry/types/vec2';
import type { Mat4 } from '../geometry/types/mat4';
import type { Camera } from '../gl/camera';
import { clone4x4, apply4x4, frustum4x4 } from '../geometry/mat4';

/**
 * Makes view-projection matrix that covers only one pixel.
 * Useful for picking technique when single pixel data is required.
 * View matrix is the same with default scene view matrix.
 * Default perspective projection matrix is replaced with frustum projection matrix that
 * "covers" only one required pixel
 */
export function makePixelViewProjMat(camera: Camera, pixel: Vec2, mat: Mat4): void {
    // Calculate frustum from perspective parameters.
    // |top| = |bottom| = zNear * tan(fov / 2)
    // |left| = |right| = aspect * |top|
    const dy = camera.getZNear() * Math.tan(camera.getYFov() / 2);
    const dx = camera.getAspect() * dy;
    const { x: xViewport, y: yViewport } = camera.getViewportSize();
    // Full [left, right] * [bottom, top] range corresponds to [0, viewport_width] * [0, viewport_height] screen.
    // [0, W] -> [-dx, +dx] => x -> dx * (x * 2 / W - 1)
    // [0, H] -> [-dy, +dy] => y -> dy * (y * 2 / H - 1)
    // Select part that corresponds to a specific (x, y) pixel.
    // In an arbitrary n pixels range [0, n] i-th (0 <= i < n) pixel occupies [i, i + 1] range.
    const x1 = dx * (2 * pixel.x / xViewport - 1);
    const x2 = dx * (2 * (pixel.x + 1) / xViewport - 1);
    const y1 = dy * (2 * pixel.y / yViewport - 1);
    const y2 = dy * (2 * (pixel.y + 1) / yViewport - 1);

    clone4x4(camera.getViewMat(), mat);
    apply4x4(mat, frustum4x4, {
        left: x1, right: x2, bottom: y1, top: y2,
        zNear: camera.getZNear(), zFar: camera.getZFar(),
    });
}
