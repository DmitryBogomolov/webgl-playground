attribute vec3 a_position;

uniform float u_offset;
uniform mat4 u_proj;
uniform mat4 u_view;
uniform mat4 u_model;

void main() {
    gl_Position = u_proj * u_view * u_model * vec4(a_position, 1.0);
    gl_Position.x += u_offset * gl_Position.w;
}
