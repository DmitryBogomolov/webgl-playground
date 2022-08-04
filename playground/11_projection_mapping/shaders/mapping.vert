attribute vec3 a_position;
attribute vec3 a_normal;

varying vec3 v_normal;
varying vec4 v_projected_texcoord;

uniform mat4 u_proj;
uniform mat4 u_view;
uniform mat4 u_texture_mat;

void main() {
    vec4 position = vec4(a_position, 1.0);
    gl_Position = u_proj * u_view * position;
    v_normal = a_normal;
    v_projected_texcoord = u_texture_mat * position;
    vec4 t = gl_Position;
    gl_Position = u_texture_mat * position;
    gl_Position = t;
}
