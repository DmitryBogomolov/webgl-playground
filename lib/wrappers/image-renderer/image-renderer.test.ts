import type { Runtime } from '../../gl/runtime';
import type { RenderTarget } from '../../gl/render-target.types';
import type { Vec2 } from '../../geometry/vec2.types';
import type { Logger } from '../../common/logger.types';
import { ImageRenderer } from './image-renderer';

import { Primitive } from '../../gl/primitive';
import { Program } from '../../gl/program';
import { Texture } from '../../gl/texture-2d';
import { makeImage } from '../../utils/image-maker';

jest.mock('../../gl/primitive');
jest.mock('../../gl/program');
jest.mock('../../gl/texture-2d');
jest.mock('../../utils/image-maker');

describe('image-renderer', () => {
    describe('ImageRenderer', () => {
        const MockPrimitive = Primitive as jest.Mock<Primitive>;
        const MockProgram = Program as jest.Mock<Program>;
        const MockTexture = Texture as jest.Mock<Texture>;

        class StubLogger implements Logger {
            log(): string {
                return '';
            }
            warn(): string {
                return '';
            }
            error(): Error {
                return new Error('');
            }
        }
        const stubLogger = new StubLogger();

        let runtime: Runtime;
        let renderTargetSize: Vec2;
        let renderer: ImageRenderer;
        let primitive: Primitive;
        let program: Program;
        let texture: Texture;

        beforeEach(() => {
            renderTargetSize = { x: 640, y: 480 };
            const renderTarget: RenderTarget = {
                id: () => 'stub/render-target',
                size: () => renderTargetSize,
            };
            runtime = {
                id: () => 'stub/runtime',
                logger: () => stubLogger,
                getRenderTarget: () => renderTarget,
                setTextureUnit: jest.fn(),
            } as Pick<Runtime, 'id' | 'logger' | 'getRenderTarget' | 'setTextureUnit'> as Runtime;
            renderer = new ImageRenderer(runtime, 'tag/test');
            primitive = MockPrimitive.mock.instances[0];
            program = MockProgram.mock.instances[0];
            texture = MockTexture.mock.instances[0];
            (primitive.program as jest.Mock).mockReturnValue(program);
            program.setUniform = jest.fn();
            (texture.size as jest.Mock).mockReturnValue({ x: 40, y: 30 });
        });

        afterEach(() => {
            MockPrimitive.mockReset();
            MockProgram.mockReset();
            MockTexture.mockReset();
            (makeImage as jest.Mock).mockReset();
        });

        it('create instance', () => {
            expect(MockPrimitive).toBeCalledWith(runtime, 'ImageRenderer:shared:stub/runtime');
            expect(primitive.allocateVertexBuffer).toBeCalledWith(32);
            expect(primitive.updateVertexData).toBeCalledWith(new Float32Array([-1, -1, +1, -1, +1, +1, -1, +1]));
            expect(primitive.allocateIndexBuffer).toBeCalledWith(12);
            expect(primitive.updateIndexData).toBeCalledWith(new Uint16Array([0, 1, 2, 2, 3, 0]));

            expect(MockProgram).toBeCalledWith(
                runtime,
                {
                    vertShader: expect.any(String),
                    fragShader: expect.any(String),
                    schema: expect.any(Object),
                },
                'ImageRenderer:shared:stub/runtime',
            );
            expect(primitive.setProgram).toBeCalledWith(program);

            expect(MockTexture).toBeCalledWith(runtime, 'tag/test');
            expect(texture.setParameters).toBeCalledWith({ mag_filter: 'nearest', min_filter: 'nearest' });
            expect(texture.setImageData).toBeCalledWith({ data: null, size: { x: 1, y: 1 } });
        });

        it('destroy instance', () => {
            renderer.dispose();

            expect(primitive.dispose).toBeCalledWith();
            expect(program.dispose).toBeCalledWith();
            expect(texture.dispose).toBeCalledWith();
        });

        it('initial state', () => {
            expect(renderer.imageSize()).toEqual({ x: 40, y: 30 });
            expect(renderer.getTextureUnit()).toEqual(0);
            expect(renderer.getRegion()).toEqual({});
            expect(renderer.getLocation()).toEqual({ x1: 0, y1: 0 });
        });

        it('render', () => {
            renderer.render();

            expect(program.setUniform).toHaveBeenCalledTimes(3);
            expect(program.setUniform).toHaveBeenNthCalledWith(
                1, 'u_mat', expect.numArray([0.0625, 0, 0, 0, 0, 0.0625, 0, 0, 0, 0, -2, 0, -0.9375, -0.9375, -1, 1]),
            );
            expect(program.setUniform).toHaveBeenNthCalledWith(
                2, 'u_texmat', expect.numArray([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]),
            );
            expect(program.setUniform).toHaveBeenNthCalledWith(3, 'u_texture', 0);
            expect(runtime.setTextureUnit).toHaveBeenCalledWith(0, texture);
            expect(primitive.render).toHaveBeenCalledWith();
        });

        it('set texture unit', () => {
            renderer.setTextureUnit(4);

            renderer.render();

            expect(renderer.getTextureUnit()).toEqual(4);
            expect(program.setUniform).toHaveBeenNthCalledWith(3, 'u_texture', 4);
            expect(runtime.setTextureUnit).toHaveBeenCalledWith(4, texture);
        });

        it('set region', () => {
            renderer.setRegion({ x1: 2, x2: 3, y1: 1, y2: 4 });

            renderer.render();

            expect(renderer.getRegion()).toEqual({ x1: 2, x2: 3, y1: 1, y2: 4 });
            expect(program.setUniform).toHaveBeenNthCalledWith(
                1, 'u_mat', expect.numArray([0.0547, 0, 0, 0, 0, 0.0521, 0, 0, 0, 0, -2, 0, -0.9453, -0.9479, -1, 1]),
            );
            expect(program.setUniform).toHaveBeenNthCalledWith(
                2, 'u_texmat', expect.numArray([0.875, 0, 0, 0, 0, 0.8333, 0, 0, 0, 0, 1, 0, 0.05, 0.0333, 0, 1]),
            );
        });

        it('set location', () => {
            renderer.setLocation({ x2: 110, y2: 40, width: 20, height: 10 });

            renderer.render();

            expect(renderer.getLocation()).toEqual({ x2: 110, y2: 40, width: 20, height: 10 });
            expect(program.setUniform).toHaveBeenNthCalledWith(
                1, 'u_mat', expect.numArray([0.0313, 0, 0, 0, 0, 0.0208, 0, 0, 0, 0, -2, 0, 0.625, 0.8125, -1, 1]),
            );
            expect(program.setUniform).toHaveBeenNthCalledWith(
                2, 'u_texmat', expect.numArray([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]),
            );
        });

        it('set image data / raw', async () => {
            const testData = { size: { x: 60, y: 50 }, data: new Uint8Array([1, 2, 3, 4]) };

            await renderer.setImageData(testData);

            expect(texture.setImageData).toBeCalledWith(testData, { unpackFlipY: true });
        });

        it('set image data / url', async () => {
            const testData = { tag: 'test-data' };
            (makeImage as jest.Mock).mockResolvedValue(testData);

            await renderer.setImageData({ url: '/test-url' });

            expect(makeImage).toBeCalledWith({ url: '/test-url' });
            expect(texture.setImageData).toBeCalledWith(testData, { unpackFlipY: true });
        });

        it('share primitive and program amoung all renderers', () => {
            const otherRenderer = new ImageRenderer(runtime);
            const otherTexture = MockTexture.mock.instances[1];

            expect(MockTexture).toBeCalledTimes(2);
            expect(MockPrimitive).toBeCalledTimes(1);
            expect(MockProgram).toBeCalledTimes(1);

            otherRenderer.dispose();

            expect(otherTexture.dispose).toBeCalledWith();
            expect(primitive.dispose).not.toBeCalled();
            expect(program.dispose).not.toBeCalled();
        });
    });
});
