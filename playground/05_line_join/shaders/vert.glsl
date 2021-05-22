attribute vec3 a_position;
attribute vec3 a_other;

uniform vec2 u_size;
uniform float u_thickness;

void main() {
    vec2 dir = normalize((a_other.xy - a_position.xy) * u_size) * a_other.z;
    vec2 bidir = vec2(+dir.y, -dir.x);
    vec2 offset = dir * u_thickness * -a_other.z / u_size;
    vec2 bioffset = bidir * u_thickness * a_position.z / u_size;
    gl_Position = vec4(a_position.xy + offset + bioffset, 0.0, 1.0);
}
