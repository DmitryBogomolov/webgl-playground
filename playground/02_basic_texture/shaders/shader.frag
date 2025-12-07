#version 100
precision mediump float;

uniform sampler2D u_texture;
uniform vec2 u_texcoord;
uniform bool u_use_custom;

varying vec2 v_texcoord;

void main() {
    vec2 texcoord = mix(v_texcoord, u_texcoord, float(u_use_custom));
    gl_FragColor = texture2D(u_texture, texcoord);
}
