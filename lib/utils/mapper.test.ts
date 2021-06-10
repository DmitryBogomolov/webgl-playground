import { mapper } from './mapper';

describe('mapper', () => {
    describe('mapper', () => {
        it('map values', () => {
            const func = mapper(0, 10, -1, +1);
            expect(func(0)).toEqual(-1);
            expect(func(10)).toEqual(1);
            expect(func(5)).toEqual(0);
            expect(func(1)).toEqual(-0.8);
            expect(func(9)).toEqual(0.8);
        });
    });
});
