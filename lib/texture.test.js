import { Texture } from './texture';
import './no-console-in-tests';

describe('texture', () => {
    describe('Texture', () => {
        /** @type {WebGLTexture} */
        let texture;
        /** @type {WebGLRenderingContext} */
        let ctx;
        /** @type {import('./program').Context} */
        let context;

        beforeEach(() => {
            texture = { tag: 'test-texture' };
            ctx = {
                createTexture: jest.fn().mockReturnValue(texture),
                bindTexture: jest.fn(),
                activeTexture: jest.fn(),
            };
            context = {
                logCall() { },
                handle() { return ctx; },
            };
        });
        
        it('has proper handle', () => {
            expect(new Texture(context).handle()).toBe(texture);
        });

        it('create texture', () => {
            expect(Texture.contextMethods.createTexture(context) instanceof Texture).toEqual(true);
        });

        it('bind texture', () => {
            Texture.contextMethods.bindTexture(context, new Texture(context));
            Texture.contextMethods.bindTexture(context, null);

            expect(ctx.bindTexture.mock.calls).toEqual([
                ['#TEXTURE_2D', texture],
                ['#TEXTURE_2D', null],
            ]);
        });

        it('active texture', () => {
            Texture.contextMethods.activeTexture(context, 2);

            expect(ctx.activeTexture.mock.calls[0]).toEqual(['#TEXTURE0_2']);
        });
    });
});
