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

const image = new ImageRenderer(runtime);
image.useTextureUnit(4);

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
image.setImageData({
    data: new Uint8Array(arr.buffer),
    size: { x: 8, y: 8 },
});

// image.setImageData({ url: '/static/mip-low-res-enlarged.png' }).then(() => {
//     runtime.requestFrameRender();
// });

runtime.frameRendered().on(() => {
    runtime.clearBuffer('color');

    image.render();
});
