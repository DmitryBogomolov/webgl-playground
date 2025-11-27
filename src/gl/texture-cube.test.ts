import type { Runtime } from './runtime';
import { TextureCube } from './texture-cube';

describe('texture-cube', () => {
    describe('TextureCube', () => {
        let texture: WebGLTexture;
        let ctx: WebGL2RenderingContext;
        let runtime: Runtime;
        let createTexture: jest.Mock;
        let bindCubeTexture: jest.Mock;
        let activeTexture: jest.Mock;
        let texParameteri: jest.Mock;

        const {
            TEXTURE_CUBE_MAP,
            TEXTURE_WRAP_S,
            TEXTURE_WRAP_T,
            TEXTURE_MIN_FILTER,
            LINEAR,
            CLAMP_TO_EDGE,
        } = WebGL2RenderingContext.prototype;

        beforeEach(() => {
            texture = { tag: 'test-texture' };
            createTexture = jest.fn().mockReturnValueOnce(texture);
            bindCubeTexture = jest.fn();
            activeTexture = jest.fn();
            texParameteri = jest.fn();
            ctx = {
                createTexture,
                activeTexture,
                texParameteri,
            } as unknown as WebGL2RenderingContext;
            runtime = {
                gl: () => ctx,
                logger: () => null,
                bindCubeTexture,
            } as unknown as Runtime;
        });

        it('create texture', () => {
            const texture = new TextureCube({ runtime });
            expect(createTexture.mock.calls).toEqual([
                [],
            ]);
            expect(bindCubeTexture.mock.calls).toEqual([
                [texture],
            ]);
            expect(texParameteri.mock.calls).toEqual([
                [TEXTURE_CUBE_MAP, TEXTURE_WRAP_S, CLAMP_TO_EDGE],
                [TEXTURE_CUBE_MAP, TEXTURE_WRAP_T, CLAMP_TO_EDGE],
                [TEXTURE_CUBE_MAP, TEXTURE_MIN_FILTER, LINEAR],
            ]);
        });
    });
});
