#version 100
precision mediump float;

varying vec3 v_normal;

uniform vec3 u_color;

const vec3 c_light_dir1 = normalize(vec3(0.0, 2.0, 1.0));
const vec3 c_light_dir2 = normalize(vec3(+1.0, 2.0, -1.0));
const vec3 c_light_dir3 = normalize(vec3(-1.0, 2.0, -1.0));

float get_light_coeff(vec3 normal, vec3 light_dir) {
    return max(0.0, dot(normal, light_dir));
}

float get_full_light_coeff(vec3 normal) {
    float c1 = get_light_coeff(normal, c_light_dir1);
    float c2 = get_light_coeff(normal, c_light_dir2);
    float c3 = get_light_coeff(normal, c_light_dir3);
    return min(c1 + c2 + c3, 1.0);
}

void main() {
    vec3 normal = normalize(v_normal);
    gl_FragColor = vec4(u_color * get_full_light_coeff(normal), 1.0);
}
