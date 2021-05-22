attribute vec3 a_position;
attribute vec3 a_other;

float thickness = 0.2;

void main() {
    vec2 dir = normalize(a_other.xy - a_position.xy) * a_other.z;
    vec2 bidir = vec2(+dir.y, -dir.x);
    gl_Position = vec4(a_position.xy + bidir * thickness * a_position.z, 0.0, 1.0);
}
