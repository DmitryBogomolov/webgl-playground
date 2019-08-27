precision mediump float;

uniform sampler2D u_texture;
uniform vec2 u_texcoord;
uniform float u_flag;

varying vec2 v_texcoord;

void main() {
    gl_FragColor = texture2D(u_texture, v_texcoord * (1.0 - u_flag) + u_texcoord * u_flag);
}
