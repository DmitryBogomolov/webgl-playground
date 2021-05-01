precision mediump float;

uniform sampler2D u_texture;
uniform vec2 u_texcoord;
uniform float u_flag;

varying vec2 v_texcoord;

// Texcoord is either taken from vertex attribute `v_texcoord` (`u_flag = 0`)
// or from uniform `u_texcoord` (`u_flag = 1`).

void main() {
    vec2 texcoord = v_texcoord * (1.0 - u_flag) + u_texcoord * u_flag;
    gl_FragColor = texture2D(u_texture, texcoord);
}
