import type { Vec2, Vec2Mut } from '../geometry/vec2.types';
import { vec2, add2, sub2, mul2, mulc2, divc2 } from '../geometry/vec2';

const NDC_PX_ADD = vec2(1, 1);
const NDC_PX_MUL = vec2(+1, -1);

export function ndc2px(ndc: Vec2, size: Vec2, out: Vec2Mut = vec2(0, 0) as Vec2Mut): Vec2 {
    // x' = (+x + 1) / 2 * size_x
    // y' = (-y + 1) / 2 * size_y
    mulc2(ndc, NDC_PX_MUL, out);
    add2(out, NDC_PX_ADD, out);
    mul2(out, 0.5, out);
    return mulc2(out, size, out);
}

export function px2ndc(px: Vec2, size: Vec2, out: Vec2Mut = vec2(0, 0) as Vec2Mut): Vec2 {
    // x' = 2 * +x / size_x - 1
    // y' = 2 * -y / size_y + 1
    divc2(px, size, out);
    mul2(out, 2, out);
    sub2(out, NDC_PX_ADD, out);
    return mulc2(out, NDC_PX_MUL, out);
}
