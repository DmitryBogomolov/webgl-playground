attribute vec3 a_position;
attribute vec3 a_normal;
attribute vec4 a_color;
attribute vec2 a_texcoord;

uniform mat4 u_view_proj_mat;
uniform mat4 u_world_mat;

varying vec3 v_normal;
varying vec4 v_color;
varying vec2 v_texcoord;

void main() {
    gl_Position = u_view_proj_mat * u_world_mat * vec4(a_position, 1.0);
    v_normal = u_world_mat * a_normal;
    v_color = a_color;
    v_texcoord = a_texcoord;
}
