import type { MakeImageData } from './image-maker.types';

export function makeImage(data: MakeImageData): Promise<HTMLImageElement> {
    let src: string;
    if ('url' in data) {
        src = data.url;
    } else if ('base64' in data) {
        src = data.base64;
    } else if ('blob' in data) {
        src = URL.createObjectURL(data.blob);
    } else {
        throw new Error('bad image data');
    }
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.src = src;
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', reject);
    });
}
