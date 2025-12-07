#version 100

attribute vec2 a_position;
attribute vec4 a_color;

varying vec4 color;

void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    color = a_color;
}
