#version 300 es
precision mediump float;

uniform samplerCube u_texture;

in vec3 v_normal;

out vec4 frag_color;

void main() {
    frag_color = texture(u_texture, normalize(v_normal));
}
