import type { Runtime } from 'lib';
import { TextureCube, TextureCubeImageData, makeImage } from 'lib';

export function makeTexture(runtime: Runtime): TextureCube {
    const texture = new TextureCube({ runtime });
    const schema: { key: keyof TextureCubeImageData; url: string }[] = [
        { key: 'xNeg', url: `${STATIC_PATH}/computer-history-museum/x-neg.jpg` },
        { key: 'xPos', url: `${STATIC_PATH}/computer-history-museum/x-pos.jpg` },
        { key: 'yNeg', url: `${STATIC_PATH}/computer-history-museum/y-neg.jpg` },
        { key: 'yPos', url: `${STATIC_PATH}/computer-history-museum/y-pos.jpg` },
        { key: 'zNeg', url: `${STATIC_PATH}/computer-history-museum/z-neg.jpg` },
        { key: 'zPos', url: `${STATIC_PATH}/computer-history-museum/z-pos.jpg` },
    ];
    const loadings = schema.map(({ key, url }) =>
        makeImage({ url }).then((image) => ({ key, image })),
    );
    Promise.all(loadings).then((items) => {
        const imageData: Record<string, HTMLImageElement> = {};
        items.forEach(({ key, image }) => {
            imageData[key] = image;
        });
        texture.setImageData(imageData as unknown as TextureCubeImageData);
        runtime.requestFrameRender();
    }).catch(console.error);
    return texture;
}
