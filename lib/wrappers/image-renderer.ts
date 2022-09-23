import type {
    ImageRendererImageData, ImageRendererRawImageData, ImageRendererUrlImageData, ImageRendererLocation,
} from './types/image-renderer';
import type { Vec2 } from '../geometry/types/vec2';
import type { Mat4 } from '../geometry/types/mat4';
import type { TextureData } from '../gl/types/texture';
import { ZERO2 } from '../geometry/vec2';
import { vec3 } from '../geometry/vec3';
import { mat4, apply4x4, identity4x4, orthographic4x4, scaling4x4, zrotation4x4, translation4x4, lookAt4x4 } from '../geometry/mat4';
import { BaseWrapper } from '../gl/base-wrapper';
import { Runtime } from '../gl/runtime';
import { Primitive } from '../gl/primitive';
import { Program } from '../gl/program';
import { Texture } from '../gl/texture';
import { parseVertexSchema } from '../gl/vertex-schema';

const VERT_SHADER = `
attribute vec2 a_position;
uniform mat4 u_mat;
uniform mat4 u_texmat;
varying vec2 v_texcoord;
void main() {
    gl_Position = u_mat * vec4(a_position, 0.0, 1.0);
    vec2 texcoord = (a_position + vec2(1.0)) / 2.0;
    v_texcoord = (u_texmat * vec4(texcoord, 0.0, 1.0)).xy;
}
`;
const FRAG_SHADER = `
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
    private _region: ImageRendererLocation = {};
    private _location: ImageRendererLocation = {};
    private readonly _mat: Mat4 = mat4();
    private _position: Vec2 = ZERO2;
    private _size: Vec2 | null = null;
    private _rotation: number = 0;

    constructor(runtime: Runtime, tag?: string) {
        super(tag);
        this._runtime = runtime;
        this._primitive = this._createPrimitive(tag);
        this._texture = this._createTexture(tag);
    }

    dispose(): void {
        this._primitive.dispose();
        this._primitive.program().dispose();
        this._texture.dispose();
    }

    private _createPrimitive(tag?: string): Primitive {
        const primitive = new Primitive(this._runtime, tag);
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
        }, tag);
        primitive.setProgram(program);
        return primitive;
    }

    private _createTexture(tag?: string): Texture {
        const texture = new Texture(this._runtime, tag);
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
        if (!data) {
            throw this._logger.error('set_image_data: null');
        }
        let imageData: TextureData | TexImageSource;
        let unpackFlipY = false;
        let log: string;
        if (isRawData(data)) {
            log = 'raw';
            imageData = data;
            unpackFlipY = true;
        } else if (isUrlData(data)) {
            log = `url(${data.url})`;
            const img = await loadImage(data.url);
            imageData = img;
            unpackFlipY = true;
        } else {
            log = 'tex_image_source';
            imageData = data;
        }
        this._logger.log('set_image_data({0})', log);
        this._texture.setImageData(imageData, { unpackFlipY });
    }

    getTextureUnit(): number {
        return this._textureUnit;
    }

    setTextureUnit(unit: number): void {
        if (!(unit >= 0)) {
            throw this._logger.error('set_texture_unit({0}): bad value', unit);
        }
        if (this._textureUnit === unit) {
            return;
        }
        this._logger.log('set_texture_unit({0})', unit);
        this._textureUnit = unit;
    }

    setRegion(region: ImageRendererLocation): void {
        if (!region) {
            throw this._logger.error('set_region: null');
        }
        this._region = {...region};
    }

    setLocation(location: ImageRendererLocation): void {
        if (!location) {
            throw this._logger.error('set_location: null');
        }
        if (
            (location.x1 === undefined && location.x2 === undefined) ||
            (location.y1 === undefined && location.y2 === undefined)
        ) {
            throw this._logger.error('set_location: not enough data');
        }
        this._location = {...location};
    }

    private _updateMatrix(): void {
        const { x: xViewport, y: yViewport } = this._runtime.viewportSize();
        let { x: xTexture, y: yTexture } = this._texture.size();
        // const region = this._region;
        const location = this._location;

        let x1 = location.x1 !== undefined ? location.x1 : location.x2! - xTexture;
        let x2 = location.x2 !== undefined ? location.x2 : location.x1! + xTexture;
        let y1 = location.y1 !== undefined ? location.y1 : location.y2! - yTexture;
        let y2 = location.y2 !== undefined ? location.y2 : location.y1! + yTexture;

        const xc = (x1 + x2) / 2;
        const yc = (y1 + y2) / 2;
        const kx = (x2 - x1) / 2;
        const ky = (y2 - y1) / 2;

        const mat = this._mat;
        identity4x4(mat);
        apply4x4(mat, scaling4x4, vec3(kx, ky, 1));
        if (location.rotation !== undefined) {
            apply4x4(mat, zrotation4x4, location.rotation);
        }
        apply4x4(mat, translation4x4, vec3(xc, yc, 0));
        apply4x4(mat, orthographic4x4, {
            left: -xViewport / 2,
            right: +xViewport / 2,
            top: +yViewport / 2,
            bottom: -yViewport / 2,
            zNear: 0,
            zFar: 1,
        });
    }

    // getPosition(): Vec2 {
    //     return this._position;
    // }

    // setPosition(position: Vec2): void {
    //     if (eq2(this._position, position)) {
    //         return;
    //     }
    //     this._logger.log('set_position(x: {0}, y: {1})', position.x, position.y);
    //     this._position = position;
    // }

    // getSize(): Vec2 | null {
    //     return this._size;
    // }

    // setSize(size: Vec2 | null): void {
    //     if ((this._size && size && eq2(this._size, size)) || (this._size === size)) {
    //         return;
    //     }
    //     this._logger.log(size ? 'set_size(x: {0}, y: {1})' : 'set_size(null)', size && size.x, size && size.y);
    //     this._size = size;
    // }

    // getRotation(): number {
    //     return this._rotation;
    // }

    // setRotation(rotation: number): void {
    //     if (this._rotation === rotation) {
    //         return;
    //     }
    //     this._logger.log('set_rotation({0})', rotation);
    //     this._rotation = rotation;
    // }

    render(): void {
        this._runtime.setTextureUnit(this._textureUnit, this._texture);


        this._updateMatrix();

        // const { x: xViewport, y: yViewport } = this._runtime.viewportSize();
        // const { x: xOffset, y: yOffset } = this._position;
        // const { x: xSize, y: ySize } = this._size || this._texture.size();

        // const mat = identity4x4();
        // apply4x4(mat, scaling4x4, vec3(xSize / 2, ySize / 2, 1));
        // apply4x4(mat, zrotation4x4, this._rotation);
        // apply4x4(mat, translation4x4, vec3(xOffset, yOffset, 0));
        // apply4x4(mat, orthographic4x4, {
        //     left: -xViewport / 2,
        //     right: +xViewport / 2,
        //     top: +yViewport / 2,
        //     bottom: -yViewport / 2,
        //     zNear: 0,
        //     zFar: 1,
        // });

        // const texMat = identity4x4();
        // apply4x4(texMat, translation4x4, vec3(-0.5, -0.5, 0));
        // //apply4x4(texMat, scaling4x4, vec3(0.8, 1, 0));
        // apply4x4(texMat, zrotation4x4, Math.PI / 2);
        // // apply4x4(texMat, translation4x4, vec3(0.1, 0, 0));
        // apply4x4(texMat, translation4x4, vec3(+0.5, +0.5, 0));

        this._primitive.program().setUniform('u_mat', this._mat);
        this._primitive.program().setUniform('u_texmat', identity4x4());
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
