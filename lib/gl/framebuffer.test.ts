import { Framebuffer } from './framebuffer';
import { Runtime } from './runtime';
import { Texture } from './texture-2d';

jest.mock('./texture-2d');

describe('framebuffer', () => {
    describe('Framebuffer', () => {
        const MockTexture = Texture as jest.Mock;
        let framebuffer: WebGLFramebuffer;
        let texture: { setImageData: jest.Mock, glHandle: jest.Mock };
        let ctx: WebGLRenderingContext;
        let runtime: Runtime;
        let createFramebuffer: jest.Mock;
        let bindFramebuffer: jest.Mock;
        let framebufferTexture2D: jest.Mock;
        let checkFramebufferStatus: jest.Mock;

        const {
            FRAMEBUFFER,
            COLOR_ATTACHMENT0,
            TEXTURE_2D,
        } = WebGLRenderingContext.prototype;

        beforeEach(() => {
            framebuffer = { tag: 'framebuffer' };
            texture = {
                setImageData: jest.fn(),
                glHandle: jest.fn().mockReturnValue({ tag: 'texture' }),
            };
            MockTexture.mockReturnValueOnce(texture);
            createFramebuffer = jest.fn().mockReturnValueOnce(framebuffer);
            framebufferTexture2D = jest.fn();
            checkFramebufferStatus = jest.fn();
            bindFramebuffer = jest.fn();
            ctx = {
                createFramebuffer,
                framebufferTexture2D,
                checkFramebufferStatus,
            } as unknown as WebGLRenderingContext;
            runtime = {
                gl: ctx,
                bindFramebuffer,
            } as unknown as Runtime;
        });

        afterEach(() => {
            MockTexture.mockReset();
        });

        it('create framebuffer', () => {
            new Framebuffer(runtime, {
                attachment: 'color',
                size: { x: 200, y: 150 },
            });
            expect(createFramebuffer.mock.calls).toEqual([
                [],
            ]);
            expect(texture.setImageData.mock.calls).toEqual([
                [{ size: { x: 200, y: 150 }, data: null }, { format: 'rgba' }],
            ]);
            expect(framebufferTexture2D.mock.calls).toEqual([
                [FRAMEBUFFER, COLOR_ATTACHMENT0, TEXTURE_2D, { tag: 'texture' }, 0],
            ]);
        });
    });
});
