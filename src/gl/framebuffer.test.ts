import { Framebuffer } from './framebuffer';
import { Runtime } from './runtime';
import { Texture } from './texture-2d';

jest.mock('./texture-2d');

describe('framebuffer', () => {
    describe('Framebuffer', () => {
        const MockTexture = Texture as jest.Mock;
        let framebuffer: WebGLFramebuffer;
        let texture: {
            dispose: jest.Mock,
            setFormat: jest.Mock,
            setParameters: jest.Mock,
            setImageData: jest.Mock,
            glHandle: jest.Mock,
        };
        let ctx: WebGLRenderingContext;
        let runtime: Runtime;
        let createFramebuffer: jest.Mock;
        let deleteFramebuffer: jest.Mock;
        let bindFramebuffer: jest.Mock;
        let framebufferTexture2D: jest.Mock;
        let checkFramebufferStatus: jest.Mock;
        let bindTexture: jest.Mock;

        const {
            FRAMEBUFFER,
            COLOR_ATTACHMENT0,
            TEXTURE_2D,
        } = WebGLRenderingContext.prototype;

        beforeEach(() => {
            framebuffer = { tag: 'framebuffer' };
            texture = {
                dispose: jest.fn(),
                setFormat: jest.fn(),
                setParameters: jest.fn(),
                setImageData: jest.fn(),
                glHandle: jest.fn().mockReturnValue({ tag: 'texture' }),
            };
            MockTexture.mockReturnValueOnce(texture);
            createFramebuffer = jest.fn().mockReturnValueOnce(framebuffer);
            deleteFramebuffer = jest.fn();
            framebufferTexture2D = jest.fn();
            checkFramebufferStatus = jest.fn();
            bindFramebuffer = jest.fn();
            bindTexture = jest.fn();
            ctx = {
                createFramebuffer,
                deleteFramebuffer,
                framebufferTexture2D,
                checkFramebufferStatus,
            } as unknown as WebGLRenderingContext;
            runtime = {
                gl: () => ctx,
                logger: () => null,
                bindFramebuffer,
                bindTexture,
            } as unknown as Runtime;
        });

        afterEach(() => {
            MockTexture.mockReset();
        });

        it('create framebuffer', () => {
            new Framebuffer({
                runtime,
                attachment: 'color',
                size: { x: 200, y: 150 },
            });
            expect(createFramebuffer.mock.calls).toEqual([
                [],
            ]);
            expect(texture.setFormat.mock.calls).toEqual([
                ['rgba'],
            ]);
            expect(texture.setParameters.mock.calls).toEqual([
                [{}],
            ]);
            expect(texture.setImageData.mock.calls).toEqual([
                [{ size: { x: 200, y: 150 }, data: null }],
            ]);
            expect(framebufferTexture2D.mock.calls).toEqual([
                [FRAMEBUFFER, COLOR_ATTACHMENT0, TEXTURE_2D, { tag: 'texture' }, 0],
            ]);
        });
    });
});
