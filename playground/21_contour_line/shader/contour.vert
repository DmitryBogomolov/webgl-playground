// xy - point, z - left (-1) or right (+1)
attribute vec3 a_position;
attribute vec2 a_other;

uniform float u_thickness;
uniform vec2 u_canvas_size;

vec2 rotate_left(vec2 v) {
    return vec2(+v.y, -v.x);
}

void main() {
    // [W * H] in pixels maps to [2 * 2] ([-1,+1]*[-1,+1]) in units.
    // Map segment from unit to screen space.
    vec2 segment = (a_other - a_position.xy) * u_canvas_size * 0.5;
    vec2 dir = normalize(segment);
    vec2 normal = -rotate_left(dir);
    // Map offset from screen to unit space.
    vec2 offset = normal * u_thickness / u_canvas_size;
    gl_Position = vec4(a_position.xy + offset * a_position.z, 1.0, 1.0);
}
