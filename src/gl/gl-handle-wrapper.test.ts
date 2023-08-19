import { wrap } from './gl-handle-wrapper';

describe('gl-handle-wrapper', () => {
    describe('wrap', () => {
        it('make wrapper', () => {
            const handle = { tag: 'test-handle' };
            const target = wrap('test-id', handle);

            expect(target.toString()).toEqual('test-id');
            expect(target.glHandle()).toEqual(handle);
        });
    });
});
