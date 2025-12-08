#version 300 es

in vec2 a_position;
in vec3 a_color;
in float a_factor;

out vec4 v_color;

void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_color = vec4(a_color * a_factor, 1.0);
}
