precision mediump float;

uniform sampler2D u_texture;
uniform vec2 u_texcoord;
uniform bool u_useCustom;

varying vec2 v_texcoord;

void main() {
    vec2 texcoord = u_useCustom ? u_texcoord : v_texcoord;
    gl_FragColor = texture2D(u_texture, texcoord);
}
