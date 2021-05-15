/** left, top, right, bottom */
export type Position = readonly [number, number, number, number];

const uvWidth = document.querySelector('#uv-col')!.clientWidth;
const customWidth = document.querySelector('#custom-col')!.clientWidth;

interface LayoutInfo {
    readonly nearestUV: Position;
    readonly nearestCustom: Position;
    readonly linearUV: Position;
    readonly linearCustom: Position;
}

export function doLayout(container: HTMLElement): LayoutInfo {
    const xOffset = 4 / container.clientWidth;
    const yOffset = 4 / container.clientHeight;
    const xMin = -1 + xOffset;
    const xMax = +1 - xOffset;
    const yMin = -1 + yOffset;
    const yMax = +1 - yOffset;
    const xC = uvWidth / (uvWidth + customWidth) * 2 - 1;
    const yC = 0;
    return {
        nearestUV: [xMin, yC, xC - xOffset, yMax],
        nearestCustom: [xC + xOffset, yC, xMax, yMax],
        linearUV: [xMin, yMin, xC - xOffset, yC],
        linearCustom: [xC + xOffset, yMin, xMax, yC],
    };
}
