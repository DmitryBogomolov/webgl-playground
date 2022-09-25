import type {
    ImageRendererImageData, ImageRendererRawImageData, ImageRendererUrlImageData, ImageRendererLocation,
} from './types/image-renderer';
import type { Vec2 } from '../geometry/types/vec2';
import type { Mat4 } from '../geometry/types/mat4';
import type { TextureData } from '../gl/types/texture';
import { vec3 } from '../geometry/vec3';
import {
    mat4, apply4x4, identity4x4, orthographic4x4, scaling4x4, zrotation4x4, translation4x4,
} from '../geometry/mat4';
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
    private _matDirty: boolean = true;
    private readonly _texmat: Mat4 = mat4();
    private _texmatDirty: boolean = true;

    constructor(runtime: Runtime, tag?: string) {
        super(tag);
        this._runtime = runtime;
        this._primitive = this._createPrimitive(tag);
        this._texture = this._createTexture(tag);
        this._runtime.viewportChanged().on(this._handleViewportChanged);
    }

    dispose(): void {
        this._runtime.viewportChanged().off(this._handleViewportChanged);
        this._primitive.dispose();
        this._primitive.program().dispose();
        this._texture.dispose();
    }

    private readonly _handleViewportChanged = (): void => {
        this._matDirty = true;
    };

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
        this._matDirty = this._texmatDirty = true;
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

    getRegion(): ImageRendererLocation {
        return this._region;
    }

    setRegion(region: ImageRendererLocation): void {
        if (!region) {
            throw this._logger.error('set_region: null');
        }
        this._region = { ...region };
        this._matDirty = this._texmatDirty = true;
    }

    getLocation(): ImageRendererLocation {
        return this._location;
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
        this._location = { ...location };
        this._matDirty = true;
    }

    private _updateMatrix(): void {
        if (this._matDirty) {
            updateLocationMatrix(
                this._mat, this._runtime.viewportSize(), this._texture.size(), this._location, this._region);
            this._matDirty = false;
        }
        if (this._texmatDirty) {
            updateRegionMatrix(this._texmat, this._texture.size(), this._region);
            this._texmatDirty = false;
        }
    }

    render(): void {
        this._runtime.setTextureUnit(this._textureUnit, this._texture);
        this._updateMatrix();
        const program = this._primitive.program();
        program.setUniform('u_mat', this._mat);
        program.setUniform('u_texmat', this._texmat);
        program.setUniform('u_texture', this._textureUnit);
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

function getRange(
    viewportSize: number, textureSize: number, offset1: number | undefined, offset2: number | undefined,
): [number, number] {
    const p1 = offset1 !== undefined ? -viewportSize / 2 + offset1 : undefined;
    const p2 = offset2 !== undefined ? +viewportSize / 2 - offset2 : undefined;
    return [p1 === undefined ? p2! - textureSize : p1, p2 === undefined ? p1! + textureSize : p2];
}

function getActualSize(
    textureSize: number, offset1: number | undefined, offset2: number | undefined,
): number {
    const size = textureSize - Math.min(offset1 || 0, textureSize) - Math.min(offset2 || 0, textureSize);
    return Math.abs(size);
}

function updateLocationMatrix(
    mat: Mat4, viewportSize: Vec2, textureSize: Vec2,
    location: ImageRendererLocation, region: ImageRendererLocation,
): void {
    const xActual = getActualSize(textureSize.x, region.x1, region.x2);
    const yActual = getActualSize(textureSize.y, region.y1, region.y2);
    const [x1, x2] = getRange(viewportSize.x, xActual, location.x1, location.x2);
    const [y1, y2] = getRange(viewportSize.y, yActual, location.y1, location.y2);
    const xc = (x1 + x2) / 2;
    const yc = (y1 + y2) / 2;
    const kx = (x2 - x1) / 2;
    const ky = (y2 - y1) / 2;

    identity4x4(mat);
    apply4x4(mat, scaling4x4, vec3(kx, ky, 1));
    if (location.rotation !== undefined) {
        apply4x4(mat, zrotation4x4, location.rotation);
    }
    apply4x4(mat, translation4x4, vec3(xc, yc, 0));
    apply4x4(mat, orthographic4x4, {
        left: -viewportSize.x / 2,
        right: +viewportSize.x / 2,
        top: +viewportSize.y / 2,
        bottom: -viewportSize.y / 2,
        zNear: 0,
        zFar: 1,
    });
}

function updateRegionMatrix(
    mat: Mat4, textureSize: Vec2, region: ImageRendererLocation,
): void {
    const x1 = (region.x1 || 0) / textureSize.x;
    const x2 = 1 - (region.x2 || 0) / textureSize.x;
    const y1 = (region.y1 || 0) / textureSize.y;
    const y2 = 1 - (region.y2 || 0) / textureSize.y;

    identity4x4(mat);
    if (Math.abs(x2 - x1) < 1 || Math.abs(y2 - y1) < 1) {
        apply4x4(mat, scaling4x4, vec3(x2 - x1, y2 - y1, 1));
        apply4x4(mat, translation4x4, vec3(x1, y1, 0));
    }
    if (region.rotation !== undefined) {
        const xc = (x1 + x2) / 2;
        const yc = (y1 + y2) / 2;
        apply4x4(mat, translation4x4, vec3(-xc, -yc, 0));
        apply4x4(mat, zrotation4x4, region.rotation);
        apply4x4(mat, translation4x4, vec3(+xc, +yc, 0));
    }
}
