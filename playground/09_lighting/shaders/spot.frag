precision mediump float;

uniform vec4 u_color;
uniform vec3 u_light_direction;
uniform float u_light_limit;

varying vec3 v_normal;
varying vec3 v_to_light_direction;

void main() {
    vec3 normal = normalize(v_normal);
    vec3 to_light_direction = normalize(v_to_light_direction);
    float factor = 0.0;
    if (dot(to_light_direction, -u_light_direction) >= u_light_limit) {
        factor = dot(normal, to_light_direction);
    }
    gl_FragColor = vec4(u_color.rgb * factor, u_color.a);
}
