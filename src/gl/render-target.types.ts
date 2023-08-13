import type { Vec2 } from '../geometry/vec2.types';

export interface RenderTarget {
    id(): string;
    size(): Vec2;
}
