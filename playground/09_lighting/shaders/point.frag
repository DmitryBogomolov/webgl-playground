#version 300 es
precision mediump float;

uniform vec4 u_color;

in vec3 v_normal;
in vec3 v_to_light_direction;

out vec4 frag_color;

void main() {
    vec3 normal = normalize(v_normal);
    vec3 to_light_direction = normalize(v_to_light_direction);
    frag_color = vec4(u_color.rgb * dot(normal, to_light_direction), u_color.a);
}
