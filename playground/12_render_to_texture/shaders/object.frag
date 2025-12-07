#version 100
precision mediump float;

varying vec3 v_normal;

uniform vec3 u_color;
uniform vec3 u_light_dir;

void main() {
    gl_FragColor = vec4(u_color * dot(normalize(v_normal), u_light_dir), 1.0);
}
