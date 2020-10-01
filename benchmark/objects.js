const SAMPLE_COUNT = 1E8;

function measure(callback, ...args) {
    const start = Date.now();
    for (let i = 0; i < SAMPLE_COUNT; ++i) {
        callback(i, ...args);
    }
    const end = Date.now();
    return end - start;
}

function Prt(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
}

class Cls {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
}

function createArr(idx) {
    return [idx * 0.1, idx * 0.2, idx * 0.3];
}

function createObj(idx) {
    return { x: idx * 0.1, y: idx * 0.2, z: idx * 0.3 };
}

function createPrt(idx) {
    return new Prt(idx * 0.1, idx * 0.2, idx * 0.3);
}

function createCls(idx) {
    return new Cls(idx * 0.1, idx * 0.2, idx * 0.3);
}

function accessArr(idx, obj) {
    const [x, y, z] = obj;
    obj[0] = x * 1.2 + idx;
    obj[1] = y * 1.3 + idx;
    obj[2] = z * 1.4 + idx;
}

function accessObj(idx, obj) {
    const { x, y, z } = obj;
    obj.x = x * 1.2 + idx;
    obj.y = y * 1.3 + idx;
    obj.z = z * 1.4 + idx;
}

const SCHEMA = [
    ['create arr', createArr],
    ['create obj', createObj],
    ['create prt', createPrt],
    ['create cls', createCls],
    ['access arr', accessArr, [1.2, 2.3, 3.4]],
    ['access obj', accessObj, { x: 1.2, y: 2.3, z: 3.4 }],
    ['access prt', accessObj, new Prt(1.2, 2.3, 3.4)],
    ['access cls', accessObj, new Cls(1.2, 2.3, 3.4)],
];

const durations = SCHEMA.map(([_, callback, ...args]) => measure(callback, ...args));

SCHEMA.forEach(([name], i) => {
    console.log(name, durations[i]);
});
