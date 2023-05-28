import type { GlbRendererData, GlbRendererRawData, GlbRendererUrlData } from './glb-renderer.types';
import type { Runtime } from '../gl/runtime';
import { BaseWrapper } from '../gl/base-wrapper';
import { parseGlTF } from '../alg/glb';

function isRawData(data: GlbRendererData): data is GlbRendererRawData {
    return data && ArrayBuffer.isView((data as GlbRendererRawData).data);
}

function isUrlData(data: GlbRendererData): data is GlbRendererUrlData {
    return data && typeof (data as GlbRendererUrlData).url === 'string';
}

export class GlbRenderer extends BaseWrapper {
    constructor(runtime: Runtime, tag?: string) {
        super(runtime.logger(), tag);
    }

    async setData(data: GlbRendererData): Promise<void> {
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
