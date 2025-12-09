#version 300 es

uniform mat4 u_view_proj;
uniform mat4 u_model;
uniform mat4 u_model_invtrs;
uniform mat4 u_depth_view_proj;
// Light position is required to get direction to light.
// Normal and direction to light are used to shadow only pixels that face light.
uniform vec3 u_light_pos;

in vec3 a_position;
in vec3 a_normal;

out vec3 v_normal;
out vec3 v_light_dir;
out vec4 v_depth_coord;

void main() {
    vec4 position = u_model * vec4(a_position, 1.0);
    gl_Position = u_view_proj * position;
    v_normal = mat3(u_model_invtrs) * a_normal;
    v_light_dir = normalize(u_light_pos - position.xyz);
    v_depth_coord = u_depth_view_proj * position;
}
