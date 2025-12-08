#version 300 es

uniform float u_scale;

in vec2 a_position;

void main() {
    gl_Position = vec4(a_position * u_scale * 0.9, 0.0, 1.0);
}
