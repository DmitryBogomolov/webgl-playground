#version 300 es
precision mediump float;

uniform sampler2D u_texture;
uniform highp vec2 u_texture_size;
uniform float u_kernel[9];
uniform float u_kernel_weight;

in vec2 v_texcoord;

out vec4 frag_color;

void main() {
    vec2 one_pixel = 1.0 / u_texture_size;
    vec4 color = (
        texture(u_texture, v_texcoord + one_pixel * vec2(-1, -1)) * u_kernel[0] +
        texture(u_texture, v_texcoord + one_pixel * vec2( 0, -1)) * u_kernel[1] +
        texture(u_texture, v_texcoord + one_pixel * vec2(+1, -1)) * u_kernel[2] +
        texture(u_texture, v_texcoord + one_pixel * vec2(-1,  0)) * u_kernel[3] +
        texture(u_texture, v_texcoord + one_pixel * vec2( 0,  0)) * u_kernel[4] +
        texture(u_texture, v_texcoord + one_pixel * vec2(+1,  0)) * u_kernel[5] +
        texture(u_texture, v_texcoord + one_pixel * vec2(-1, +1)) * u_kernel[6] +
        texture(u_texture, v_texcoord + one_pixel * vec2( 0, +1)) * u_kernel[7] +
        texture(u_texture, v_texcoord + one_pixel * vec2(+1, +1)) * u_kernel[8]
    );
    frag_color = vec4(color.rgb / u_kernel_weight, 1.0);
}
