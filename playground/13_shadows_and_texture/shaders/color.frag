precision mediump float;

varying vec3 v_normal;

uniform vec3 u_color;

const vec3 c_light_dir1 = normalize(vec3(0.0, 2.0, 1.0));
const vec3 c_light_dir2 = normalize(vec3(1.0, -3.0, 0.0));

float get_light_coeff(vec3 normal, vec3 light_dir) {
    return max(0.0, dot(normal, light_dir));
}

void main() {
    vec3 normal = normalize(v_normal);
    float light_coeff = min(get_light_coeff(normal, c_light_dir1) + get_light_coeff(normal, c_light_dir2), 1.0);
    gl_FragColor = vec4(u_color * light_coeff, 1.0);
}
