#version 100

attribute vec3 a_position;
attribute vec2 a_texcoord;

varying vec2 v_texcoord;

uniform mat4 u_view_proj;
uniform mat4 u_model;

void main() {
    gl_Position = u_view_proj * u_model * vec4(a_position, 1.0);
    v_texcoord = a_texcoord;
}
