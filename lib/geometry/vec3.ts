export interface Vec3 {
    readonly x: number;
    readonly y: number;
    readonly z: number;
}

export class Vector3 implements Vec3 {
    readonly x: number;
    readonly y: number;
    readonly z: number;

    constructor(x: number, y: number, z: number) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
}

/** (0, 0, 0) */
export const ZERO3 = vec3(0, 0, 0);

export function vec3(x: number, y: number, z: number): Vec3 {
    return new Vector3(x, y, z);
}

export function isVec3(arg: unknown): arg is Vec3 {
    return 'x' in (arg as Vec3) && 'y' in (arg as Vec3) && 'z' in (arg as Vec3);
}

export function vec3arr(v: Vec3): [number, number, number] {
    return [v.x, v.y, v.z];
}
