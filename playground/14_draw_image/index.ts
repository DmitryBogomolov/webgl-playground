import {
    Runtime,
    ImageRenderer, ImageRendererRawImageData,
    color, colors, color2uint,
} from 'lib';

/**
 * Draw image util.
 *
 * Shows ImageRenderer helper. It renders image on the screen.
 * Location defines image location in viewport. Region defines part of the image that will be rendered.
 */
export type DESCRIPTION = never;

const container = document.querySelector<HTMLElement>(PLAYGROUND_ROOT)!;
const runtime = new Runtime(container);
runtime.setDepthTest(true);
runtime.setClearColor(color(0.7, 0.7, 0.7));

const imageCells = new ImageRenderer(runtime, 'image/cells');
imageCells.setTextureUnit(3);
const imageLetter = new ImageRenderer(runtime, 'image/f-letter');
imageLetter.setTextureUnit(4);
const imageLeaves = new ImageRenderer(runtime, 'image/leaves');
imageLeaves.setTextureUnit(5);

void imageCells.setImageData(generateTextureData());
void imageLetter.setImageData({ url: '/static/f-letter.png' }).then(() => {
    runtime.requestFrameRender();
});
void imageLeaves.setImageData({ url: '/static/leaves.jpg' }).then(() => {
    runtime.requestFrameRender();
});

let step = 0;
const SPEED = 0.1;

runtime.frameRendered().on((delta) => {
    runtime.clearBuffer('color');
    step = (step + SPEED * delta / 1000) % 1;

    render1(imageLeaves, step);
    render2(imageCells, step);
    render3(imageLetter, step);

    runtime.requestFrameRender();
});

function render1(image: ImageRenderer, step: number): void {
    const { y: height } = runtime.viewportSize();
    const size = image.imageSize();

    image.setLocation({
        x1: 10,
        y2: 10,
    });
    image.render();

    image.setLocation({
        x1: 10,
        y1: 10,
        width: size.x * 0.9,
        height: size.y * 0.9,
    });
    image.render();

    const w = size.x * 0.5;
    const h = size.y * 0.5;
    const range = height - (10 + size.y) - (10 + size.y * 0.9) - h;
    image.setLocation({
        x1: 10,
        y2: 10 + size.y + range * (step > 0.5 ? 1 - step : step) * 2,
        width: w,
        height: h,
    });
    image.render();
}

function render2(image: ImageRenderer, step: number): void {
    const { x: width } = runtime.viewportSize();
    const size = image.imageSize();

    image.setLocation({
        x2: 10,
        y2: 10,
        width: size.x,
        height: size.y,
    });
    image.render();

    image.setLocation({
        y2: 10,
        x1: 300,
        width: size.x * 0.9,
        height: size.y * 0.9,
    });
    image.render();

    const w = size.x * 0.75;
    const h = size.y * 0.75;
    const range = width - (10 + size.x) - (300 + size.x * 0.9) - w;
    image.setLocation({
        y2: 10,
        x1: 300 + size.x * 0.9 + range * (step > 0.5 ? 1 - step : step) * 2,
        width: w,
        height: h,
    });
    image.render();
}

function render3(image: ImageRenderer, step: number): void {
    const size = image.imageSize();

    image.setRegion({});
    image.setLocation({
        x2: 10,
        y1: 10,
    });
    image.render();

    image.setLocation({
        x2: 10 + size.x + 60,
        y1: 10 + size.y * 0.1,
        width: size.x * 0.8,
        height: size.y * 0.8,
        rotation: step * Math.PI * 2,
    });
    image.render();

    image.setLocation({
        x2: 10 + size.x + 60 + size.x * 0.8 + 60,
        y1: 10 + 35,
    });
    image.setRegion({
        y1: 35,
        y2: 45,
        rotation: step * Math.PI * 2,
    });
    image.render();
}

function generateTextureData(): ImageRendererRawImageData {
    const SIZE = 8 * 24;
    const arr = new Uint32Array(SIZE * SIZE);
    for (let i = 0; i < SIZE; ++i) {
        const ti = (i / SIZE * 8) | 0;
        for (let j = 0; j < SIZE; ++j) {
            const tj = (j / SIZE * 8) | 0;
            let c;
            if ((ti + tj) % 2) {
                c = colors.CYAN;
            } else {
                c = colors.MAGENTA;
            }
            arr[i * SIZE + j] = color2uint(c);
        }
    }
    return { data: new Uint8Array(arr.buffer), size: { x: SIZE, y: SIZE } };
}
