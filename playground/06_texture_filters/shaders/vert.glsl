#version 300 es

uniform vec2 u_canvas_size;
uniform vec2 u_texture_size;

in vec2 a_position;

out vec2 v_texcoord;

void main() {
    v_texcoord = (a_position + vec2(1.0)) / 2.0;
    vec2 position = a_position * (u_texture_size / u_canvas_size);
    gl_Position = vec4(position, 0.0, 1.0);
}
