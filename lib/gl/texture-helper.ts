import type { TextureImageData, TextureRawData } from './types/texture';
import type { Vec2 } from '../geometry/types/vec2';
import { vec2 } from '../geometry/vec2';
import { Logger } from '../utils/logger';

function isTextureRawData(source: TextureImageData): source is TextureRawData {
    return 'size' in source && 'data' in source;
}

export function updateTexImage(
    source: TextureImageData, logger: Logger,
    gl: WebGLRenderingContext, target: number, format: number, type: number,
): Vec2 {
    if (isTextureRawData(source)) {
        const { size, data } = source;
        logger.log(
            'set_image_data(size: {0}x{1}, data: {2})', size.x, size.y, data ? data.byteLength : 'null',
        );
        gl.texImage2D(target, 0, format, size.x, size.y, 0, format, type, data);
        return size;
    } else {
        logger.log('set_image_data(source: {0})', source);
        gl.texImage2D(target, 0, format, format, type, source);
        return vec2(source.width, source.height);
    }
}
