import { Framebuffer } from './framebuffer';
import { Runtime } from './runtime';

describe('framebuffer', () => {
    describe('Framebuffer', () => {
        let framebuffer: WebGLFramebuffer;
        let ctx: WebGLRenderingContext;
        let runtime: Runtime;
        let createFramebuffer: jest.Mock;

        beforeEach(() => {
            framebuffer = { tag: 'framebuffer' };
            createFramebuffer = jest.fn().mockReturnValueOnce(framebuffer);
            ctx = {
                createFramebuffer,
            } as unknown as WebGLRenderingContext;
            runtime = {
                gl: ctx,
            } as unknown as Runtime;
        });

        it('create framebuffer', () => {
            new Framebuffer(runtime);
            expect(createFramebuffer.mock.calls).toEqual([
                [],
            ]);
        });
    });
});
