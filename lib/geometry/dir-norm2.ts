import { Vec2 } from './types/vec2';
import { norm2, neg2 } from './vec2';

// Opposite vectors define same line direction. Pick one.
export function normalizeDirection2(direction: Vec2): Vec2 {
    const dir = norm2(direction);
    if (dir.x !== 0) {
        return dir.x > 0 ? dir : neg2(dir);
    }
    if (dir.y !== 0) {
        return dir.y > 0 ? dir : neg2(dir);
    }
    return dir;
}
