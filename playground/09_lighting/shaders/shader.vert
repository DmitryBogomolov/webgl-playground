attribute vec3 a_position;
attribute vec3 a_normal;

uniform mat4 u_model_view_proj;

varying vec3 v_normal;

void main() {
    gl_Position = u_model_view_proj * vec4(a_position, 1.0);
    v_normal = a_normal;
}
