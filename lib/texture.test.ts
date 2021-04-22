import { Texture } from './texture';
import './no-console-in-tests';
import { ContextView } from './context-view';

describe('texture', () => {
    describe('Texture', () => {
        let texture: WebGLTexture;
        let ctx: WebGLRenderingContext;
        let context: ContextView;
        let createTexture: jest.Mock;
        let bindTexture: jest.Mock;
        let activeTexture: jest.Mock;

        beforeEach(() => {
            texture = { tag: 'test-texture' };
            createTexture = jest.fn().mockReturnValue(texture);
            bindTexture = jest.fn();
            activeTexture = jest.fn();
            ctx = {
                createTexture,
                bindTexture,
                activeTexture,
            } as unknown as WebGLRenderingContext;
            context = {
                logCall() { /* empty */ },
                handle() { return ctx; },
            } as unknown as ContextView;
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

            expect(bindTexture.mock.calls).toEqual([
                ['#TEXTURE_2D', texture],
                ['#TEXTURE_2D', null],
            ]);
        });

        it('active texture', () => {
            Texture.contextMethods.activeTexture(context, 2);

            expect(activeTexture.mock.calls[0]).toEqual(['#TEXTURE0_2']);
        });
    });
});
