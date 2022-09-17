import type {
    ImageRendererImageData, ImageRendererRawImageData, ImageRendererUrlImageData,
} from './types/image-renderer';
import type { Vec2 } from '../geometry/types/vec2';
import { Runtime } from '../gl/runtime';
import { Primitive } from '../gl/primitive';
import { Program } from '../gl/program';
import { Texture } from '../gl/texture';
import { parseVertexSchema } from '../gl/vertex-schema';

const VERT_SHADER = `// #
attribute vec2 a_position;

varying vec2 v_texcoord;

void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texcoord = (a_position + vec2(1.0)) / 2.0;
}
`;
const FRAG_SHADER = `// #
precision mediump float;

varying vec2 v_texcoord;

uniform sampler2D u_texture;

void main() {
    gl_FragColor = texture2D(u_texture, v_texcoord);
}
`;

function isRawData(data: ImageRendererImageData): data is ImageRendererRawImageData {
    return 'size' in data && 'data' in data;
}

function isUrlData(data: ImageRendererImageData): data is ImageRendererUrlImageData {
    return 'url' in data;
}

export class ImageRenderer {
    private readonly _runtime: Runtime;
    private readonly _primitive: Primitive;
    private readonly _texture: Texture;
    private _textureUnit: number;

    constructor(runtime: Runtime) {
        this._runtime = runtime;
        this._primitive = this._createPrimitive();
        this._texture = this._createTexture();
        this._textureUnit = 0;
    }

    dispose(): void {
        this._primitive.dispose();
        this._primitive.program().dispose();
        this._texture.dispose();
    }

    private _createPrimitive(): Primitive {
        const primitive = new Primitive(this._runtime);
        const vertices = new Float32Array([
            -1, -1,
            +1, -1,
            +1, +1,
            -1, +1,
        ]);
        const indices = new Uint16Array([
            0, 1, 2,
            2, 3, 0,
        ]);
        const schema = parseVertexSchema([
            { name: 'a_position', type: 'float2' },
        ]);
        primitive.allocateVertexBuffer(vertices.byteLength);
        primitive.updateVertexData(vertices);
        primitive.allocateIndexBuffer(indices.byteLength);
        primitive.updateIndexData(indices);
        primitive.setVertexSchema(schema);
        primitive.setIndexData({ indexCount: indices.length });

        const program = new Program(this._runtime, {
            vertShader: VERT_SHADER,
            fragShader: FRAG_SHADER,
            schema,
        });
        primitive.setProgram(program);
        return primitive;
    }

    private _createTexture(): Texture {
        const texture = new Texture(this._runtime);
        texture.setParameters({
            mag_filter: 'nearest',
            min_filter: 'nearest',
            wrap_s: 'clamp_to_edge',
            wrap_t: 'clamp_to_edge',
        });
        texture.setImageData({ data: null, size: { x: 1, y: 1 }});
        return texture;
    }

    size(): Vec2 {
        return this._texture.size();
    }

    async setImageData(data: ImageRendererImageData): Promise<void> {
        if (isRawData(data)) {
            this._texture.setImageData(data, { unpackFlipY: true });
        } else if (isUrlData(data)) {
            const img = await loadImage(data.url);
            this._texture.setImageData(img, { unpackFlipY: true });
        } else {
            this._texture.setImageData(data);
        }
    }

    useTextureUnit(unit: number): void {
        this._textureUnit = unit;
    }

    render(): void {
        this._runtime.setTextureUnit(this._textureUnit, this._texture);
        this._primitive.program().setUniform('u_texture', this._textureUnit);
        this._primitive.render();
    }
}

function loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.src = url;
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', reject);
    });
}
