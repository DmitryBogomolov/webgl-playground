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
#if HAS_BASE_COLOR_TEXTURE
uniform sampler2D u_base_color_texture;
#endif
#if HAS_METALLIC_ROUGHNESS_TEXTURE
uniform sampler2D u_metallic_roughness_texture;
#endif

#if HAS_MATERIAL
#include "./brdf.glsl"
#endif

void main() {
#if HAS_COLOR_ATTR
    vec4 base_color = v_color;
#else
    vec4 base_color = vec4(1.0);
#endif
#if HAS_BASE_COLOR_TEXTURE
    // Pow 2.2 decodes color from sRGB to RGB space.
    base_color *= pow(texture2D(u_base_color_texture, v_texcoord), vec4(2.2));
#endif
#if HAS_MATERIAL
    base_color *= u_material_base_color;
    float roughness = u_material_roughness;
    float metallic = u_material_metallic;
#if HAS_METALLIC_ROUGHNESS_TEXTURE
    vec4 metallic_roughness = texture2D(u_metallic_roughness_texture, v_texcoord);
    roughness = metallic_roughness.g;
    metallic = metallic_roughness.b;
#endif
    vec3 normal = normalize(v_normal);
    vec3 to_light = -u_light_direction;
    vec3 to_eye = normalize(u_eye_position - v_position);
    vec3 color = brdf(base_color.rgb, roughness, metallic, normal, to_eye, to_light);
    base_color = vec4(color, base_color.a);
#endif
    gl_FragColor = base_color;
}
