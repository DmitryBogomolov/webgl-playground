attribute vec3 a_position;
attribute vec3 a_normal;

varying vec3 v_normal;

uniform mat4 u_view_proj;
uniform mat4 u_model;
uniform mat4 u_model_invtrs;

void main() {
    gl_Position = u_view_proj * u_model * vec4(a_position, 1.0);
    v_normal = mat3(u_model_invtrs) * a_normal;
}
