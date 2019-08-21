import { generateDefaultIndexes, unwrapHandle } from './utils';

describe('utils', () => {
    describe('generateDefaultIndexes', () => {
        it('create list', () => {
            expect(generateDefaultIndexes(8)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
        });
    });

    describe('unwrapHandle', () => {
        it('return handle or null', () => {
            expect(unwrapHandle({ handle: () => 'test-handle' })).toEqual('test-handle');
            expect(null).toEqual(null);
        });
    });
});
