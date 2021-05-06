import { Program_ } from './program_';
import { Runtime_ } from './runtime_';
import { VertexSchema } from './vertex-schema';
import './no-console-in-tests';

describe('program', () => {
    describe('Program_', () => {
        let program: WebGLProgram;
        let vShader: WebGLShader;
        let fShader: WebGLShader;
        let ctx: WebGLRenderingContext;
        let runtime: Runtime_;
        let createProgram: jest.Mock;
        let createShader: jest.Mock;
        let useProgram: jest.Mock;
        let shaderSource: jest.Mock;
        let compileShader: jest.Mock;
        let getShaderParameter: jest.Mock;
        let attachShader: jest.Mock;
        let linkProgram: jest.Mock;
        let getProgramParameter: jest.Mock;

        beforeEach(() => {
            program = { tag: 'test-program' };
            vShader = { tag: 'vertex-shader' };
            fShader = { tag: 'fragment-shader' };
            createProgram = jest.fn().mockReturnValue(program);
            createShader = jest.fn().mockReturnValueOnce(vShader).mockReturnValueOnce(fShader);
            useProgram = jest.fn();
            shaderSource = jest.fn();
            compileShader = jest.fn();
            getShaderParameter = jest.fn().mockReturnValueOnce(true).mockReturnValueOnce(true);
            attachShader = jest.fn();
            linkProgram = jest.fn();
            getProgramParameter = jest.fn().mockReturnValueOnce(true);
            ctx = {
                createProgram,
                createShader,
                useProgram,
                shaderSource,
                compileShader,
                getShaderParameter,
                attachShader,
                linkProgram,
                getProgramParameter,
            } as unknown as WebGLRenderingContext;
            runtime = {
                gl: ctx,
            } as unknown as Runtime_;
        });

        it('create program', () => {
            new Program_(runtime, {
                vertexShader: 'vertex-shader-source',
                fragmentShader: 'fragment-shader-source',
                schema: {} as unknown as VertexSchema,
            });
            expect(createProgram.mock.calls).toEqual([
                [],
            ]);
            expect(createShader.mock.calls).toEqual([
                [WebGLRenderingContext.prototype.VERTEX_SHADER],
                [WebGLRenderingContext.prototype.FRAGMENT_SHADER],
            ]);
            expect(shaderSource.mock.calls).toEqual([
                [vShader, 'vertex-shader-source'],
                [fShader, 'fragment-shader-source'],
            ]);
            expect(compileShader.mock.calls).toEqual([
                [vShader],
                [fShader],
            ]);
            expect(attachShader.mock.calls).toEqual([
                [program, vShader],
                [program, fShader],
            ]);
            expect(linkProgram.mock.calls).toEqual([
                [program],
            ]);
        });
    });
});
