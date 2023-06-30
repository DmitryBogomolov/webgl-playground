import {
    QUAT4_UNIT,
    quat4apply, quat4mul, quat4slerp, quat4conj, quat4inv,
    quat4fromAxisAngle, quat4toAxisAngle,
} from './quat4';

describe('quat4', () => {
    const c_PI4 = Math.cos(Math.PI / 4);
    const s_PI4 = Math.sin(Math.PI / 4);

    it('constants', () => {
        expect(QUAT4_UNIT).toBeVec4({ x: 0, y: 0, z: 0, w: 1 });
    });

    it('quat4apply', () => {
        expect(
            quat4apply({ x: 0, y: 0, z: 0, w: 1 }, { x: 1, y: 2, z: 3 })
        ).toBeVec3({ x: 1, y: 2, z: 3 });
        expect(
            quat4apply({ x: +s_PI4, y: 0, z: 0, w: c_PI4 }, { x: 1, y: 2, z: 3 })
        ).toBeVec3({ x: 1, y: -3, z: 2 });
        expect(
            quat4apply({ x: 0, y: -s_PI4, z: 0, w: c_PI4 }, { x: 1, y: 2, z: 3 })
        ).toBeVec3({ x: -3, y: 2, z: 1 });
        expect(
            quat4apply({ x: 0, y: 0, z: +s_PI4, w: c_PI4 }, { x: 1, y: 2, z: 3 })
        ).toBeVec3({ x: -2, y: 1, z: 3 });
    });

    it('quat4mul', () => {
        expect(
            quat4mul({ x: 0, y: 0, z: 0, w: 1 }, { x: 0, y: 0, z: 0, w: 1 })
        ).toBeVec4({ x: 0, y: 0, z: 0, w: 1 });
        expect(
            quat4mul({ x: -s_PI4, y: 0, z: 0, w: c_PI4 }, { x: 0, y: -s_PI4, z: 0, w: c_PI4 })
        ).toBeVec4({ x: -0.5, y: -0.5, z: 0.5, w: 0.5 });
    });

    it('quat4slerp', () => {
        expect(
            quat4slerp({ x: -0.5, y: -0.5, z: 0.5, w: 0.5 }, { x: -0.5, y: -0.5, z: 0.5, w: 0.5 }, 0)
        ).toBeVec4({ x: -0.5, y: -0.5, z: 0.5, w: 0.5 });
        expect(
            quat4slerp({ x: -0.5, y: -0.5, z: 0.5, w: 0.5 }, { x: -0.5, y: -0.5, z: 0.5, w: 0.5 }, 1)
        ).toBeVec4({ x: -0.5, y: -0.5, z: 0.5, w: 0.5 });
        expect(
            quat4slerp({ x: -0.5, y: -0.5, z: 0.5, w: 0.5 }, { x: -0.5, y: -0.5, z: 0.5, w: 0.5 }, 0.5)
        ).toBeVec4({ x: -0.5, y: -0.5, z: 0.5, w: 0.5 });

        expect(
            quat4slerp({ x: 0, y: +s_PI4, z: 0, w: c_PI4 }, { x: 0, y: -s_PI4, z: 0, w: c_PI4 }, 0.5)
        ).toBeVec4({ x: 0, y: 0, z: 0, w: 1 });
        expect(
            quat4slerp({ x: 0, y: +s_PI4, z: 0, w: c_PI4 }, { x: 0, y: -s_PI4, z: 0, w: c_PI4 }, -0.1)
        ).toBeVec4({ x: 0, y: +s_PI4, z: 0, w: c_PI4 });
        expect(
            quat4slerp({ x: 0, y: +s_PI4, z: 0, w: c_PI4 }, { x: 0, y: -s_PI4, z: 0, w: c_PI4 }, +1.2)
        ).toBeVec4({ x: 0, y: -s_PI4, z: 0, w: c_PI4 });
        const c = Math.cos(Math.PI / 8);
        const s = Math.sin(Math.PI / 8);
        expect(
            quat4slerp({ x: 0, y: +s_PI4, z: 0, w: c_PI4 }, { x: 0, y: -s_PI4, z: 0, w: c_PI4 }, 0.25)
        ).toBeVec4({ x: 0, y: +s, z: 0, w: c });
        expect(
            quat4slerp({ x: 0, y: +s_PI4, z: 0, w: c_PI4 }, { x: 0, y: -s_PI4, z: 0, w: c_PI4 }, 0.75)
        ).toBeVec4({ x: 0, y: -s, z: 0, w: c });
    });

    it('quat4conj', () => {
        expect(
            quat4conj({ x: 0, y: 0, z: 0, w: 1 })
        ).toBeVec4({ x: 0, y: 0, z: 0, w: 1 });
        expect(
            quat4conj({ x: 1, y: 2, z: 3, w: 4 })
        ).toBeVec4({ x: -1, y: -2, z: -3, w: 4 });
    });

    it('quat4inv', () => {
        expect(
            quat4inv({ x: 0, y: 0, z: 0, w: 1 })
        ).toBeVec4({ x: 0, y: 0, z: 0, w: 1 });
        expect(
            quat4inv({ x: +s_PI4, y: 0, z: 0, w: c_PI4 })
        ).toBeVec4({ x: -s_PI4, y: 0, z: 0, w: c_PI4 });
        expect(
            quat4inv({ x: 1, y: 1, z: 1, w: 1 })
        ).toBeVec4({ x: -0.5, y: -0.5, z: -0.5, w: 0.5 });
    });

    it('quat4fromAxisAngle', () => {
        let a: number;
        expect(
            quat4fromAxisAngle({ x: 1, y: 2, z: 3 }, 0)
        ).toBeVec4({ x: 0, y: 0, z: 0, w: 1 });
        a = 0.3 * Math.PI;
        expect(
            quat4fromAxisAngle({ x: 1, y: 0, z: 0 }, a)
        ).toBeVec4({ x: Math.sin(a / 2), y: 0, z: 0, w: Math.cos(a / 2) });
        a = -0.8 * Math.PI;
        expect(
            quat4fromAxisAngle({ x: 0, y: -2, z: 0 }, a)
        ).toBeVec4({ x: 0, y: -2 * Math.sin(a / 2), z: 0, w: Math.cos(a / 2) });
        a = 0.1 * Math.PI;
        expect(
            quat4fromAxisAngle({ x: 3, y: -2, z: -1 }, a)
        ).toBeVec4({ x: 3 * Math.sin(a / 2), y: -2 * Math.sin(a / 2), z: -1 * Math.sin(a / 2), w: Math.cos(a / 2) });
    });

    it('quat4toAxisAngle', () => {
        let s: number;
        expect(
            quat4toAxisAngle({ x: 0, y: 0, z: 0, w: 1 })
        ).toBeVec4({ x: 1 / Math.sqrt(3), y: 1 / Math.sqrt(3), z: 1 / Math.sqrt(3), w: 0 });
        s = Math.sin(0.2 * Math.PI);
        expect(
            quat4toAxisAngle({ x: 1 * s, y: 2 * s, z: 3 * s, w: Math.sqrt(1 - s * s) })
        ).toBeVec4({ x: 1, y: 2, z: 3, w: 2 * Math.asin(s) });
        s = Math.sin(-0.1 * Math.PI);
        expect(
            quat4toAxisAngle({ x: 0.3 * s, y: -0.1 * s, z: -0.4 * s, w: Math.sqrt(1 - s * s) })
        ).toBeVec4({ x: -0.3, y: 0.1, z: 0.4, w: -2 * Math.asin(s) });
    });
});
