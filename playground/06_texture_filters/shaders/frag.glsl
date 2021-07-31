precision mediump float;

uniform sampler2D u_texture;
uniform highp vec2 u_texture_size;
uniform float u_kernel[9];
uniform float u_kernel_weight;

varying vec2 v_texcoord;

void main() {
    vec2 one_pixel = 1.0 / u_texture_size;
    vec4 color = (
        texture2D(u_texture, v_texcoord + one_pixel * vec2(-1, -1)) * u_kernel[0] +
        texture2D(u_texture, v_texcoord + one_pixel * vec2( 0, -1)) * u_kernel[1] +
        texture2D(u_texture, v_texcoord + one_pixel * vec2(+1, -1)) * u_kernel[2] +
        texture2D(u_texture, v_texcoord + one_pixel * vec2(-1,  0)) * u_kernel[3] +
        texture2D(u_texture, v_texcoord + one_pixel * vec2( 0,  0)) * u_kernel[4] +
        texture2D(u_texture, v_texcoord + one_pixel * vec2(+1,  0)) * u_kernel[5] +
        texture2D(u_texture, v_texcoord + one_pixel * vec2(-1, +1)) * u_kernel[6] +
        texture2D(u_texture, v_texcoord + one_pixel * vec2( 0, +1)) * u_kernel[7] +
        texture2D(u_texture, v_texcoord + one_pixel * vec2(+1, +1)) * u_kernel[8]
    );
    gl_FragColor = vec4(color.rgb / u_kernel_weight, 1.0);
}
