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
    (delta: number, mat: Mat3): void;
}

export function makeAnimation(size: Vec2, speed: number): Animation {
    const rx = size.x / 2;
    const ry = size.y / 2;
    let angle = 0;
    return (delta, mat) => {
        angle = (angle + delta * speed / 1000) % PI2;
        const position = vec2(rx * Math.cos(angle), ry * Math.sin(angle));
        identity3x3(mat);
        rotate3x3(mat, Math.atan2(position.y, position.x) - Math.PI / 2);
        translate3x3(mat, position);
    };
}
