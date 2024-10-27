import { Program } from './program';
import { Runtime } from './runtime';

describe('program', () => {
    describe('Program', () => {
        let program: WebGLProgram;
        let vShader: WebGLShader;
        let fShader: WebGLShader;
        let ctx: WebGLRenderingContext;
        let runtime: Runtime;
        let createProgram: jest.Mock;
        let createShader: jest.Mock;
        let deleteShader: jest.Mock;
        let useProgram: jest.Mock;
        let shaderSource: jest.Mock;
        let compileShader: jest.Mock;
        let getShaderParameter: jest.Mock;
        let attachShader: jest.Mock;
        let bindAttribLocation: jest.Mock;
        let linkProgram: jest.Mock;
        let getProgramParameter: jest.Mock;

        beforeEach(() => {
            program = { tag: 'test-program' };
            vShader = { tag: 'vertex-shader' };
            fShader = { tag: 'fragment-shader' };
            createProgram = jest.fn().mockReturnValue(program);
            createShader = jest.fn().mockReturnValueOnce(vShader).mockReturnValueOnce(fShader);
            deleteShader = jest.fn();
            useProgram = jest.fn();
            shaderSource = jest.fn();
            compileShader = jest.fn();
            getShaderParameter = jest.fn().mockReturnValueOnce(true).mockReturnValueOnce(true);
            attachShader = jest.fn();
            bindAttribLocation = jest.fn();
            linkProgram = jest.fn();
            getProgramParameter = jest.fn().mockReturnValueOnce(true);
            ctx = {
                createProgram,
                createShader,
                deleteShader,
                useProgram,
                shaderSource,
                compileShader,
                getShaderParameter,
                attachShader,
                bindAttribLocation,
                linkProgram,
                getProgramParameter,
            } as unknown as WebGLRenderingContext;
            runtime = {
                gl: () => ctx,
                logger: () => null,
            } as unknown as Runtime;
        });

        it('create program', () => {
            new Program({
                runtime,
                vertShader: 'vert-shader-source',
                fragShader: 'frag-shader-source',
            });
            expect(createProgram.mock.calls).toEqual([
                [],
            ]);
            expect(createShader.mock.calls).toEqual([
                [WebGLRenderingContext.prototype.VERTEX_SHADER],
                [WebGLRenderingContext.prototype.FRAGMENT_SHADER],
            ]);
            expect(shaderSource.mock.calls).toEqual([
                [vShader, 'vert-shader-source'],
                [fShader, 'frag-shader-source'],
            ]);
            expect(compileShader.mock.calls).toEqual([
                [vShader],
                [fShader],
            ]);
            expect(attachShader.mock.calls).toEqual([
                [program, vShader],
                [program, fShader],
            ]);
            expect(bindAttribLocation.mock.calls).toEqual([
            ]);
            expect(linkProgram.mock.calls).toEqual([
                [program],
            ]);
            expect(deleteShader.mock.calls).toEqual([
                [vShader],
                [fShader],
            ]);
        });
    });
});
