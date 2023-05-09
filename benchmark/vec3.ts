// @ts-ignore
const SAMPLE_COUNT = 1E4;

// @ts-ignore
function measure(callback: (i: number) => void): number {
    const start = Date.now();
    for (let i = 0; i < SAMPLE_COUNT; ++i) {
        callback(i);
    }
    const end = Date.now();
    return end - start;
}

interface Vec3 {
    readonly x: number;
    readonly y: number;
    readonly z: number;
}

class Vec3Cls implements Vec3 {
    readonly x: number;
    readonly y: number;
    readonly z: number;
    constructor(x: number, y: number, z: number) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
}

function v3(x: number, y: number, z: number): Vec3 {
    return new Vec3Cls(x, y, z);
}

function f1(v: Vec3, k: number): Vec3 {
    return v3(v.x * k, v.y * k, v.z * k);
}

function f1x(v: Vec3, k: number, out: Vec3): void {
    const x = v.x * k;
    const y = v.y * k;
    const z = v.z * k;
    (out as any).x = x;
    (out as any).y = y;
    (out as any).z = z;
}

function f1z(v: Vec3, k: number, out: Vec3 = v3(0, 0, 0)): Vec3 {
    const x = v.x * k;
    const y = v.y * k;
    const z = v.z * k;
    (out as any).x = x;
    (out as any).y = y;
    (out as any).z = z;
    return out;
}

function f2(a: Vec3, b: Vec3): Vec3 {
    return v3(a.x + b.x, a.y + b.y, a.z + b.z);
}

function f2x(a: Vec3, b: Vec3, out: Vec3): void {
    const x = a.x + b.x;
    const y = a.y + b.y;
    const z = a.z + b.z;
    (out as any).x = x;
    (out as any).y = y;
    (out as any).z = z;
}

function f2z(a: Vec3, b: Vec3, out: Vec3 = v3(0, 0, 0)): Vec3 {
    const x = a.x + b.x;
    const y = a.y + b.y;
    const z = a.z + b.z;
    (out as any).x = x;
    (out as any).y = y;
    (out as any).z = z;
    return out;
}

function test1(
    a: Vec3, b: Vec3, storage: Vec3[],
    f1: (v: Vec3, k: number) => Vec3,
    f2: (a: Vec3, b: Vec3) => Vec3,
): Vec3 {
    for (let i = 0; i < storage.length; ++i) {
        const k = i / (storage.length - 1);
        const x1 = f2(f1(a, 1 - k), f1(b, k));
        const x2 = f2(f1(a, k / 2), f1(b, k / 2));
        const x3 = f2(f1(a, 1 - k * k), f1(b, k * k));
        const x4 = f2(f1(a, 0.2 + k), f1(b, 0.2 + k));
        storage[i] = f2(f2(x1, x2), f2(x3, x4));
    }
    let result = storage[0];
    for (let i = 1; i < storage.length; ++i) {
        result = f2(result, f1(storage[i], i / (storage.length - 1)));
    }
    return result;
}

function test2(
    a: Vec3, b: Vec3, storage: Vec3[],
    f1x: (v: Vec3, k: number, out: Vec3) => void,
    f2x: (a: Vec3, b: Vec3, out: Vec3) => void,
): Vec3 {
    const scratch1 = v3(0, 0, 0);
    const scratch2 = v3(0, 0, 0);

    const x1 = v3(0, 0, 0);
    const x2 = v3(0, 0, 0);
    const x3 = v3(0, 0, 0);
    const x4 = v3(0, 0, 0);

    for (let i = 0; i < storage.length; ++i) {
        const k = i / (storage.length - 1);

        f1x(a, 1 - k, scratch1);
        f1x(b, k, scratch2);
        f2x(scratch1, scratch2, x1);

        f1x(a, k / 2, scratch1);
        f1x(b, k / 2, scratch2);
        f2x(scratch1, scratch2, x2);

        f1x(a, 1 - k * k, scratch1);
        f1x(b, k * k, scratch2);
        f2x(scratch1, scratch2, x3);

        f1x(a, 0.2 + k, scratch1);
        f1x(b, 0.2 + k, scratch2);
        f2x(scratch1, scratch2, x4);

        f2x(x1, x2, scratch1);
        f2x(x3, x4, scratch2);
        const z = v3(0, 0, 0);
        f2x(scratch1, scratch2, z);
        storage[i] = z;
    }
    const result = v3(storage[0].x, storage[0].y, storage[0].z);
    for (let i = 1; i < storage.length; ++i) {
        f1x(storage[i], i / (storage.length - 1), scratch1);
        f2x(result, scratch1, result);
    }
    return result;
}

const a = v3(1, 4, 8);
const b = v3(3, 2, 9);
const storage = new Array<Vec3>(512);

console.log(measure(() => test1(a, b, storage, f1, f2)));
console.log(measure(() => test2(a, b, storage, f1x, f2x)));

console.log(measure(() => test1(a, b, storage, f1z, f2z)));
console.log(measure(() => test2(a, b, storage, f1z, f2z)));
