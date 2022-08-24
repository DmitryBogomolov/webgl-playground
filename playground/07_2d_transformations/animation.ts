import {
    Vec2, vec2, mul2,
    Mat3, identity3x3, apply3x3, rotation3x3, translation3x3,
} from 'lib';

const PI2 = Math.PI * 2;

export interface Animation {
    (delta: number, mat: Mat3): void;
}

export function makeAnimation(size: Vec2, speed: number): Animation {
    const { x: rx, y: ry } = mul2(size, 0.5);
    let angle = 0;
    return (delta, mat) => {
        angle = (angle + delta * speed / 1000) % PI2;
        const position = vec2(rx * Math.cos(angle), ry * Math.sin(angle));
        identity3x3(mat);
        apply3x3(mat, rotation3x3, Math.atan2(position.y, position.x) - Math.PI / 2);
        apply3x3(mat, translation3x3, position);
    };
}
