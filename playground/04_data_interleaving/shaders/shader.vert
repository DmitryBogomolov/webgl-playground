attribute vec2 a_position;
attribute vec3 a_color;
attribute float a_factor;

varying vec4 v_color;

void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_color = vec4(a_color * a_factor, 1.0);
}
