import {
    Runtime,
    ImageRenderer,
    color, colors, color2uint,
} from 'lib';

/**
 * Draw image util.
 *
 * TODO...
 */
export type DESCRIPTION = never;

const container = document.querySelector<HTMLElement>(PLAYGROUND_ROOT)!;
const runtime = new Runtime(container);
runtime.setDepthTest(true);
runtime.setClearColor(color(0.7, 0.7, 0.7));

const image1 = new ImageRenderer(runtime, 'image/cells');
image1.setTextureUnit(3);
const image2 = new ImageRenderer(runtime, 'image/f-letter');
image2.setTextureUnit(4);
const image3 = new ImageRenderer(runtime, 'image/leaves');
image3.setTextureUnit(5);

{
    const arr = new Uint32Array(8 * 8);
    for (let i = 0; i < 8; ++i) {
        for (let j = 0; j < 8; ++j) {
            let c;
            if ((i + j) % 2) {
                c = colors.CYAN;
            } else {
                c = colors.MAGENTA;
            }
            arr[i * 8 + j] = color2uint(c);
        }
    }
    void image1.setImageData({ data: new Uint8Array(arr.buffer), size: { x: 8, y: 8 } });
}
void image2.setImageData({ url: '/static/f-letter.png' }).then(() => {
    runtime.requestFrameRender();
});
void image3.setImageData({ url: '/static/leaves.jpg' }).then(() => {
    runtime.requestFrameRender();
});

image1.setLocation({
    y2: 100,
    x2: 30,
    width: 200,
    height: 200,
});
image2.setRegion({
    // x1: 256-40,
    // x2: 256-40,
    x1: 40,
    // x2: 40,
    y1: 35,
    y2: 45,
    // rotation: Math.PI * 0.1,
});
image2.setLocation({
    x1: 400,
    // x2: -256,
    y2: 10,
    // rotation: Math.PI / 6,
    // y2: +10,
});
// image.setRotation(Math.PI / 4);
// image.setSize({ x: 256, y: 256 });
image3.setLocation({
    y1: 10,
    x1: 10,
});

const ROTATION_SPEED = (2 * Math.PI) * 0.1;

let angle = 0;

runtime.frameRendered().on((delta) => {
    runtime.clearBuffer('color');

    // angle += ROTATION_SPEED * delta / 1000;
    // // image.setRegion({
    // //     ...image.getRegion(),
    // //     rotation: angle,
    // // });
    // image2.setLocation({
    //     ...image2.getLocation(),
    //     rotation: angle,
    // });

    image1.render();
    image2.render();
    image3.render();

    // runtime.requestFrameRender();
});
