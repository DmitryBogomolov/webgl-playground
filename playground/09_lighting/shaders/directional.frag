precision mediump float;

uniform vec4 u_color;
uniform vec3 u_light_direction;

varying vec3 v_normal;

void main() {
    vec3 normal = normalize(v_normal);
    gl_FragColor = vec4(u_color.rgb * dot(normal, -u_light_direction), u_color.a);
}
