precision mediump float;

varying vec3 v_position;
varying vec3 v_normal;

const vec3 light_pos_1 = vec3(-8.0, +4.0, +5.0);
const vec3 light_pos_2 = vec3(+8.0, -5.0, +5.0);
const vec3 light_pos_3 = vec3(+8.0, +6.0, -5.0);
const vec3 light_pos_4 = vec3(-8.0, -7.0, -5.0);

float get_light_coeff(vec3 pos, vec3 normal, vec3 light_pos) {
    vec3 dir = normalize(light_pos - pos);
    return max(0.0, dot(dir, normal));
}

float get_total_light_coeff(vec3 pos, vec3 normal) {
    float c1 = get_light_coeff(pos, normal, light_pos_1);
    float c2 = get_light_coeff(pos, normal, light_pos_2);
    float c3 = get_light_coeff(pos, normal, light_pos_3);
    float c4 = get_light_coeff(pos, normal, light_pos_4);
    return clamp(c1 + c2 + c3 + c4, 0.2, 1.0);
}

void main() {
    float coeff = get_total_light_coeff(v_position, normalize(v_normal));
    gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
    gl_FragColor.rgb *= coeff;
}
