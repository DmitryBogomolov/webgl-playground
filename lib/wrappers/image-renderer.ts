import type {
    ImageRendererImageData, ImageRendererRawImageData, ImageRendererUrlImageData,
} from './types/image-renderer';
import type { Vec2 } from '../geometry/types/vec2';
import type { TextureData } from '../gl/types/texture';
import { eq2, ZERO2 } from '../geometry/vec2';
import { vec3 } from '../geometry/vec3';
import { apply4x4, identity4x4, orthographic4x4, scaling4x4, translation4x4 } from '../geometry/mat4';
import { BaseWrapper } from '../gl/base-wrapper';
import { Runtime } from '../gl/runtime';
import { Primitive } from '../gl/primitive';
import { Program } from '../gl/program';
import { Texture } from '../gl/texture';
import { parseVertexSchema } from '../gl/vertex-schema';

const VERT_SHADER = `// #
attribute vec2 a_position;
uniform mat4 u_mat;
varying vec2 v_texcoord;
void main() {
    gl_Position = u_mat * vec4(a_position, 0.0, 1.0);
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

export class ImageRenderer extends BaseWrapper {
    private readonly _runtime: Runtime;
    private readonly _primitive: Primitive;
    private readonly _texture: Texture;
    private _textureUnit: number = 0;
    private _position: Vec2 = ZERO2;
    private _size: Vec2 | null = null;

    constructor(runtime: Runtime, tag?: string) {
        super(tag);
        this._runtime = runtime;
        this._primitive = this._createPrimitive();
        this._texture = this._createTexture();
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
        texture.setImageData({ data: null, size: { x: 1, y: 1 } });
        return texture;
    }

    imageSize(): Vec2 {
        return this._texture.size();
    }

    async setImageData(data: ImageRendererImageData): Promise<void> {
        let imageData: TextureData | TexImageSource;
        let unpackFlipY = false;
        if (isRawData(data)) {
            imageData = data;
            unpackFlipY = true;
        } else if (isUrlData(data)) {
            const img = await loadImage(data.url);
            imageData = img;
            unpackFlipY = true;
        } else {
            imageData = data;
        }
        this._texture.setImageData(imageData, { unpackFlipY });
    }

    getTextureUnit(): number {
        return this._textureUnit;
    }

    setTextureUnit(unit: number): void {
        if (this._textureUnit === unit) {
            return;
        }
        this._logger.log('set_texture_unit({0})', unit);
        this._textureUnit = unit;
    }

    getPosition(): Vec2 {
        return this._position;
    }

    setPosition(position: Vec2): void {
        if (eq2(this._position, position)) {
            return;
        }
        this._logger.log('set_position(x: {0}, y: {1})', position.x, position.y);
        this._position = position;
    }

    getSize(): Vec2 | null {
        return this._size;
    }

    setSize(size: Vec2 | null): void {
        if ((this._size === null && size === null) || eq2(this._size!, size!)) {
            return;
        }
        this._logger.log(size ? 'set_size(x: {0}, y: {1})' : 'set_size(null)', size && size.x, size && size.y);
        this._size = size;
    }

    render(): void {
        this._runtime.setTextureUnit(this._textureUnit, this._texture);

        const { x: xViewport, y: yViewport } = this._runtime.viewportSize();
        const { x: xOffset, y: yOffset } = this._position;
        const { x: xSize, y: ySize } = this._size || this._texture.size();

        const mat = identity4x4();
        apply4x4(mat, scaling4x4, vec3(xSize / 2, ySize / 2, 1));
        apply4x4(mat, translation4x4, vec3(xOffset, yOffset, 0));
        apply4x4(mat, orthographic4x4, {
            left: -xViewport / 2,
            right: +xViewport / 2,
            top: +yViewport / 2,
            bottom: -yViewport / 2,
            zNear: 0,
            zFar: 1,
        });


        this._primitive.program().setUniform('u_mat', mat);
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
