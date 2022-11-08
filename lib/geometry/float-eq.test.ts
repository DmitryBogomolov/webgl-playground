import { floatEq } from './float-eq';

describe('float-eq', () => {
    it('floatEq', () => {
        expect(floatEq(0.000003, 0.000003)).toEqual(true);
        expect(floatEq(0.0000031, 0.0000032)).toEqual(true);
        expect(floatEq(0.000004, 0.000005)).toEqual(false);

        expect(floatEq(0.001, 0.002, 0.001)).toEqual(true);
        expect(floatEq(0.01, 0.02, 0.001)).toEqual(false);
    });
});
