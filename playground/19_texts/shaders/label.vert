attribute vec2 a_position;

uniform mat4 u_view_proj;
uniform vec3 u_position;

varying vec2 v_texcoord;

void main() {
    vec4 position = u_view_proj * vec4(u_position, 1.0);
    position.xy += a_position * 0.2;
    gl_Position = position;
    v_texcoord = (a_position + vec2(1.0)) / 2.0;
}
