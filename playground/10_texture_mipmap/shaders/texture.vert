attribute vec2 a_position;

uniform mat4 u_proj;
uniform float u_distance;
uniform float u_offset;
uniform float u_size;

varying vec2 v_texcoord;

void main() {
    gl_Position = u_proj * vec4(a_position * u_size, -u_distance, 1.0);
    gl_Position.x += u_offset * gl_Position.w;
    v_texcoord = (a_position.xy + vec2(1.0)) * 0.5;
}
