import type { GlTFRendererData, GlTFRendererRawData, GlTFRendererUrlData } from './gltf-renderer.types';
import type { Runtime } from '../gl/runtime';
import { BaseWrapper } from '../gl/base-wrapper';
import { parseGlTF } from '../alg/gltf';

function isRawData(data: GlTFRendererData): data is GlTFRendererRawData {
    return data && ArrayBuffer.isView((data as GlTFRendererRawData).data);
}

function isUrlData(data: GlTFRendererData): data is GlTFRendererUrlData {
    return data && typeof (data as GlTFRendererUrlData).url === 'string';
}

export class GlbRenderer extends BaseWrapper {
    constructor(runtime: Runtime, tag?: string) {
        super(runtime.logger(), tag);
    }

    async setData(data: GlTFRendererData): Promise<void> {
        if (!data) {
            throw this._logger.error('set_data: null');
        }
        let source: ArrayBufferView;
        if (isRawData(data)) {
            source = data.data;
        } else if (isUrlData(data)) {
            source = await load(data.url);
        } else {
            throw this._logger.error('set_data({0}): bad value', data);
        }
        // TODO...
        const asset = parseGlTF(source);
        debugger
    }
}

async function load(url: string): Promise<ArrayBufferView> {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    return new Uint8Array(buffer);
}
