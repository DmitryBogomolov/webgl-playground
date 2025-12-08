#version 300 es

uniform mat4 u_transform;

in vec3 a_position;
in vec3 a_color;

out vec4 v_color;

void main() {
    gl_Position = u_transform * vec4(a_position, 1.0);
    v_color = vec4(a_color, 1.0);
}
