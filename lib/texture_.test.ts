import { Texture_ } from './texture_';
import { Runtime_ } from './runtime_';
import './no-console-in-tests';

describe('texture', () => {
    describe('Texture_', () => {
        let texture: WebGLTexture;
        let ctx: WebGLRenderingContext;
        let runtime: Runtime_;
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
            } as unknown as Runtime_;
        });

        it('create texture', () => {
            new Texture_(runtime);
            expect(createTexture.mock.calls).toEqual([
                [],
            ]);
        });
    });
});
