attribute vec2 a_position;

uniform mat4 u_mat;
uniform mat4 u_texmat;

varying vec2 v_texcoord;

void main() {
    gl_Position = u_mat * vec4(a_position, 0.0, 1.0);
    vec2 texcoord = (a_position + vec2(1.0)) / 2.0;
    v_texcoord = (u_texmat * vec4(texcoord, 0.0, 1.0)).xy;
}
