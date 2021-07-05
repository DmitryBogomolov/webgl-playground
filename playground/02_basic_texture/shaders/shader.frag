precision mediump float;

uniform sampler2D u_texture;
uniform vec2 u_texcoord;
uniform bool u_use_custom;

varying vec2 v_texcoord;

void main() {
    vec2 texcoord = u_use_custom ? u_texcoord : v_texcoord;
    gl_FragColor = texture2D(u_texture, texcoord);
}
