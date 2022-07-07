import {
    Vec2,
    vec2,
} from 'lib';

const PI2 = Math.PI * 2;

export interface Animation {
    (delta: number): Vec2;
}

export function makeAnimation(size: Vec2, speed: number): Animation {
    const rx = size.x / 2;
    const ry = size.y / 2;
    let angle = 0;
    return (delta) => {
        angle = (angle + delta * speed / 1000) % PI2;
        return vec2(rx * Math.cos(angle), ry * Math.sin(angle));
    };
}
