attribute vec2 a_position;

varying vec4 color;

void main() {
    gl_Position = vec4(a_position * 0.9, 0.0, 1.0);
}
