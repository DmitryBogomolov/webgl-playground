import {
    Runtime,
    Texture,
} from 'lib';

export function makeTexture(runtime: Runtime, _onReady: () => void): Texture {
    const texture = new Texture(runtime);

    return texture;
}
