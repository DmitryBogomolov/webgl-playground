#version 300 es
precision mediump float;

uniform vec3 u_color;
uniform vec3 u_light_dir;

in vec3 v_normal;

out vec4 frag_color;

void main() {
    frag_color = vec4(u_color * dot(normalize(v_normal), u_light_dir), 1.0);
}
