#version 300 es
precision mediump float;

uniform sampler2D u_texture;
uniform vec2 u_texcoord;
uniform bool u_use_custom;

in vec2 v_texcoord;

out vec4 frag_color;

void main() {
    vec2 texcoord = mix(v_texcoord, u_texcoord, float(u_use_custom));
    frag_color = texture(u_texture, texcoord);
}
