import type { Vec2 } from '../../geometry/types/vec2';

export interface RenderTarget {
    id(): string;
    size(): Vec2;
}
