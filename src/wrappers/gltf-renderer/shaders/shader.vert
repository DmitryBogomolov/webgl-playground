attribute vec3 a_position;
#if HAS_MATERIAL
attribute vec3 a_normal;
#endif
#if HAS_COLOR_ATTR
attribute vec4 a_color;
#endif
#if HAS_TEXCOORD_ATTR
attribute vec2 a_texcoord;
#endif

uniform mat4 u_proj_mat;
uniform mat4 u_view_mat;
uniform mat4 u_world_mat;
#if HAS_MATERIAL
uniform mat4 u_normal_mat;
#endif

#if HAS_MATERIAL
varying vec3 v_normal;
varying vec3 v_position;
#endif
#if HAS_COLOR_ATTR
varying vec4 v_color;
#endif
#if HAS_TEXCOORD_ATTR
varying vec2 v_texcoord;
#endif

void main() {
    vec4 world_position = u_world_mat * vec4(a_position, 1.0);
    gl_Position = u_proj_mat * u_view_mat * world_position;
#if HAS_MATERIAL
    v_normal = mat3(u_normal_mat) * a_normal;
    v_position = world_position.xyz / world_position.w;
#endif
#if HAS_COLOR_ATTR
    v_color = a_color;
#endif
#if HAS_TEXCOORD_ATTR
    v_texcoord = a_texcoord;
#endif
}
