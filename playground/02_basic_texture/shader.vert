attribute vec2 a_position;
attribute vec2 a_texcoord;

uniform vec2 u_dir; // (-1, +1), (+1, +1), (-1, -1), (+1, -1)

const vec2 A = vec2(0.4);
const vec2 B = vec2(0.5);

varying vec2 v_texcoord;

void main() {
    gl_Position = vec4(A * a_position + u_dir * B, 0.0, 1.0);
    v_texcoord = a_texcoord;
}
