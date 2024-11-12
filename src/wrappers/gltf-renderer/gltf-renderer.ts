import type {
    GlTFRendererParams, GlTFRendererData, GlTFRendererRawData, GlTFRendererUrlData,
} from './gltf-renderer.types';
import type { GlTFResolveUriFunc } from '../../gltf/parse.types';
import type { Vec3 } from '../../geometry/vec3.types';
import type { Mat4, Mat4Mut } from '../../geometry/mat4.types';
import type { Runtime } from '../../gl/runtime';
import type { PrimitiveWrapper } from './primitive.types';
import type { Program } from '../../gl/program';
import type { Texture } from '../../gl/texture-2d';
import { BaseObject } from '../../gl/base-object';
import { Loader } from '../../common/loader';
import { vec3, norm3 } from '../../geometry/vec3';
import { mat4, identity4x4, clone4x4, inverse4x4 } from '../../geometry/mat4';
import { toStr } from '../../utils/string-formatter';
import { parseGlTF } from '../../gltf/parse';
import { processScene, destroyScene } from './scene';
import { createPrograms, destroyPrograms } from './program';
import { createTextures, destroyTextures } from './texture';

function isRawData(data: GlTFRendererData): data is GlTFRendererRawData {
    return data && ArrayBuffer.isView((data as GlTFRendererRawData).data);
}

function isUrlData(data: GlTFRendererData): data is GlTFRendererUrlData {
    return data && typeof (data as GlTFRendererUrlData).url === 'string';
}

export class GlTFRenderer extends BaseObject {
    private readonly _runtime: Runtime;
    private readonly _loader: Loader = new Loader();
    private readonly _wrappers: PrimitiveWrapper[] = [];
    private readonly _programs: Program[] = [];
    private readonly _textures: Texture[] = [];
    private _changeTracker: number = 0;
    private _projMat: Mat4 = identity4x4();
    private _viewMat: Mat4 = identity4x4();
    private _eyePosition: Vec3 = vec3(0, 0, 0);
    private _lightDirection: Vec3 = norm3(vec3(0, -0.4, -1));

    constructor(params: GlTFRendererParams) {
        super({ logger: params.runtime.logger(), ...params });
        this._runtime = params.runtime;
    }

    dispose(): void {
        this._loader.dispose();
        this._reset();
        this._dispose();
    }

    private async _load(url: string): Promise<ArrayBufferView> {
        const buffer = await this._loader.load<ArrayBuffer>(url);
        return new Uint8Array(buffer);
    }

    async setData(data: GlTFRendererData): Promise<void> {
        const tracker = ++this._changeTracker;
        const { source, resolveUri } = await this._processData(data);
        try {
            const asset = await parseGlTF(source, resolveUri);
            // For parallel `setData` requests. Last one wins.
            if (this._changeTracker !== tracker) {
                return;
            }
            const wrappers = processScene(asset, this._runtime);
            const programs = createPrograms(wrappers, this._runtime);
            const textures = await createTextures(asset, this._runtime);
            this._setup(wrappers, programs, textures);
        } catch (err) {
            throw this._logError(err as Error);
        }
    }

    private async _processData(
        data: GlTFRendererData,
    ): Promise<{ source: ArrayBufferView, resolveUri: GlTFResolveUriFunc }> {
        if (!data) {
            throw this._logError('set_data: not defined');
        }
        if (isRawData(data)) {
            const source = data.data;
            const resolveUri: GlTFResolveUriFunc = (uri) => {
                const content = data.additionalData?.[uri];
                if (content) {
                    return Promise.resolve(content);
                }
                return Promise.reject(new Error(`${uri} is not provided`));
            };
            return { source, resolveUri };
        }
        if (isUrlData(data)) {
            const source = await this._load(data.url);
            const baseUrl = data.url.substring(0, data.url.lastIndexOf('/') + 1);
            const resolveUri: GlTFResolveUriFunc = (uri) => this._load(baseUrl + uri);
            return { source, resolveUri };
        }
        throw this._logError(`set_data(${toStr(data)}): bad value`);
    }

    private _reset(): void {
        destroyScene(this._wrappers);
        destroyPrograms(this._programs);
        destroyTextures(this._textures);
    }

    private _setup(
        wrappers: ReadonlyArray<PrimitiveWrapper>,
        programs: ReadonlyArray<Program>,
        textures: ReadonlyArray<Texture>,
    ): void {
        this._reset();
        this._wrappers.length = 0;
        this._wrappers.push(...wrappers);
        this._programs.length = 0;
        this._programs.push(...programs);
        this._textures.length = 0;
        this._textures.push(...textures);
    }

    setProjMat(mat: Mat4): void {
        this._logInfo(`set_proj_mat(${toStr(mat)})`);
        this._projMat = clone4x4(mat);
    }

    setViewMat(mat: Mat4): void {
        this._logInfo(`set_view_mat(${toStr(mat)})`);
        this._viewMat = clone4x4(mat);
        const invViewMat = inverse4x4(this._viewMat, _m4_scratch as Mat4Mut);
        this._eyePosition = vec3(invViewMat[12], invViewMat[13], invViewMat[14]);
    }

    setLightDirection(lightDirection: Vec3): void {
        this._logInfo(`set_light_direction(${toStr(lightDirection)})`);
        this._lightDirection = norm3(lightDirection);
    }

    render(): void {
        for (let i = 0; i < this._textures.length; ++i) {
            this._runtime.setTextureUnit(i, this._textures[i]);
        }
        for (const wrapper of this._wrappers) {
            this._renderPrimitive(wrapper);
        }
    }

    private _renderPrimitive(wrapper: PrimitiveWrapper): void {
        const program = wrapper.primitive.program();
        program.setUniform('u_proj_mat', this._projMat);
        program.setUniform('u_view_mat', this._viewMat);
        program.setUniform('u_world_mat', wrapper.matrix);
        const { material } = wrapper;
        if (material) {
            program.setUniform('u_normal_mat', wrapper.normalMatrix);
            program.setUniform('u_eye_position', this._eyePosition);
            program.setUniform('u_light_direction', this._lightDirection);
            program.setUniform('u_material_base_color', material.baseColorFactor);
            program.setUniform('u_material_roughness', material.roughnessFactor);
            program.setUniform('u_material_metallic', material.metallicFactor);
            if (material.baseColorTextureIndex !== undefined) {
                program.setUniform('u_base_color_texture', material.baseColorTextureIndex);
            }
            if (material.metallicRoughnessTextureIndex !== undefined) {
                program.setUniform('u_metallic_roughness_texture', material.metallicRoughnessTextureIndex);
            }
        }
        wrapper.primitive.render();
    }
}

const _m4_scratch = mat4();
