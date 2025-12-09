#version 300 es

uniform mat4 u_view_proj;
uniform mat4 u_model;
uniform mat4 u_model_invtrs;

in vec3 a_position;
in vec3 a_normal;

out vec3 v_position;
out vec3 v_normal;

void main() {
    vec4 position = u_model * vec4(a_position, 1.0);
    gl_Position = u_view_proj * position;
    v_position = position.xyz;
    v_normal = mat3(u_model_invtrs) * a_normal;
}
