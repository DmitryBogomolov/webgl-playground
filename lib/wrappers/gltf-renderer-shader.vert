attribute vec3 a_position;
attribute vec3 a_normal;
attribute vec4 a_color;
attribute vec2 a_texcoord;

uniform mat4 u_view_proj;
uniform mat4 u_world;

varying vec3 v_normal;
varying vec4 v_color;
varying vec2 v_texcoord;
varying vec3 v_position;

void main() {
    vec4 world_position = u_world * vec4(a_position, 1.0);
    gl_Position = u_view_proj * world_position;
    v_normal = mat3(u_world) * a_normal;
    v_color = a_color;
    v_texcoord = a_texcoord;
    v_position = world_position.xyz / world_position.w;
}
