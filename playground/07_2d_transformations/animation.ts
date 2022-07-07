import {
    Vec2,
    vec2,
    Mat3,
    identity3x3,
    rotate3x3,
    translate3x3,
} from 'lib';

const PI2 = Math.PI * 2;

export interface Animation {
    (delta: number): Mat3;
}

export function makeAnimation(size: Vec2, speed: number): Animation {
    const rx = size.x / 2;
    const ry = size.y / 2;
    let angle = 0;
    return (delta) => {
        angle = (angle + delta * speed / 1000) % PI2;
        const position = vec2(rx * Math.cos(angle), ry * Math.sin(angle));
        const mat = identity3x3();
        rotate3x3(mat, Math.atan2(position.y, position.x) - Math.PI / 2);
        translate3x3(mat, position);
        return mat;
    };
}
