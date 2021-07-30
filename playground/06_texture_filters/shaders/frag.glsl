precision mediump float;

uniform sampler2D u_texture;
uniform highp vec2 u_texture_size;

varying vec2 v_texcoord;

void main() {
    vec2 one_pixel = 1.0 / u_texture_size;
    gl_FragColor = (
        texture2D(u_texture, v_texcoord) +
        texture2D(u_texture, v_texcoord + vec2(+one_pixel.x, 0.0)) +
        texture2D(u_texture, v_texcoord + vec2(-one_pixel.x, 0.0))
    ) / 3.0;
}
