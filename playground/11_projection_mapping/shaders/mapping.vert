attribute vec3 a_position;
attribute vec2 a_texcoord;

varying vec2 v_texcoord;
varying vec4 v_projected_texcoord;

uniform mat4 u_proj;
uniform mat4 u_view;
uniform mat4 u_texture_mat;

void main() {
    vec4 position = vec4(a_position, 1.0);
    gl_Position = u_proj * u_view * position;
    v_projected_texcoord = u_texture_mat * position;
    v_texcoord = a_texcoord;
}
