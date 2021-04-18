import { Program } from './program';
import './no-console-in-tests';

describe('program', () => {
    describe('Program', () => {
        /** @type {WebGLProgram} */
        let program;
        /** @type {WebGLRenderingContext} */
        let ctx;
        /** @type {import('./program').Context} */
        let context;

        beforeEach(() => {
            program = { tag: 'test-program' };
            ctx = {
                createProgram: jest.fn().mockReturnValue(program),
                useProgram: jest.fn(),
            };
            context = {
                logCall() { },
                handle() { return ctx; },
            };
        });
        
        it('has proper handle', () => {
            expect(new Program(context).handle()).toBe(program);
        });

        it('create program', () => {
            expect(Program.contextMethods.createProgram(context) instanceof Program).toEqual(true);
        });

        it('use program', () => {
            Program.contextMethods.useProgram(context, new Program(context));
            Program.contextMethods.useProgram(context, null);

            expect(ctx.useProgram.mock.calls).toEqual([
                [program],
                [null],
            ]);
        });
    });
});
