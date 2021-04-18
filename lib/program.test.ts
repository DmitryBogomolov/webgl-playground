import { Program } from './program';
import './no-console-in-tests';
import { ContextView } from './context-view';

describe('program', () => {
    describe('Program', () => {
        let program: WebGLProgram;
        let ctx: WebGLRenderingContext;
        let context: ContextView;
        let createProgram: jest.Mock;
        let useProgram: jest.Mock;

        beforeEach(() => {
            program = { tag: 'test-program' };
            createProgram = jest.fn().mockReturnValue(program);
            useProgram = jest.fn();
            ctx = {
                createProgram,
                useProgram,
            } as unknown as WebGLRenderingContext;
            context = {
                logCall() { /* empty */ },
                handle() { return ctx; },
            } as unknown as ContextView;
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

            expect(useProgram.mock.calls).toEqual([
                [program],
                [null],
            ]);
        });
    });
});
