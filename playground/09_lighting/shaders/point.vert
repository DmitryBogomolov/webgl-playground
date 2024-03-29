attribute vec3 a_position;
attribute vec3 a_normal;

uniform float u_offset;
uniform mat4 u_model_view_proj;
uniform mat4 u_model;
uniform mat4 u_model_inv_trs;
uniform vec3 u_light_position;

varying vec3 v_normal;
varying vec3 v_to_light_direction;

void main() {
    gl_Position = u_model_view_proj * vec4(a_position, 1.0);
    gl_Position.x += u_offset * gl_Position.w;

    v_normal = mat3(u_model_inv_trs) * a_normal;
    v_to_light_direction = u_light_position - (u_model * vec4(a_position, 1)).xyz;
}
