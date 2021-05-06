import { Texture } from './texture';
import { Runtime } from './runtime';

describe('texture', () => {
    describe('Texture', () => {
        let texture: WebGLTexture;
        let ctx: WebGLRenderingContext;
        let runtime: Runtime;
        let createTexture: jest.Mock;
        let bindTexture: jest.Mock;
        let activeTexture: jest.Mock;

        beforeEach(() => {
            texture = { tag: 'test-texture' };
            createTexture = jest.fn().mockReturnValueOnce(texture);
            bindTexture = jest.fn();
            activeTexture = jest.fn();
            ctx = {
                createTexture,
                bindTexture,
                activeTexture,
            } as unknown as WebGLRenderingContext;
            runtime = {
                gl: ctx,
            } as unknown as Runtime;
        });

        it('create texture', () => {
            new Texture(runtime);
            expect(createTexture.mock.calls).toEqual([
                [],
            ]);
        });
    });
});
