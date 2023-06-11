precision mediump float;

varying highp vec3 v_normal;
varying vec4 v_color;
varying vec2 v_texcoord;

uniform sampler2D u_texture;

const float I_PI = 1 / acos(-1.0);

// https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#diffuse-brdf
vec3 diffuse_brdf(vec3 color) {
    return I_PI * color;
}

float specular_brdf_d(float a2, float n_h) {
    float c = n_h * n_h * (a2 - 1.0) + 1.0;
    return I_PI * a2 * max(n_h, 0.0) / (c * c);
}

float specular_brdf_v(float a2, float h_x, float n_x) {
    float c = a2 + (1.0 - a2) * n_x * n_x;
    return max(h_x, 0.0) / (abs(n_x) + sqrt(c));
}

// https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#specular-brdf
vec3 specular_brdf(float a, float n_h, float h_l, float n_l, float h_v, float n_v) {
    float a2 = a * a;
    float d = specular_brdf_d(a2, n_h);
    float v1 = specular_brdf_v(a2, h_l, n_l);
    float v2 = specular_brdf_v(a2, h_v, n_v);

    return vec3(d * v1 * v2);
}

// https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#fresnel
vec3 fresnel_mix(vec3 base, vec3 layer, float ior, float v_h) {
    float f0 = (1.0 - ior) / (1.0 + ior);
    f0 = f0 * f0;`
    float fr = f0 + (1.0 - f0) * pow(1.0 - abs(v_h), 5.0);
    return mix(base, layer, fr);
}

// https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#fresnel
vec3 conductor_fresnel(vec3 brdf, vec3 f0, float v_h) {
    return brdf * (f0 + (1.0 - f0) * pow(1.0 - abs(v_h), 5.0));
}

// https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#metal-brdf-and-dielectric-brdf
vec3 brdf(vec3 base_color, float roughness, float metallic, vec3 normal, vec3 to_light, vec3 to_eye) {
    float a = roughness * roughness;
    vec3 h = normalize(to_light + to_eye);
    float n_h = dot(normal, h);
    float n_l = dot(normal, to_light);
    float n_v = dot(normal, to_eye);
    float h_l = dot(h, to_light);
    float h_v = dot(h, to_eye);

    vec3 dielectric_specular = specular_brdf(a, n_h, h_l, n_l, h_v, n_v);
    vec3 dielectric_diffuse = diffuse_brdf(base_color);
    vec3 dielectric = fresnel_mix(dielectric_diffuse, dielectric_specular, 1.5, h_v);
    vec3 metal_specular = specular_brdf(a, n_h, h_l, n_l, h_v, n_v);
    vec3 metal = conductor_fresnel(metal_specular, base_color, h_v);

    return mix(dielectric, metal, metallic);
}

void main() {
    vec3 normal = normalize(v_normal);
    gl_FragColor = v_color;
}
