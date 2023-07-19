import type { Runtime } from 'lib';
import { Primitive, Program, Texture } from 'lib';
import vertShader from './shaders/label.vert';
import fragShader from './shaders/label.frag';

export function makeLabelPrimitive(runtime: Runtime): Primitive {
    const vertexData = new Float32Array([
        -1, -1,
        +1, -1,
        +1, +1,
        -1, +1,
    ]);
    const indexData = new Uint16Array([
        0, 1, 2,
        2, 3, 0,
    ]);

    const primitive = new Primitive(runtime);
    primitive.allocateVertexBuffer(vertexData.byteLength);
    primitive.updateVertexData(vertexData);
    primitive.allocateIndexBuffer(indexData.byteLength);
    primitive.updateIndexData(indexData);
    primitive.setVertexSchema({
        attributes: [{ type: 'float2' }],
    });
    primitive.setIndexConfig({
        indexCount: indexData.length,
    });

    const program = new Program(runtime, {
        vertShader,
        fragShader,
    });
    primitive.setProgram(program);

    return primitive;
}

export function makeLabelTexture(runtime: Runtime, text: string, fontSize: number): Texture {
    const texture = new Texture(runtime);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const font = `${fontSize}px Verdana`;
    ctx.font = font;
    const width = Math.ceil(ctx.measureText(text).width) + 2;
    canvas.width = width;
    canvas.height = fontSize;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FFF';
    ctx.font = font;
    ctx.fillText(text, width / 2, fontSize / 2);

    texture.setImageData(canvas, { unpackFlipY: true, unpackPremultiplyAlpha: true });
    // runtime.canvas().parentElement!.parentElement!.appendChild(canvas);

    return texture;
}
