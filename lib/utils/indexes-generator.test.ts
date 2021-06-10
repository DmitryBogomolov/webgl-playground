import { generateDefaultIndexes } from './indexes-generator';

describe('indexes-generator', () => {
    describe('generateDefaultIndexes', () => {
        it('create list', () => {
            expect(generateDefaultIndexes(8)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
        });
    });
});
