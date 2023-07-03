precision mediump float;

#if HAS_MATERIAL
varying highp vec3 v_normal;
varying vec3 v_position;
#endif
#if HAS_COLOR_ATTR
varying vec4 v_color;
#endif
#if HAS_TEXCOORD_ATTR
varying vec2 v_texcoord;
#endif

#if HAS_MATERIAL
uniform vec3 u_eye_position;
uniform vec3 u_light_direction;
uniform float u_material_roughness;
uniform float u_material_metallic;
uniform vec4 u_material_base_color;
#endif
#if HAS_TEXCOORD_ATTR
uniform sampler2D u_texture;
#endif

#if HAS_MATERIAL
#include ./brdf.glsl
#endif

void main() {
#if HAS_COLOR_ATTR
    vec4 base_color = v_color;
#else
    vec4 base_color = vec4(1.0);
#endif
#if HAS_MATERIAL
    base_color *= u_material_base_color;
    vec3 normal = normalize(v_normal);
    vec3 to_light = -u_light_direction;
    vec3 to_eye = normalize(u_eye_position - v_position);
    vec3 color = brdf(
        base_color.rgb, u_material_roughness, u_material_metallic,
        normal, to_eye, to_light
    );
    base_color = vec4(color, base_color.a);
#endif
    gl_FragColor = base_color;
}
