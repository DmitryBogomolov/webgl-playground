attribute vec3 a_position;
attribute vec3 a_color;

uniform mat4 u_transform;
varying vec4 v_color;

void main() {
    gl_Position = u_transform * vec4(a_position, 1.0);
    v_color = vec4(a_color, 1.0);
}
