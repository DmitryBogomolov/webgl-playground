#version 100

attribute vec3 a_position;
attribute vec2 a_texcoord;

varying vec2 v_texcoord;
varying vec4 v_mapping_coord;

uniform float u_offset;
uniform mat4 u_proj;
uniform mat4 u_view;
uniform mat4 u_model;
uniform mat4 u_mapping_mat;

void main() {
    vec4 position = u_model * vec4(a_position, 1.0);
    gl_Position = u_proj * u_view * position;
    gl_Position.x += u_offset * gl_Position.w;
    v_texcoord = a_texcoord;
    // Project position with mapping matrix
    // which is view-projection matrix from the mapping point of view.
    v_mapping_coord = u_mapping_mat * position;
}
