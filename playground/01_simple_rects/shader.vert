attribute vec2 a_position;
attribute vec3 a_color;

varying vec4 color;

void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    color = vec4(a_color, 1.0);
}
