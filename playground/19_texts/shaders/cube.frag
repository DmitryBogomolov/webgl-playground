precision mediump float;

varying vec3 v_normal;

uniform vec3 u_color;

const vec3 light_dir_1 = normalize(vec3(-1.0, -0.5, +1.0));
const vec3 light_dir_2 = normalize(vec3(+2.0, +0.5, +1.0));

float get_light_coeff(vec3 normal, vec3 light_dir) {
    return max(0.0, dot(light_dir, normal));
}

float get_total_light_coeff(vec3 normal) {
    float c1 = get_light_coeff(normal, light_dir_1);
    float c2 = get_light_coeff(normal, light_dir_2);
    return clamp(c1 + c2, 0.2, 1.0);
}

void main() {
    float coeff = get_total_light_coeff(normalize(v_normal));
    gl_FragColor = vec4(u_color * coeff, 1.0);
}
