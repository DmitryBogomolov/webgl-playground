
float pos_dot(vec3 a, vec3 b) {
    return max(dot(a, b), 0.0);
}

float smith_g1(float a2, float n_x) {
    float c = sqrt(a2 + (1.0 - a2) * n_x * n_x);
    return 2.0 * n_x / (n_x + c);
}

float smith_g(float a2, float n_l, float n_v) {
    return smith_g1(a2, n_l) * smith_g1(a2, n_v);
}

float ggx_d(float a2, float n_h) {
    float c = n_h * n_h * (a2 - 1.0) + 1.0;
    return I_PI * a2 / (c * c);
}

// https://www.khronos.org/assets/uploads/developers/library/2017-gtc/glTF-2.0-and-PBR-GTC_May17.pdf
// https://learnopengl.com/code_viewer_gh.php?code=src/6.pbr/1.1.lighting/lighting.cpp
// https://learnopengl.com/code_viewer_gh.php?code=src/6.pbr/1.1.lighting/1.1.pbr.fs
vec3 brdf(vec3 base_color, float roughness, float metallic, vec3 normal, vec3 to_eye, vec3 to_light) {
    float a = roughness * roughness;
    float a2 = a * a;

    vec3 h = normalize(to_light + to_eye);
    float n_h = pos_dot(normal, h);
    float n_l = pos_dot(normal, to_light);
    float n_v = pos_dot(normal, to_eye);
    float h_v = pos_dot(h, to_eye);

    vec3 f0 = mix(vec3(DIELECTRIC_SPECULAR), base_color.rgb, metallic);
    vec3 c_diff = mix(base_color.rgb * (1.0 - DIELECTRIC_SPECULAR), vec3(0.0), metallic);
    vec3 f = f0 + (vec3(1.0) - f0) * pow(1.0 - h_v, 5.0);

    float g = smith_g(a2, n_l, n_v);
    float d = ggx_d(a2, n_h);

    vec3 diffuse = (vec3(1.0) - f) * c_diff * I_PI;
    vec3 specular = (f * g * d) / (4.0 * n_l * n_v);

    return diffuse + specular;
}
