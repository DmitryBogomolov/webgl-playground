attribute vec3 a_position;

uniform mat4 u_model_view_proj;

varying vec2 v_texcoord;

void main() {
    gl_Position = u_model_view_proj * vec4(a_position, 1.0);
    v_texcoord = (a_position.xy + vec2(1.0)) * 0.5;
}
