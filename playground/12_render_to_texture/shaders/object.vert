#version 300 es

uniform mat4 u_view_proj;
uniform mat4 u_model;

in vec3 a_position;
in vec3 a_normal;

out vec3 v_normal;

void main() {
    gl_Position = u_view_proj * u_model * vec4(a_position, 1.0);
    v_normal = a_normal;
}
