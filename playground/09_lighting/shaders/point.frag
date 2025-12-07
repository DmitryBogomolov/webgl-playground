#version 100
precision mediump float;

uniform vec4 u_color;

varying vec3 v_normal;
varying vec3 v_to_light_direction;

void main() {
    vec3 normal = normalize(v_normal);
    vec3 to_light_direction = normalize(v_to_light_direction);
    gl_FragColor = vec4(u_color.rgb * dot(normal, to_light_direction), u_color.a);
}
