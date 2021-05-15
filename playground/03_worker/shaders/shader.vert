attribute vec2 a_position;

uniform float u_scale;

void main() {
    gl_Position = vec4(a_position * u_scale * 0.9, 0.0, 1.0);
}
