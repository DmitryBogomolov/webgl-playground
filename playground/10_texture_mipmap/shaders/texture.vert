attribute vec2 a_position;

uniform mat4 u_proj;
uniform float u_offset;
uniform vec2 u_size;

varying vec2 v_texcoord;

void main() {
    gl_Position = u_proj * vec4(a_position * u_size, 0.0, 1.0);
    gl_Position.x += u_offset * gl_Position.w;
    v_texcoord = a_position.xy + vec2(0.5);
}
