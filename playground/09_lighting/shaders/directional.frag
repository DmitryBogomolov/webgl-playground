#version 300 es
precision mediump float;

uniform vec4 u_color;
uniform vec3 u_light_direction;

in vec3 v_normal;

out vec4 frag_color;

void main() {
    vec3 normal = normalize(v_normal);
    frag_color = vec4(u_color.rgb * dot(normal, -u_light_direction), u_color.a);
}
