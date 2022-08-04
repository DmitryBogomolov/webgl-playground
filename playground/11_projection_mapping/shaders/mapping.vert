attribute vec3 a_position;
attribute vec3 a_normal;

varying vec3 v_normal;

uniform mat4 u_proj;
uniform mat4 u_view;

void main() {
    gl_Position = u_proj * u_view * vec4(a_position, 1.0);
    v_normal = a_normal;
}
