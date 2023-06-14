precision mediump float;

varying highp vec3 v_normal;
varying vec4 v_color;
varying vec2 v_texcoord;
varying vec3 v_position;

uniform vec3 u_eye_position;
uniform vec3 u_light_direction;
uniform float u_material_roughness;
uniform float u_material_metallic;
uniform vec4 u_material_base_color;
uniform sampler2D u_texture;

const float I_PI = 1.0 / acos(-1.0);

// // https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#diffuse-brdf
// vec3 diffuse_brdf(vec3 color) {
//     return I_PI * color;
// }

// float specular_brdf_d(float a2, float n_h) {
//     float c = n_h * n_h * (a2 - 1.0) + 1.0;
//     return I_PI * a2 * max(n_h, 0.0) / (c * c);
// }

// float specular_brdf_v(float a2, float h_x, float n_x) {
//     float c = a2 + (1.0 - a2) * n_x * n_x;
//     return max(h_x, 0.0) / (abs(n_x) + sqrt(c));
// }

// // https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#specular-brdf
// vec3 specular_brdf(float a, float n_h, float h_l, float n_l, float h_v, float n_v) {
//     float a2 = a * a;
//     float d = specular_brdf_d(a2, n_h);
//     float v1 = specular_brdf_v(a2, h_l, n_l);
//     float v2 = specular_brdf_v(a2, h_v, n_v);

//     return vec3(d * v1 * v2);
// }

// // https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#fresnel
// vec3 fresnel_mix(vec3 base, vec3 layer, float ior, float v_h) {
//     float f0 = (1.0 - ior) / (1.0 + ior);
//     f0 = f0 * f0;
//     float fr = f0 + (1.0 - f0) * pow(1.0 - abs(v_h), 5.0);
//     return mix(base, layer, fr);
// }

// // https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#fresnel
// vec3 conductor_fresnel(vec3 brdf, vec3 f0, float v_h) {
//     return brdf * (f0 + (vec3(1.0) - f0) * pow(1.0 - abs(v_h), 5.0));
// }

// // https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#metal-brdf-and-dielectric-brdf
// vec3 brdf(vec3 base_color, float roughness, float metallic, vec3 normal, vec3 to_light, vec3 to_eye) {
//     float a = roughness * roughness;
//     vec3 h = normalize(to_light + to_eye);
//     float n_h = dot(normal, h);
//     float n_l = dot(normal, to_light);
//     float n_v = dot(normal, to_eye);
//     float h_l = dot(h, to_light);
//     float h_v = dot(h, to_eye);

//     vec3 dielectric_specular = specular_brdf(a, n_h, h_l, n_l, h_v, n_v);
//     vec3 dielectric_diffuse = diffuse_brdf(base_color);
//     vec3 dielectric = fresnel_mix(dielectric_diffuse, dielectric_specular, 1.5, h_v);
//     vec3 metal_specular = specular_brdf(a, n_h, h_l, n_l, h_v, n_v);
//     vec3 metal = conductor_fresnel(metal_specular, base_color, h_v);

//     return mix(dielectric, metal, metallic);
// }

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

// LIST
// https://learnopengl.com/code_viewer_gh.php?code=src/6.pbr/1.1.lighting/lighting.cpp
// https://learnopengl.com/code_viewer_gh.php?code=src/6.pbr/1.1.lighting/1.1.pbr.fs
// https://gist.github.com/soma-arc/5d53816885e64628869ed54bfb95e31d
// https://www.khronos.org/assets/uploads/developers/library/2017-gtc/glTF-2.0-and-PBR-GTC_May17.pdf
// https://gist.github.com/galek/53557375251e1a942dfa

const float DIELECTRIC_SPECULAR = 0.04;

// https://www.khronos.org/assets/uploads/developers/library/2017-gtc/glTF-2.0-and-PBR-GTC_May17.pdf
vec3 brdf(vec3 base_color, float roughness, float metallic, vec3 normal, vec3 to_eye, vec3 to_light) {
    float a = roughness * roughness;
    float a2 = a * a;

    vec3 h = normalize(to_light + to_eye);
    float n_h = max(dot(normal, h), 0.0);
    float n_l = max(dot(normal, to_light), 0.0);
    float n_v = max(dot(normal, to_eye), 0.0);
    // float h_l = dot(h, to_light);
    float h_v = max(dot(h, to_eye), 0.0);

    vec3 f0 = mix(vec3(DIELECTRIC_SPECULAR), base_color.rgb, metallic);
    vec3 c_diff = mix(base_color.rgb * (1.0 - DIELECTRIC_SPECULAR), vec3(0.0), metallic);

    vec3 f = f0 + (vec3(1.0) - f0) * pow(1.0 - h_v, 5.0);

    vec3 diffuse = (vec3(1.0) - f) * c_diff * I_PI;

    float g = smith_g(a2, n_l, n_v);
    float d = ggx_d(a2, n_h);

    vec3 specular = (f * g * d) / (4.0 * n_l * n_v);

    return diffuse + specular;
}

void main() {
    vec3 normal = normalize(v_normal);
    vec3 to_light = -u_light_direction;
    vec3 to_eye = normalize(u_eye_position - v_position);
    float roughness = u_material_roughness;
    float metallic = u_material_metallic;

    metallic = 0.0;

    vec3 color = brdf(u_material_base_color.rgb, roughness, metallic, normal, to_eye, to_light);

    // metallic = 0.1;
    // // metallic = 0.1;
    // // roughness = 0.9;

    // float a = roughness * roughness;
    // float a2 = a * a;

    // vec3 h = normalize(to_light + to_eye);
    // float n_h = max(dot(normal, h), 0.0);
    // float n_l = max(dot(normal, to_light), 0.0);
    // float n_v = max(dot(normal, to_eye), 0.0);
    // // float h_l = dot(h, to_light);
    // float h_v = max(dot(h, to_eye), 0.0);

    // vec3 f0 = mix(vec3(DIELECTRIC_SPECULAR), u_material_base_color.rgb, metallic);
    // vec3 c_diff = mix(u_material_base_color.rgb * (1.0 - DIELECTRIC_SPECULAR), vec3(0.0), metallic);

    // vec3 f = f0 + (vec3(1.0) - f0) * pow(1.0 - h_v, 5.0);

    // vec3 diffuse = (vec3(1.0) - f) * c_diff * I_PI;

    // float g = smith_g(a2, n_l, n_v);
    // float d = ggx_d(a2, n_h);

    // vec3 specular = (f * g * d) / (4.0 * n_l * n_v);

    gl_FragColor = vec4(color, 1.0);
}
