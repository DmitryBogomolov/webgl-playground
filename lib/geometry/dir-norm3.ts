import { Vec3 } from './vec3.types';
import { norm3, neg3 } from './vec3';

// Opposite vectors define same line direction or plane normal. Pick one.
export function normalizeDirection3(direction: Vec3): Vec3 {
    const dir = norm3(direction);
    if (dir.x !== 0) {
        return dir.x > 0 ? dir : neg3(dir);
    }
    if (dir.y !== 0) {
        return dir.y > 0 ? dir : neg3(dir);
    }
    if (dir.z !== 0) {
        return dir.z > 0 ? dir : neg3(dir);
    }
    return dir;
}
