attribute vec3 a_position;

uniform mat4 u_view_proj;

void main() {
    gl_Position = u_view_proj * vec4(a_position, 1.0);
}
