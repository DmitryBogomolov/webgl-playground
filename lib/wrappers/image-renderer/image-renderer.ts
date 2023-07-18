import type {
    ImageRendererImageData, ImageRendererRawImageData, ImageRendererUrlImageData,
    ImageRendererRegion, ImageRendererLocation,
} from './image-renderer.types';
import type { Vec2 } from '../../geometry/vec2.types';
import type { Mat4, Mat4Mut } from '../../geometry/mat4.types';
import type { TextureImageData } from '../../gl/texture-2d.types';
import type { Runtime } from '../../gl/runtime';
import type { PrimitiveVertexSchema } from '../../gl/primitive.types';
import { eq2, isVec2 } from '../../geometry/vec2';
import { vec3 } from '../../geometry/vec3';
import {
    mat4, apply4x4, identity4x4, orthographic4x4, scaling4x4, zrotation4x4, translation4x4,
} from '../../geometry/mat4';
import { BaseDisposable } from '../../common/base-disposable';
import { Primitive } from '../../gl/primitive';
import { Program } from '../../gl/program';
import { Texture } from '../../gl/texture-2d';
import { parseVertexSchema } from '../../gl/vertex-schema';
import { memoize } from '../../utils/memoizer';
import { makeImage } from '../../utils/image-maker';
import vertShader from './shaders/shader.vert';
import fragShader from './shaders/shader.frag';

function isRawData(data: ImageRendererImageData): data is ImageRendererRawImageData {
    return data
        && isVec2((data as ImageRendererRawImageData).size)
        && ArrayBuffer.isView((data as ImageRendererRawImageData).data);
}

function isUrlData(data: ImageRendererImageData): data is ImageRendererUrlImageData {
    return data && typeof (data as ImageRendererUrlImageData).url === 'string';
}

export class ImageRenderer extends BaseDisposable {
    private readonly _runtime: Runtime;
    private readonly _primitive: Primitive;
    private readonly _texture: Texture;
    private _textureUnit: number = 0;
    private _renderTargetSize: Vec2;
    private _region: ImageRendererRegion = {};
    private _location: ImageRendererLocation = { x1: 0, y1: 0 };
    private readonly _mat: Mat4 = mat4();
    private _matDirty: boolean = true;
    private readonly _texmat: Mat4 = mat4();
    private _texmatDirty: boolean = true;

    constructor(runtime: Runtime, tag?: string) {
        super(runtime.logger(), tag);
        this._runtime = runtime;
        this._primitive = this._createPrimitive();
        this._texture = this._createTexture(tag);
        this._renderTargetSize = this._runtime.getRenderTarget().size();
    }

    dispose(): void {
        this._texture.dispose();
        releasePrimitive(this._runtime);
        this._emitDisposed();
    }

    private readonly _updateLocationMatrix = memoize(updateLocationMatrix, compareUpdateLocationMatrixArgs);
    private readonly _updateRegionMatrix = memoize(updateRegionMatrix, compareUpdateRegionMatrixArgs);

    private _createPrimitive(): Primitive {
        return lockPrimitive(this._runtime);
    }

    private _createTexture(tag: string | undefined): Texture {
        const texture = new Texture(this._runtime, tag);
        texture.setParameters({
            mag_filter: 'nearest',
            min_filter: 'nearest',
        });
        texture.setImageData({ data: null, size: { x: 1, y: 1 } });
        return texture;
    }

    imageSize(): Vec2 {
        return this._texture.size();
    }

    async setImageData(data: ImageRendererImageData): Promise<void> {
        if (!data) {
            throw this._logger.error('set_image_data: not defined');
        }
        let imageData: TextureImageData;
        let unpackFlipY = false;
        let log: string;
        if (isRawData(data)) {
            log = 'raw';
            imageData = data;
            unpackFlipY = true;
        } else if (isUrlData(data)) {
            log = `url(${data.url})`;
            const img = await makeImage({ url: data.url });
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

    getRegion(): ImageRendererRegion {
        return this._region;
    }

    setRegion(region: ImageRendererRegion): void {
        if (!region) {
            throw this._logger.error('set_region: not defined');
        }
        if (compareRegions(this._region, region)) {
            return;
        }
        this._logger.log('set_region({0})', region);
        this._region = { ...region };
        this._matDirty = this._texmatDirty = true;
    }

    getLocation(): ImageRendererLocation {
        return this._location;
    }

    setLocation(location: ImageRendererLocation): void {
        if (!location) {
            throw this._logger.error('set_location: not defined');
        }
        if (
            (location.x1 === undefined && location.x2 === undefined) ||
            (location.y1 === undefined && location.y2 === undefined)
        ) {
            throw this._logger.error('set_location: not enough data {0}', location);
        }
        if (compareLocations(this._location, location)) {
            return;
        }
        this._logger.log('set_location({0})', location);
        this._location = { ...location };
        this._matDirty = true;
    }

    private _updateMatrix(): void {
        if (this._matDirty) {
            this._updateLocationMatrix(
                this._mat as Mat4Mut, this._renderTargetSize, this._texture.size(), this._location, this._region);
            this._matDirty = false;
        }
        if (this._texmatDirty) {
            this._updateRegionMatrix(this._texmat as Mat4Mut, this._texture.size(), this._region);
            this._texmatDirty = false;
        }
    }

    render(): void {
        if (!eq2(this._runtime.getRenderTarget().size(), this._renderTargetSize)) {
            this._renderTargetSize = this._runtime.getRenderTarget().size();
            this._matDirty = true;
        }
        this._updateMatrix();
        this._runtime.setTextureUnit(this._textureUnit, this._texture);
        const program = this._primitive.program();
        program.setUniform('u_mat', this._mat);
        program.setUniform('u_texmat', this._texmat);
        program.setUniform('u_texture', this._textureUnit);
        this._primitive.render();
    }
}

function compareRegions(lhs: ImageRendererRegion, rhs: ImageRendererRegion): boolean {
    return lhs.x1 === rhs.x1 && lhs.x2 === rhs.x2 && lhs.y1 === rhs.y1 && lhs.y2 === rhs.y2
        && lhs.rotation === rhs.rotation;
}

function compareLocations(lhs: ImageRendererLocation, rhs: ImageRendererLocation): boolean {
    return compareRegions(lhs, rhs) && lhs.width === rhs.width && lhs.height === rhs.height;
}

function getRange(
    viewportSize: number, textureSize: number,
    offset1: number | undefined, offset2: number | undefined, size: number | undefined,
): [number, number] {
    const p1 = offset1 !== undefined ? -viewportSize / 2 + offset1 : undefined;
    const p2 = offset2 !== undefined ? +viewportSize / 2 - offset2 : undefined;
    const ps = size !== undefined ? size : textureSize;
    return [p1 === undefined ? p2! - ps : p1, p2 === undefined ? p1! + ps : p2];
}

function getActualSize(
    textureSize: number, offset1: number | undefined, offset2: number | undefined,
): number {
    const size = textureSize - Math.min(offset1 || 0, textureSize) - Math.min(offset2 || 0, textureSize);
    return Math.abs(size);
}

function compareUpdateLocationMatrixArgs(
    lhs: [Mat4, Vec2, Vec2, ImageRendererLocation, ImageRendererRegion],
    rhs: [Mat4, Vec2, Vec2, ImageRendererLocation, ImageRendererRegion],
): boolean {
    return eq2(lhs[1], rhs[1]) && eq2(lhs[2], rhs[2]) && lhs[3] === rhs[3] && lhs[4] === rhs[4];
}

function updateLocationMatrix(
    mat: Mat4Mut, viewportSize: Vec2, textureSize: Vec2,
    location: ImageRendererLocation, region: ImageRendererRegion,
): void {
    // Because of "region" options actual texture size may be less than original texture.
    const xActual = getActualSize(textureSize.x, region.x1, region.x2);
    const yActual = getActualSize(textureSize.y, region.y1, region.y2);
    // Image boundaries in "[-x / 2, +x / 2] * [-y / 2, +y / 2]" viewport space.
    const [x1, x2] = getRange(viewportSize.x, xActual, location.x1, location.x2, location.width);
    const [y1, y2] = getRange(viewportSize.y, yActual, location.y1, location.y2, location.height);
    // Image center in viewport space.
    const xc = (x1 + x2) / 2;
    const yc = (y1 + y2) / 2;
    // Image size in viewport space.
    const kx = (x2 - x1) / 2;
    const ky = (y2 - y1) / 2;

    identity4x4(mat);
    // Common set of scale / rotate / translate transformations.
    apply4x4(mat, scaling4x4, vec3(kx, ky, 1));
    if (location.rotation !== undefined) {
        apply4x4(mat, zrotation4x4, location.rotation);
    }
    apply4x4(mat, translation4x4, vec3(xc, yc, 0));
    // Apply viewport space.
    apply4x4(mat, orthographic4x4, {
        left: -viewportSize.x / 2,
        right: +viewportSize.x / 2,
        top: +viewportSize.y / 2,
        bottom: -viewportSize.y / 2,
        zNear: 0,
        zFar: 1,
    });
}

function compareUpdateRegionMatrixArgs(
    lhs: [Mat4, Vec2, ImageRendererRegion],
    rhs: [Mat4, Vec2, ImageRendererRegion],
): boolean {
    return eq2(lhs[1], rhs[1]) && lhs[2] === rhs[2];
}

function updateRegionMatrix(
    mat: Mat4Mut, textureSize: Vec2, region: ImageRendererRegion,
): void {
    // Texture part boundaries in "[0, 1] * [0, 1]" space.
    const x1 = (region.x1 || 0) / textureSize.x;
    const x2 = 1 - (region.x2 || 0) / textureSize.x;
    const y1 = (region.y1 || 0) / textureSize.y;
    const y2 = 1 - (region.y2 || 0) / textureSize.y;

    identity4x4(mat);
    // Bring "[0, 1] * [0, 1]" to "[x1, x2] * [y1, y2]".
    // t' = t * (q - p) + p; "q - p" - scale component, "p" - translation component.
    if (Math.abs(x2 - x1) < 1 || Math.abs(y2 - y1) < 1) {
        apply4x4(mat, scaling4x4, vec3(x2 - x1, y2 - y1, 1));
        apply4x4(mat, translation4x4, vec3(x1, y1, 0));
    }
    // Rotate around center - translate to center, rotate, translate back.
    if (region.rotation !== undefined) {
        const xc = (x1 + x2) / 2;
        const yc = (y1 + y2) / 2;
        apply4x4(mat, translation4x4, vec3(-xc, -yc, 0));
        apply4x4(mat, zrotation4x4, region.rotation);
        apply4x4(mat, translation4x4, vec3(+xc, +yc, 0));
    }
}

interface SharedPrimitive {
    readonly primitive: Primitive;
    refCount: number;
}

const primitivesCache = new Map<Runtime, SharedPrimitive>();

function lockPrimitive(runtime: Runtime): Primitive {
    let shared = primitivesCache.get(runtime);
    if (!shared) {
        shared = {
            primitive: createPrimitive(runtime, `ImageRenderer:shared:${runtime.id()}`),
            refCount: 0,
        };
        primitivesCache.set(runtime, shared);
    }
    ++shared.refCount;
    return shared.primitive;
}

function releasePrimitive(runtime: Runtime): void {
    const shared = primitivesCache.get(runtime);
    if (!shared) {
        throw new Error('shared primitive not found');
    }
    --shared.refCount;
    if (shared.refCount === 0) {
        destroyPrimitive(shared.primitive);
        primitivesCache.delete(runtime);
    }
}

function createPrimitive(runtime: Runtime, tag: string | undefined): Primitive {
    const primitive = new Primitive(runtime, tag);
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
    // const schema = parseVertexSchema([
    //     { name: 'a_position', type: 'float2' },
    // ]);
    const schema2: PrimitiveVertexSchema = {
        attrs: [{ type: 'float2' }],
    };
    primitive.allocateVertexBuffer(vertices.byteLength);
    primitive.updateVertexData(vertices);
    primitive.allocateIndexBuffer(indices.byteLength);
    primitive.updateIndexData(indices);
    primitive.setVertexSchema(schema2);
    primitive.setIndexConfig({ indexCount: indices.length });

    const program = new Program(runtime, {
        vertShader,
        fragShader,
        // schema,
    }, tag);
    primitive.setProgram(program);
    return primitive;
}

function destroyPrimitive(primitive: Primitive): void {
    primitive.program().dispose();
    primitive.dispose();
}
