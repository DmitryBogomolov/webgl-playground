precision mediump float;

varying vec3 v_normal;
varying vec4 v_color;
varying vec2 v_texcoord;

uniform sampler2D u_texture;

void main() {
    gl_FragColor = v_color;
}
