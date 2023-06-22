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
const float DIELECTRIC_SPECULAR = 0.04;

//#include ./brdf.glsl

void main() {
    vec3 normal = normalize(v_normal);
    vec3 to_light = -u_light_direction;
    vec3 to_eye = normalize(u_eye_position - v_position);
    vec3 color = brdf(
        u_material_base_color.rgb, u_material_roughness, u_material_metallic,
        normal, to_eye, to_light
    );
    gl_FragColor = vec4(color, u_material_base_color.a);
}