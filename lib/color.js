export const BLACK = color(0, 0, 0);
export const WHITE = color(1, 1, 1);

/** 
 * @typedef {Object} Color 
 * @property {number} r
 * @property {number} g
 * @property {number} b
 * @property {number} a
 */

/** @returns {Color} */
export function color(
    /** @type {number} */r, /** @type {number} */g, /** @type {number} */b, /** @type {number} */a = 1,
) {
    return { r, g, b, a };
}
