#version 300 es
precision mediump float;

uniform sampler2D u_texture;
uniform vec4 u_color;

in vec2 v_texcoord;

out vec4 frag_color;

void main() {
    frag_color = texture(u_texture, v_texcoord) * u_color;
}
