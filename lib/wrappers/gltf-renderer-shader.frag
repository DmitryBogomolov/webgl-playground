precision mediump float;

varying highp vec3 v_normal;
varying vec4 v_color;
varying vec2 v_texcoord;

uniform sampler2D u_texture;

void main() {
    vec3 normal = normalize(v_normal);
    gl_FragColor = vec4(0, 0, 0, 1);
}
