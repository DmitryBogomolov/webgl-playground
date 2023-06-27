import {
    QUAT4_UNIT,
    quat4fromAxisAngle, quat4Angle, quat4Axis, quat4mul,
} from './quat4';
import { eq4 } from './vec4';

describe('quat4', () => {
    it('constants', () => {
        expect(eq4(QUAT4_UNIT, { x: 0, y: 0, z: 0, w: 1 })).toEqual(true);
    });

    it('quat4fromAxisAngle', () => {

    });

    it('quat4Angle', () => {

    });

    it('quat4Axis', () => {

    });

    it('quat4mul', () => {

    });
});
