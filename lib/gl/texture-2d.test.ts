import { Texture } from './texture-2d';
import { Runtime } from './runtime';

describe('texture', () => {
    describe('Texture', () => {
        let texture: WebGLTexture;
        let ctx: WebGLRenderingContext;
        let runtime: Runtime;
        let createTexture: jest.Mock;
        let bindTexture: jest.Mock;
        let activeTexture: jest.Mock;
        let texParameteri: jest.Mock;

        const {
            TEXTURE_2D,
            TEXTURE_WRAP_S,
            TEXTURE_WRAP_T,
            TEXTURE_MIN_FILTER,
            LINEAR,
            CLAMP_TO_EDGE,
        } = WebGLRenderingContext.prototype;

        beforeEach(() => {
            texture = { tag: 'test-texture' };
            createTexture = jest.fn().mockReturnValueOnce(texture);
            bindTexture = jest.fn();
            activeTexture = jest.fn();
            texParameteri = jest.fn();
            ctx = {
                createTexture,
                activeTexture,
                texParameteri,
            } as unknown as WebGLRenderingContext;
            runtime = {
                gl: () => ctx,
                logger: () => null,
                bindTexture,
            } as unknown as Runtime;
        });

        it('create texture', () => {
            const texture = new Texture(runtime);
            expect(createTexture.mock.calls).toEqual([
                [],
            ]);
            expect(bindTexture.mock.calls).toEqual([
                [texture],
            ]);
            expect(texParameteri.mock.calls).toEqual([
                [TEXTURE_2D, TEXTURE_WRAP_S, CLAMP_TO_EDGE],
                [TEXTURE_2D, TEXTURE_WRAP_T, CLAMP_TO_EDGE],
                [TEXTURE_2D, TEXTURE_MIN_FILTER, LINEAR],
            ]);
        });
    });
});
