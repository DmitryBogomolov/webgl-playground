attribute vec3 a_position;
attribute vec3 a_normal;

uniform mat4 u_world_view_proj;

void main() {
    gl_Position = vec4(a_normal, 0);
    gl_Position = u_world_view_proj * vec4(a_position, 1.0);
}
