attribute vec2 a_position;
attribute vec3 a_color;

uniform mat3 u_transform;
varying vec4 v_color;

void main() {
    vec2 position = (u_transform * vec3(a_position, 1.0)).xy;
    gl_Position = vec4(position, 0.0, 1.0);
    v_color = vec4(a_color, 1.0);
}
