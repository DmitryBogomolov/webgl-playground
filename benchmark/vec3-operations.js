const SAMPLE_COUNT = 1E4;

function measure(callback) {
    const start = Date.now();
    for (let i = 0; i < SAMPLE_COUNT; ++i) {
        callback(i);
    }
    const end = Date.now();
    return end - start;
}

class Vec3 {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
}

function v3(x, y, z) {
    return new Vec3(x, y, z);
}

function f1_ret(v, k) {
    return v3(v.x * k, v.y * k, v.z * k);
}

function f1_out(v, k, out) {
    const x = v.x * k;
    const y = v.y * k;
    const z = v.z * k;
    out.x = x;
    out.y = y;
    out.z = z;
}

function f1_both(v, k, out = v3(0, 0, 0)) {
    const x = v.x * k;
    const y = v.y * k;
    const z = v.z * k;
    out.x = x;
    out.y = y;
    out.z = z;
    return out;
}

function f2_ret(a, b) {
    return v3(a.x + b.x, a.y + b.y, a.z + b.z);
}

function f2_out(a, b, out) {
    const x = a.x + b.x;
    const y = a.y + b.y;
    const z = a.z + b.z;
    out.x = x;
    out.y = y;
    out.z = z;
}

function f2_both(a, b, out = v3(0, 0, 0)) {
    const x = a.x + b.x;
    const y = a.y + b.y;
    const z = a.z + b.z;
    out.x = x;
    out.y = y;
    out.z = z;
    return out;
}

function test_ret(a, b, arr, f1, f2) {
    for (let i = 0; i < arr.length; ++i) {
        const k = i / (arr.length - 1);
        const x1 = f2(f1(a, 1 - k), f1(b, k));
        const x2 = f2(f1(a, k / 2), f1(b, k / 2));
        const x3 = f2(f1(a, 1 - k * k), f1(b, k * k));
        const x4 = f2(f1(a, 0.2 + k), f1(b, 0.2 + k));
        arr[i] = f2(f2(x1, x2), f2(x3, x4));
    }
    let result = arr[0];
    for (let i = 1; i < arr.length; ++i) {
        result = f2(result, f1(arr[i], i / (arr.length - 1)));
    }
    return result;
}

function test_out(a, b, arr, f1, f2) {
    const scratch1 = v3(0, 0, 0);
    const scratch2 = v3(0, 0, 0);

    const x1 = v3(0, 0, 0);
    const x2 = v3(0, 0, 0);
    const x3 = v3(0, 0, 0);
    const x4 = v3(0, 0, 0);

    for (let i = 0; i < arr.length; ++i) {
        const k = i / (arr.length - 1);

        f1(a, 1 - k, scratch1);
        f1(b, k, scratch2);
        f2(scratch1, scratch2, x1);

        f1(a, k / 2, scratch1);
        f1(b, k / 2, scratch2);
        f2(scratch1, scratch2, x2);

        f1(a, 1 - k * k, scratch1);
        f1(b, k * k, scratch2);
        f2(scratch1, scratch2, x3);

        f1(a, 0.2 + k, scratch1);
        f1(b, 0.2 + k, scratch2);
        f2(scratch1, scratch2, x4);

        f2(x1, x2, scratch1);
        f2(x3, x4, scratch2);
        const z = v3(0, 0, 0);
        f2(scratch1, scratch2, z);
        arr[i] = z;
    }
    const result = v3(arr[0].x, arr[0].y, arr[0].z);
    for (let i = 1; i < arr.length; ++i) {
        f1(arr[i], i / (arr.length - 1), scratch1);
        f2(result, scratch1, result);
    }
    return result;
}

const a = v3(1, 4, 8);
const b = v3(3, 2, 9);
const storage = new Array(512);

console.log(measure(() => test_ret(a, b, storage, f1_ret, f2_ret)));
console.log(measure(() => test_out(a, b, storage, f1_out, f2_out)));

console.log(measure(() => test_ret(a, b, storage, f1_both, f2_both)));
console.log(measure(() => test_out(a, b, storage, f1_both, f2_both)));
