#version 100

attribute vec2 a_position;

uniform vec2 u_size;
uniform vec2 u_offset;

varying vec2 v_texcoord;

void main() {
    gl_Position = vec4(u_offset + u_size * a_position, 0.0, 1.0);
    v_texcoord = (a_position + vec2(1.0)) / 2.0;
}
