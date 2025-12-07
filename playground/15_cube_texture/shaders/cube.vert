#version 100

attribute vec3 a_position;

uniform mat4 u_view_proj;

varying vec3 v_normal;

void main() {
    gl_Position = u_view_proj * vec4(a_position, 1.0);
    v_normal = normalize(a_position);
}
