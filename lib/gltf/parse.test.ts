import type { GlTFAsset } from './asset.types';
import { parseGlTF } from './parse';

describe('parse', () => {
    class TextDecoder {
        decode(data: Uint8Array): string {
            return Buffer.from(data).toString();
        }
    }
    const _TextDecoder = global.TextDecoder;

    beforeEach(() => {
        Object.assign(global, { TextDecoder });
    });

    afterEach(() => {
        Object.assign(global, { TextDecoder: _TextDecoder });
    });

    describe('parseGlTF', () => {
        it('parse JSON', async () => {
            const data = Buffer.from('   { "asset":  {"version":"x"}  }   ');

            const asset = await parseGlTF(data);

            expect(asset).toEqual<GlTFAsset>({
                gltf: { asset: { version: 'x' } },
                buffers: new Map(),
                images: new Map(),
            });
        });

        it('parse not valid JSON', async () => {
            const data = Buffer.from('  { bad data }  ');

            await expect(() => parseGlTF(data)).rejects
                .toEqual(new SyntaxError('Unexpected token b in JSON at position 4'));
        });

        it('parse binary', async () => {
            const json = Buffer.from('   { "asset":  {"version":"x"}  } ');
            const totalLength = 12 + 8 + Math.ceil(json.length / 4) * 4;
            const data = new Uint8Array(totalLength);
            const view = new DataView(data.buffer);
            view.setUint32(0, 0x46546C67, true);
            view.setUint32(4, 2, true);
            view.setUint32(8, totalLength, true);
            view.setUint32(12, json.length, true);
            view.setUint32(16, 0x4E4F534A, true);
            for (let i = 0; i < json.length; ++i) {
                view.setUint8(20 + i, json[i]);
            }
            const asset = await parseGlTF(data);

            expect(asset).toEqual<GlTFAsset>({
                gltf: { asset: { version: 'x' } },
                buffers: new Map(),
                images: new Map(),
            });
        });

        it('parse not valid binary', async () => {
            const data = Buffer.from('bad data');

            await expect(() => parseGlTF(data)).rejects
                .toEqual(new Error('bad magic'));
        });
    });
});
